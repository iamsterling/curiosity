//! Retained-directory-descriptor filesystem boundary for ADR 0055.

use std::ffi::{CStr, CString, c_char, c_int, c_void};
use std::fs::File;
use std::io::{Read, Write};
use std::os::fd::{AsRawFd, FromRawFd};
use std::os::unix::fs::MetadataExt;
use std::path::{Component, Path};

const O_RDONLY: c_int = 0;
const O_WRONLY: c_int = 1;
const O_CREAT: c_int = 0x0200;
const O_EXCL: c_int = 0x0800;
const O_NOFOLLOW: c_int = 0x0100;
const O_DIRECTORY: c_int = 0x10_0000;
const O_CLOEXEC: c_int = 0x100_0000;
const AT_REMOVEDIR: c_int = 0x0080;
#[cfg(target_os = "macos")]
const RENAME_EXCL: u32 = 0x0000_0004;

#[repr(C)]
struct DarwinDirent {
    inode: u64,
    seek_offset: u64,
    record_length: u16,
    name_length: u16,
    file_type: u8,
    name: [c_char; 1024],
}

enum DirStream {}

unsafe extern "C" {
    fn openat(directory: c_int, path: *const c_char, flags: c_int, ...) -> c_int;
    fn mkdirat(directory: c_int, path: *const c_char, mode: u32) -> c_int;
    fn unlinkat(directory: c_int, path: *const c_char, flags: c_int) -> c_int;
    fn renameat(
        source_directory: c_int,
        source: *const c_char,
        destination_directory: c_int,
        destination: *const c_char,
    ) -> c_int;
    #[cfg(target_os = "macos")]
    fn renameatx_np(
        source_directory: c_int,
        source: *const c_char,
        destination_directory: c_int,
        destination: *const c_char,
        flags: u32,
    ) -> c_int;
    fn dup(descriptor: c_int) -> c_int;
    fn fdopendir(descriptor: c_int) -> *mut DirStream;
    fn readdir(directory: *mut DirStream) -> *mut DarwinDirent;
    fn rewinddir(directory: *mut DirStream);
    fn closedir(directory: *mut DirStream) -> c_int;
    fn write(descriptor: c_int, bytes: *const c_void, length: usize) -> isize;
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(super) struct Identity {
    pub device: u64,
    pub inode: u64,
    pub mode: u32,
    pub owner: u32,
    pub links: u64,
    pub length: u64,
}

impl Identity {
    fn from(file: &File) -> std::io::Result<Self> {
        let metadata = file.metadata()?;
        Ok(Self {
            device: metadata.dev(),
            inode: metadata.ino(),
            mode: metadata.mode(),
            owner: metadata.uid(),
            links: metadata.nlink(),
            length: metadata.len(),
        })
    }
}

pub(super) fn identity_unchanged(before: Identity, after: Identity, expected_length: u64) -> bool {
    before.device == after.device
        && before.inode == after.inode
        && before.mode == after.mode
        && before.owner == after.owner
        && after.links == 1
        && after.length == expected_length
}

#[derive(Debug)]
pub(super) struct Directory {
    file: File,
    identity: Identity,
}

impl Directory {
    pub fn duplicate(&self) -> std::io::Result<Self> {
        Ok(Self {
            file: self.file.try_clone()?,
            identity: self.identity,
        })
    }
    pub fn open_absolute(path: &Path) -> std::io::Result<Self> {
        if !path.is_absolute() {
            return Err(std::io::Error::from_raw_os_error(22));
        }
        let mut current = Self::open_raw(-2, "/")?;
        for component in path.components() {
            match component {
                Component::RootDir => {}
                Component::Normal(name) => {
                    let text = name.to_str().ok_or_else(invalid)?;
                    current = current.open_dir(text)?;
                }
                _ => return Err(invalid()),
            }
        }
        Ok(current)
    }

    fn open_raw(parent: c_int, name: &str) -> std::io::Result<Self> {
        let name = if name == "/" {
            CString::new("/").expect("fixed path")
        } else {
            component(name)?
        };
        // SAFETY: name is NUL-terminated; returned descriptor is uniquely owned.
        let descriptor = unsafe {
            openat(
                parent,
                name.as_ptr(),
                O_RDONLY | O_DIRECTORY | O_NOFOLLOW | O_CLOEXEC,
            )
        };
        if descriptor < 0 {
            return Err(std::io::Error::last_os_error());
        }
        // SAFETY: openat returned a new live descriptor.
        let file = unsafe { File::from_raw_fd(descriptor) };
        let identity = Identity::from(&file)?;
        if identity.mode & 0o170000 != 0o040000 {
            return Err(invalid());
        }
        Ok(Self { file, identity })
    }

    pub fn open_dir(&self, name: &str) -> std::io::Result<Self> {
        Self::open_raw(self.file.as_raw_fd(), name)
    }

    pub fn open_file(&self, name: &str, writable: bool) -> std::io::Result<OpenedFile> {
        let name = component(name)?;
        let flags = if writable { 2 } else { O_RDONLY } | O_NOFOLLOW | O_CLOEXEC;
        // SAFETY: retained parent descriptor and NUL-terminated component are valid.
        let descriptor = unsafe { openat(self.file.as_raw_fd(), name.as_ptr(), flags) };
        if descriptor < 0 {
            return Err(std::io::Error::last_os_error());
        }
        // SAFETY: openat returned a new live descriptor.
        let file = unsafe { File::from_raw_fd(descriptor) };
        OpenedFile::new(file)
    }

    pub fn create_file(&self, name: &str) -> std::io::Result<OpenedFile> {
        let name = component(name)?;
        // SAFETY: retained parent descriptor and NUL-terminated component are valid.
        let descriptor = unsafe {
            openat(
                self.file.as_raw_fd(),
                name.as_ptr(),
                O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW | O_CLOEXEC,
                0o600u32,
            )
        };
        if descriptor < 0 {
            return Err(std::io::Error::last_os_error());
        }
        // SAFETY: openat returned a new live descriptor.
        let file = unsafe { File::from_raw_fd(descriptor) };
        OpenedFile::new(file)
    }

    pub fn create_dir(&self, name: &str) -> std::io::Result<Self> {
        let name_c = component(name)?;
        // SAFETY: retained parent descriptor and NUL-terminated component are valid.
        if unsafe { mkdirat(self.file.as_raw_fd(), name_c.as_ptr(), 0o700) } != 0 {
            return Err(std::io::Error::last_os_error());
        }
        self.open_dir(name)
    }

    pub fn names(&self) -> std::io::Result<Vec<String>> {
        // SAFETY: dup returns an independently owned descriptor on success.
        let copied = unsafe { dup(self.file.as_raw_fd()) };
        if copied < 0 {
            return Err(std::io::Error::last_os_error());
        }
        // SAFETY: fdopendir takes ownership of copied.
        let stream = unsafe { fdopendir(copied) };
        if stream.is_null() {
            // SAFETY: copied is still ours when fdopendir fails.
            drop(unsafe { File::from_raw_fd(copied) });
            return Err(std::io::Error::last_os_error());
        }
        // SAFETY: stream is a live directory stream; rewind makes repeated
        // descriptor-relative inventories independent of the shared dup offset.
        unsafe { rewinddir(stream) };
        let mut result = Vec::new();
        loop {
            // SAFETY: stream remains live until closed below.
            let entry = unsafe { readdir(stream) };
            if entry.is_null() {
                break;
            }
            // SAFETY: Darwin guarantees d_name is NUL-terminated in a live dirent.
            let name = unsafe { CStr::from_ptr((*entry).name.as_ptr()) }
                .to_str()
                .map_err(|_| invalid())?;
            if name != "." && name != ".." {
                result.push(name.to_owned());
            }
        }
        // SAFETY: stream is live and closed exactly once.
        if unsafe { closedir(stream) } != 0 {
            return Err(std::io::Error::last_os_error());
        }
        result.sort();
        self.verify_namespace_identity()?;
        Ok(result)
    }

    pub fn rename_exclusive(
        &self,
        source: &str,
        destination_directory: &Self,
        destination: &str,
    ) -> std::io::Result<()> {
        let source = component(source)?;
        let destination = component(destination)?;
        #[cfg(target_os = "macos")]
        let status = unsafe {
            renameatx_np(
                self.file.as_raw_fd(),
                source.as_ptr(),
                destination_directory.file.as_raw_fd(),
                destination.as_ptr(),
                RENAME_EXCL,
            )
        };
        #[cfg(not(target_os = "macos"))]
        let status = -1;
        if status != 0 {
            return Err(std::io::Error::last_os_error());
        }
        Ok(())
    }

    pub fn rename_replace(
        &self,
        source: &str,
        destination_directory: &Self,
        destination: &str,
    ) -> std::io::Result<()> {
        let source = component(source)?;
        let destination = component(destination)?;
        // SAFETY: retained directory descriptors and component names are valid.
        if unsafe {
            renameat(
                self.file.as_raw_fd(),
                source.as_ptr(),
                destination_directory.file.as_raw_fd(),
                destination.as_ptr(),
            )
        } != 0
        {
            return Err(std::io::Error::last_os_error());
        }
        Ok(())
    }

    pub fn unlink_file(&self, name: &str) -> std::io::Result<()> {
        self.unlink(name, 0)
    }

    pub fn unlink_dir(&self, name: &str) -> std::io::Result<()> {
        self.unlink(name, AT_REMOVEDIR)
    }

    fn unlink(&self, name: &str, flags: c_int) -> std::io::Result<()> {
        let name = component(name)?;
        // SAFETY: retained parent descriptor and component name are valid.
        if unsafe { unlinkat(self.file.as_raw_fd(), name.as_ptr(), flags) } != 0 {
            return Err(std::io::Error::last_os_error());
        }
        Ok(())
    }

    pub fn sync(&self) -> std::io::Result<()> {
        self.file.sync_all()
    }

    pub fn identity(&self) -> Identity {
        self.identity
    }

    pub fn verify_namespace_identity(&self) -> std::io::Result<()> {
        let current = Identity::from(&self.file)?;
        if current.device != self.identity.device
            || current.inode != self.identity.inode
            || current.mode != self.identity.mode
            || current.owner != self.identity.owner
        {
            return Err(invalid());
        }
        Ok(())
    }
}

pub(super) struct OpenedFile {
    file: File,
    identity: Identity,
}

impl OpenedFile {
    fn new(file: File) -> std::io::Result<Self> {
        let identity = Identity::from(&file)?;
        if identity.mode & 0o170000 != 0o100000 {
            return Err(invalid());
        }
        Ok(Self { file, identity })
    }

    pub fn identity(&self) -> Identity {
        self.identity
    }

    pub fn read_exact_bounded(mut self, maximum: u64) -> std::io::Result<Vec<u8>> {
        if self.identity.length > maximum {
            return Err(std::io::Error::from_raw_os_error(27));
        }
        let length = usize::try_from(self.identity.length).map_err(|_| invalid())?;
        let mut bytes = Vec::with_capacity(length);
        self.file.read_to_end(&mut bytes)?;
        if bytes.len() != length || Identity::from(&self.file)? != self.identity {
            return Err(invalid());
        }
        Ok(bytes)
    }

    pub fn write_all_checked(&mut self, bytes: &[u8]) -> std::io::Result<()> {
        let mut offset = 0usize;
        while offset < bytes.len() {
            // SAFETY: buffer is valid for the remaining length and descriptor is live.
            let written = unsafe {
                write(
                    self.file.as_raw_fd(),
                    bytes[offset..].as_ptr().cast(),
                    bytes.len() - offset,
                )
            };
            if written <= 0 {
                return Err(std::io::Error::last_os_error());
            }
            offset = offset.checked_add(written as usize).ok_or_else(invalid)?;
        }
        self.file.flush()?;
        Ok(())
    }

    pub fn sync(&self) -> std::io::Result<()> {
        self.file.sync_all()
    }

    pub fn file(&self) -> &File {
        &self.file
    }

    pub fn verify_final(&self, expected_length: u64) -> std::io::Result<()> {
        let identity = Identity::from(&self.file)?;
        if !identity_unchanged(self.identity, identity, expected_length) {
            return Err(invalid());
        }
        Ok(())
    }
}

fn component(name: &str) -> std::io::Result<CString> {
    if name.is_empty() || name == "." || name == ".." || name.as_bytes().contains(&b'/') {
        return Err(invalid());
    }
    CString::new(name).map_err(|_| invalid())
}

fn invalid() -> std::io::Error {
    std::io::Error::from_raw_os_error(22)
}
