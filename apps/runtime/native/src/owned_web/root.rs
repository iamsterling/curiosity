use std::collections::BTreeMap;
use std::ffi::CString;
use std::fs::{self, File, OpenOptions};
use std::os::fd::{AsRawFd, FromRawFd};
use std::os::unix::fs::{DirBuilderExt, MetadataExt, OpenOptionsExt};
use std::path::{Component, Path, PathBuf};

const NOFOLLOW: i32 = 0x0000_0100;
const DIRECTORY: i32 = 0x0010_0000;
const CREATE: i32 = 0x0000_0200;
const EXCLUSIVE: i32 = 0x0000_0800;
const WRITE_ONLY: i32 = 0x0000_0001;
const CLOSE_ON_EXEC: i32 = 0x0100_0000;
const REMOVE_DIRECTORY: i32 = 0x0000_0080;

unsafe extern "C" {
    fn openat(directory: i32, path: *const i8, flags: i32, ...) -> i32;
    fn unlinkat(directory: i32, path: *const i8, flags: i32) -> i32;
    fn getuid() -> u32;
}

const PRIVATE_SUBTREE: &str = ".owned-web-qualification-v1";
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(super) struct FileIdentity {
    device: u64,
    inode: u64,
}

pub(super) type DatabaseIdentity = BTreeMap<String, FileIdentity>;

pub(super) struct SecuredRoot {
    path: PathBuf,
    handle: File,
    approved_path: PathBuf,
    approved_handle: File,
    objects: File,
    records: File,
    private_created: bool,
    objects_created: bool,
    records_created: bool,
    owned_database: DatabaseIdentity,
}

impl SecuredRoot {
    pub(super) fn open(value: &str) -> Result<Self, &'static str> {
        let candidate = Path::new(value);
        if !candidate.is_absolute() {
            return Err("CONTROL_ROOT_NOT_ABSOLUTE");
        }
        reject_lexical(candidate)?;
        reject_symlink_components(candidate)?;
        let source = source_root()?;
        if candidate.starts_with(&source) {
            return Err("CONTROL_ROOT_IN_SOURCE_TREE");
        }
        let candidate_metadata = fs::symlink_metadata(candidate).map_err(|error| {
            if error.kind() == std::io::ErrorKind::NotFound {
                "CONTROL_ROOT_NOT_FOUND"
            } else {
                "CONTROL_ROOT_INSPECTION_FAILED"
            }
        })?;
        // SAFETY: getuid has no preconditions and returns the invoking process UID.
        validate_operator_root(&candidate_metadata, unsafe { getuid() })?;
        let approved_handle = open_directory(candidate)?;
        let canonical = candidate
            .canonicalize()
            .map_err(|_| "CONTROL_ROOT_CANONICALIZE_FAILED")?;
        if canonical.starts_with(source) {
            return Err("CONTROL_ROOT_IN_SOURCE_TREE");
        }
        verify_identity(candidate, &approved_handle)?;
        let private = canonical.join(PRIVATE_SUBTREE);
        let private_created = match fs::symlink_metadata(&private) {
            Ok(metadata) if metadata.file_type().is_symlink() || !metadata.is_dir() => {
                return Err("CONTROL_CHILD_TYPE_INVALID");
            }
            Ok(_) => false,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                let mut builder = fs::DirBuilder::new();
                builder.mode(0o700);
                builder
                    .create(&private)
                    .map_err(|_| "CONTROL_CHILD_CREATE_FAILED")?;
                true
            }
            Err(_) => return Err("CONTROL_CHILD_INSPECTION_FAILED"),
        };
        let handle = open_directory(&private)?;
        if handle
            .metadata()
            .map_err(|_| "CONTROL_PRIVATE_MODE_INVALID")?
            .mode()
            & 0o777
            != 0o700
        {
            return Err("CONTROL_PRIVATE_MODE_INVALID");
        }
        let provisional = Self {
            path: private.clone(),
            handle,
            approved_path: canonical,
            approved_handle,
            objects: open_directory(&private)?,
            records: open_directory(&private)?,
            private_created,
            objects_created: false,
            records_created: false,
            owned_database: BTreeMap::new(),
        };
        let objects_created = provisional.ensure_directory("objects")?;
        let records_created = provisional.ensure_directory("records")?;
        let mut root = Self {
            objects: open_directory(&provisional.path.join("objects"))?,
            records: open_directory(&provisional.path.join("records"))?,
            objects_created,
            records_created,
            ..provisional
        };
        if let Err(error) = root.verify().and_then(|()| root.verify_database_children()) {
            root.cleanup_invocation()?;
            return Err(error);
        }
        Ok(root)
    }

    pub(super) fn path(&self) -> &Path {
        &self.path
    }

    pub(super) fn child(&self, directory: &str, name: &str) -> Result<PathBuf, &'static str> {
        if !matches!(directory, "objects" | "records")
            || name.is_empty()
            || !name
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'.'))
        {
            return Err("CONTROL_CHILD_NAME_INVALID");
        }
        self.verify_directory(directory)?;
        Ok(self.path.join(directory).join(name))
    }

    pub(super) fn open_child(
        &self,
        directory: &str,
        name: &str,
        write: bool,
        create_new: bool,
    ) -> Result<File, &'static str> {
        let path = self.child(directory, name)?;
        let handle = if directory == "objects" {
            &self.objects
        } else {
            &self.records
        };
        let relative = CString::new(name).map_err(|_| "CONTROL_CHILD_NAME_INVALID")?;
        let mut flags = NOFOLLOW | CLOSE_ON_EXEC;
        if write {
            flags |= WRITE_ONLY;
        }
        if create_new {
            flags |= CREATE | EXCLUSIVE;
        }
        // SAFETY: the secured directory descriptor and relative C string are live.
        let descriptor = unsafe { openat(handle.as_raw_fd(), relative.as_ptr(), flags, 0o600) };
        if descriptor < 0 {
            return Err("CONTROL_CHILD_OPEN_FAILED");
        }
        // SAFETY: openat returned a newly owned descriptor.
        let file = unsafe { File::from_raw_fd(descriptor) };
        let opened = file.metadata().map_err(|_| "CONTROL_CHILD_OPEN_FAILED")?;
        let opened_identity = identity(&opened);
        let valid = fs::symlink_metadata(path).is_ok_and(|named| {
            !named.file_type().is_symlink()
                && opened.is_file()
                && identity(&named) == opened_identity
        });
        if !valid {
            drop(file);
            if create_new {
                remove_owned(handle, name, opened_identity)?;
            }
            return Err("CONTROL_CHILD_IDENTITY_CHANGED");
        }
        Ok(file)
    }

    pub(super) fn child_identity(file: &File) -> Result<FileIdentity, &'static str> {
        let metadata = file.metadata().map_err(|_| "CONTROL_CHILD_OPEN_FAILED")?;
        Ok(identity(&metadata))
    }

    pub(super) fn remove_owned_child(
        &self,
        directory: &str,
        name: &str,
        expected: FileIdentity,
    ) -> Result<(), &'static str> {
        let handle = match directory {
            "objects" => &self.objects,
            "records" => &self.records,
            _ => return Err("CONTROL_CHILD_NAME_INVALID"),
        };
        remove_owned(handle, name, expected)
    }

    pub(super) fn database_path(&self) -> Result<PathBuf, &'static str> {
        self.verify()?;
        self.verify_database_children()?;
        let path = self.path.join("control.sqlite3");
        if let Ok(metadata) = fs::symlink_metadata(&path)
            && (metadata.file_type().is_symlink() || !metadata.is_file())
        {
            return Err("CONTROL_DATABASE_TYPE_INVALID");
        }
        Ok(path)
    }

    pub(super) fn verify(&self) -> Result<(), &'static str> {
        verify_identity(&self.approved_path, &self.approved_handle)?;
        verify_identity(&self.path, &self.handle)?;
        self.verify_directory("objects")?;
        self.verify_directory("records")?;
        self.verify_database_children()
    }

    pub(super) fn database_identity(&self) -> Result<DatabaseIdentity, &'static str> {
        let mut result = BTreeMap::new();
        for name in [
            "control.sqlite3",
            "control.sqlite3-wal",
            "control.sqlite3-shm",
        ] {
            let path = self.path.join(name);
            if let Ok(metadata) = fs::symlink_metadata(path) {
                if metadata.file_type().is_symlink() || !metadata.is_file() {
                    return Err("CONTROL_DATABASE_TYPE_INVALID");
                }
                result.insert(name.into(), identity(&metadata));
            }
        }
        if !result.contains_key("control.sqlite3") {
            return Err("CONTROL_DATABASE_TYPE_INVALID");
        }
        Ok(result)
    }

    pub(super) fn database_snapshot(&self) -> Result<DatabaseIdentity, &'static str> {
        let mut result = BTreeMap::new();
        for name in database_names() {
            let relative = CString::new(name).map_err(|_| "CONTROL_DATABASE_TYPE_INVALID")?;
            // SAFETY: the retained private-directory descriptor and fixed name are valid.
            let descriptor = unsafe {
                openat(
                    self.handle.as_raw_fd(),
                    relative.as_ptr(),
                    NOFOLLOW | CLOSE_ON_EXEC,
                )
            };
            if descriptor < 0 {
                if std::io::Error::last_os_error().kind() == std::io::ErrorKind::NotFound {
                    continue;
                }
                return Err("CONTROL_DATABASE_TYPE_INVALID");
            }
            // SAFETY: openat returned a newly owned descriptor.
            let file = unsafe { File::from_raw_fd(descriptor) };
            let metadata = file
                .metadata()
                .map_err(|_| "CONTROL_DATABASE_TYPE_INVALID")?;
            if !metadata.is_file() {
                return Err("CONTROL_DATABASE_TYPE_INVALID");
            }
            result.insert(name.to_owned(), identity(&metadata));
        }
        Ok(result)
    }

    pub(super) fn record_owned_database(
        &mut self,
        before: &DatabaseIdentity,
    ) -> Result<(), &'static str> {
        let after = self.database_snapshot()?;
        for (name, identity) in after {
            if !before.contains_key(&name) {
                self.owned_database.insert(name, identity);
            }
        }
        Ok(())
    }

    pub(super) fn commit_invocation(&mut self) {
        self.private_created = false;
        self.objects_created = false;
        self.records_created = false;
        self.owned_database.clear();
    }

    pub(super) fn cleanup_invocation(&mut self) -> Result<(), &'static str> {
        let mut failed = false;
        for (name, identity) in std::mem::take(&mut self.owned_database) {
            failed |= remove_owned(&self.handle, &name, identity).is_err();
        }
        if self.records_created {
            failed |= remove_empty_directory(&self.handle, "records").is_err();
            self.records_created = false;
        }
        if self.objects_created {
            failed |= remove_empty_directory(&self.handle, "objects").is_err();
            self.objects_created = false;
        }
        if self.private_created {
            failed |= remove_empty_directory(&self.approved_handle, PRIVATE_SUBTREE).is_err();
            self.private_created = false;
        }
        if failed {
            Err("CONTROL_CHILD_CLEANUP_UNPROVEN")
        } else {
            Ok(())
        }
    }
    pub(super) fn verify_database_identity(
        &self,
        expected: &DatabaseIdentity,
    ) -> Result<(), &'static str> {
        self.verify()?;
        if &self.database_identity()? != expected {
            return Err("CONTROL_DATABASE_IDENTITY_CHANGED");
        }
        Ok(())
    }

    pub(super) fn verify_database_children(&self) -> Result<(), &'static str> {
        for entry in fs::read_dir(&self.path).map_err(|_| "CONTROL_ROOT_INSPECTION_FAILED")? {
            let entry = entry.map_err(|_| "CONTROL_ROOT_INSPECTION_FAILED")?;
            let name = entry
                .file_name()
                .into_string()
                .map_err(|_| "CONTROL_CHILD_NAME_INVALID")?;
            let kind = entry
                .file_type()
                .map_err(|_| "CONTROL_ROOT_INSPECTION_FAILED")?;
            match name.as_str() {
                "objects" | "records" if kind.is_dir() && !kind.is_symlink() => {}
                "control.sqlite3" | "control.sqlite3-wal" | "control.sqlite3-shm"
                    if kind.is_file() && !kind.is_symlink() => {}
                "objects"
                | "records"
                | "control.sqlite3"
                | "control.sqlite3-wal"
                | "control.sqlite3-shm" => return Err("CONTROL_CHILD_TYPE_INVALID"),
                _ => return Err("CONTROL_CHILD_NAME_INVALID"),
            }
        }
        Ok(())
    }

    fn ensure_directory(&self, name: &str) -> Result<bool, &'static str> {
        let path = self.path.join(name);
        match fs::symlink_metadata(&path) {
            Ok(metadata) if metadata.file_type().is_symlink() || !metadata.is_dir() => {
                Err("CONTROL_CHILD_TYPE_INVALID")
            }
            Ok(_) => Ok(false),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => fs::create_dir(&path)
                .map(|()| true)
                .map_err(|_| "CONTROL_CHILD_CREATE_FAILED"),
            Err(_) => Err("CONTROL_CHILD_INSPECTION_FAILED"),
        }
    }

    fn verify_directory(&self, name: &str) -> Result<(), &'static str> {
        let path = self.path.join(name);
        let handle = if name == "objects" {
            &self.objects
        } else {
            &self.records
        };
        verify_identity(&path, handle).map_err(|_| "CONTROL_CHILD_IDENTITY_CHANGED")
    }
}

fn database_names() -> [&'static str; 3] {
    [
        "control.sqlite3",
        "control.sqlite3-wal",
        "control.sqlite3-shm",
    ]
}

fn identity(metadata: &fs::Metadata) -> FileIdentity {
    FileIdentity {
        device: metadata.dev(),
        inode: metadata.ino(),
    }
}

fn remove_owned(parent: &File, name: &str, expected: FileIdentity) -> Result<(), &'static str> {
    let relative = CString::new(name).map_err(|_| "CONTROL_CHILD_CLEANUP_FAILED")?;
    // SAFETY: the retained parent descriptor and validated relative name are live.
    let descriptor = unsafe {
        openat(
            parent.as_raw_fd(),
            relative.as_ptr(),
            NOFOLLOW | CLOSE_ON_EXEC,
        )
    };
    if descriptor < 0 {
        return if std::io::Error::last_os_error().kind() == std::io::ErrorKind::NotFound {
            Ok(())
        } else {
            Err("CONTROL_CHILD_CLEANUP_UNPROVEN")
        };
    }
    // SAFETY: openat returned a newly owned descriptor.
    let opened = unsafe { File::from_raw_fd(descriptor) };
    if identity(
        &opened
            .metadata()
            .map_err(|_| "CONTROL_CHILD_CLEANUP_UNPROVEN")?,
    ) != expected
    {
        return Err("CONTROL_CHILD_CLEANUP_UNPROVEN");
    }
    // SAFETY: the retained parent descriptor and relative name are valid.
    if unsafe { unlinkat(parent.as_raw_fd(), relative.as_ptr(), 0) } != 0 {
        return Err("CONTROL_CHILD_CLEANUP_UNPROVEN");
    }
    if opened
        .metadata()
        .map_err(|_| "CONTROL_CHILD_CLEANUP_UNPROVEN")?
        .nlink()
        != 0
    {
        return Err("CONTROL_CHILD_CLEANUP_UNPROVEN");
    }
    Ok(())
}

fn remove_empty_directory(parent: &File, name: &str) -> Result<(), &'static str> {
    let relative = CString::new(name).map_err(|_| "CONTROL_CHILD_CLEANUP_FAILED")?;
    // SAFETY: the retained parent descriptor and fixed relative name are valid.
    if unsafe { unlinkat(parent.as_raw_fd(), relative.as_ptr(), REMOVE_DIRECTORY) } == 0
        || std::io::Error::last_os_error().kind() == std::io::ErrorKind::NotFound
    {
        Ok(())
    } else {
        Err("CONTROL_CHILD_CLEANUP_UNPROVEN")
    }
}

fn open_directory(path: &Path) -> Result<File, &'static str> {
    OpenOptions::new()
        .read(true)
        .custom_flags(NOFOLLOW | DIRECTORY)
        .open(path)
        .map_err(|_| "CONTROL_ROOT_TYPE_INVALID")
}

pub(super) fn validate_operator_root(
    metadata: &fs::Metadata,
    invoking_uid: u32,
) -> Result<(), &'static str> {
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err("CONTROL_ROOT_TYPE_INVALID");
    }
    if metadata.uid() != invoking_uid {
        return Err("CONTROL_ROOT_OWNER_INVALID");
    }
    if metadata.mode() & 0o777 != 0o700 {
        return Err("CONTROL_ROOT_MODE_INVALID");
    }
    Ok(())
}

fn verify_identity(path: &Path, handle: &File) -> Result<(), &'static str> {
    let named = fs::symlink_metadata(path).map_err(|_| "CONTROL_ROOT_IDENTITY_CHANGED")?;
    let opened = handle
        .metadata()
        .map_err(|_| "CONTROL_ROOT_IDENTITY_CHANGED")?;
    if named.file_type().is_symlink()
        || !named.is_dir()
        || named.dev() != opened.dev()
        || named.ino() != opened.ino()
    {
        return Err("CONTROL_ROOT_IDENTITY_CHANGED");
    }
    Ok(())
}

fn source_root() -> Result<PathBuf, &'static str> {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(Path::parent)
        .and_then(Path::parent)
        .ok_or("CONTROL_SOURCE_ROOT_INVALID")?
        .canonicalize()
        .map_err(|_| "CONTROL_SOURCE_ROOT_INVALID")
}

fn reject_lexical(path: &Path) -> Result<(), &'static str> {
    if path
        .components()
        .any(|component| matches!(component, Component::ParentDir | Component::CurDir))
    {
        return Err("CONTROL_PATH_TRAVERSAL");
    }
    Ok(())
}

fn reject_symlink_components(path: &Path) -> Result<(), &'static str> {
    let mut current = PathBuf::new();
    for component in path.components() {
        current.push(component.as_os_str());
        match fs::symlink_metadata(&current) {
            Ok(metadata) if metadata.file_type().is_symlink() => {
                return Err("CONTROL_PATH_SYMLINK");
            }
            Ok(_) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => break,
            Err(_) => return Err("CONTROL_PATH_INSPECTION_FAILED"),
        }
    }
    Ok(())
}
