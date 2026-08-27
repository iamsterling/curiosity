use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::io::{self, BufRead, Read, Write};
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicI32, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

#[cfg(unix)]
use std::ffi::CString;
#[cfg(unix)]
use std::os::fd::{AsRawFd, FromRawFd, OwnedFd};
#[cfg(unix)]
use std::os::unix::ffi::OsStrExt;
#[cfg(unix)]
use std::os::unix::fs::MetadataExt;
#[cfg(unix)]
use std::os::unix::process::{CommandExt, ExitStatusExt};

const MAX_FILE_BYTES: u64 = 1024 * 1024;
const MAX_FRAME_BYTES: usize = 64 * 1024;
const MAX_OUTPUT_BYTES: usize = 32 * 1024;
const MAX_SEARCH_ENTRIES: usize = 20_000;
const MAX_PROCESS_OUTPUT_BYTES: usize = 8 * 1024;
const MAX_MUTATION_BYTES: usize = 32 * 1024;
const PROTOCOL_VERSION: u64 = 4;
type WorkspaceOperation = fn(&Path, &serde_json::Map<String, Value>) -> Result<Value, &'static str>;

#[derive(Clone)]
struct ProcessProfile {
    allowed_arguments: Vec<Vec<String>>,
    allowed_cwds: HashMap<String, PathBuf>,
    environment: Vec<(String, String)>,
    executable: PathBuf,
    executable_sha256: String,
    maximum_output_bytes: usize,
    maximum_timeout_ms: u64,
}

#[derive(Clone)]
struct GitProfile {
    executable: PathBuf,
    executable_sha256: String,
    expected_head: String,
    git_directory: PathBuf,
    maximum_output_bytes: usize,
    repository_identity: String,
    worktree_root: Option<WorktreeRoot>,
}

#[derive(Clone)]
struct WorktreeRoot {
    handle: Arc<fs::File>,
    identity: String,
    path: PathBuf,
}

#[cfg(unix)]
static ACTIVE_PROCESS_GROUP: AtomicI32 = AtomicI32::new(0);
static PROCESS_CANCEL_REQUESTED: AtomicBool = AtomicBool::new(false);

#[cfg(unix)]
unsafe extern "C" {
    fn kill(pid: i32, signal: i32) -> i32;
    fn signal(signal: i32, handler: usize) -> usize;
}

#[cfg(unix)]
extern "C" fn process_signal_handler(_: i32) {
    let escalation = PROCESS_CANCEL_REQUESTED.swap(true, Ordering::SeqCst);
    let process_group = ACTIVE_PROCESS_GROUP.load(Ordering::SeqCst);
    if process_group > 0 {
        // SAFETY: POSIX kill is async-signal-safe; the negative PID targets only the active child group.
        unsafe {
            kill(-process_group, if escalation { 9 } else { 15 });
        }
    }
}

#[cfg(unix)]
fn install_process_signal_handler() {
    // SAFETY: process_signal_handler has the C signal-handler ABI and only performs async-signal-safe work.
    unsafe {
        signal(15, process_signal_handler as *const () as usize);
    }
}

#[cfg(not(unix))]
fn install_process_signal_handler() {}

fn read_frame<R: BufRead>(reader: &mut R) -> io::Result<Option<Vec<u8>>> {
    let mut frame = Vec::new();
    loop {
        let available = reader.fill_buf()?;
        if available.is_empty() {
            return if frame.is_empty() {
                Ok(None)
            } else {
                Err(io::Error::new(
                    io::ErrorKind::UnexpectedEof,
                    "SUPERVISOR_FRAME_INCOMPLETE",
                ))
            };
        }
        let newline = available.iter().position(|byte| *byte == b'\n');
        let take = newline.unwrap_or(available.len());
        if frame.len() + take > MAX_FRAME_BYTES {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "SUPERVISOR_FRAME_TOO_LARGE",
            ));
        }
        frame.extend_from_slice(&available[..take]);
        reader.consume(take + usize::from(newline.is_some()));
        if newline.is_some() {
            if frame.last() == Some(&b'\r') {
                frame.pop();
            }
            return Ok(Some(frame));
        }
    }
}

fn exact_request<'a>(
    value: &'a Value,
    kind: &str,
    field_count: usize,
) -> Option<&'a serde_json::Map<String, Value>> {
    let object = value.as_object()?;
    if object.len() != field_count
        || object.get("protocolVersion")?.as_u64()? != PROTOCOL_VERSION
        || object.get("kind")?.as_str()? != kind
    {
        return None;
    }
    Some(object)
}

fn request_id(object: &serde_json::Map<String, Value>) -> Option<&str> {
    let value = object.get("requestId")?.as_str()?;
    if value.is_empty() || value.len() > 128 || !value.is_ascii() {
        return None;
    }
    Some(value)
}

fn confined_path(root: &Path, relative: &str) -> Result<PathBuf, &'static str> {
    if relative.is_empty() || relative.len() > 4096 || relative.contains('\0') {
        return Err("WORKSPACE_PATH_INVALID");
    }
    let candidate = Path::new(relative);
    if candidate.is_absolute()
        || candidate
            .components()
            .any(|component| !matches!(component, Component::Normal(_)))
    {
        return Err("WORKSPACE_PATH_INVALID");
    }
    let canonical =
        fs::canonicalize(root.join(candidate)).map_err(|_| "WORKSPACE_PATH_NOT_FOUND")?;
    if !canonical.starts_with(root) {
        return Err("WORKSPACE_PATH_OUTSIDE_ROOT");
    }
    let metadata = fs::metadata(&canonical).map_err(|_| "WORKSPACE_PATH_NOT_FOUND")?;
    if !metadata.is_file() || metadata.len() > MAX_FILE_BYTES {
        return Err("WORKSPACE_FILE_UNREADABLE");
    }
    Ok(canonical)
}

fn confined_directory(root: &Path, relative: &str) -> Result<PathBuf, &'static str> {
    if relative.is_empty() || relative.len() > 4096 || relative.contains('\0') {
        return Err("WORKSPACE_PATH_INVALID");
    }
    let candidate = Path::new(relative);
    if relative != "."
        && (candidate.is_absolute()
            || candidate
                .components()
                .any(|component| !matches!(component, Component::Normal(_))))
    {
        return Err("WORKSPACE_PATH_INVALID");
    }
    let canonical =
        fs::canonicalize(root.join(candidate)).map_err(|_| "WORKSPACE_PATH_NOT_FOUND")?;
    if !canonical.starts_with(root) {
        return Err("WORKSPACE_PATH_OUTSIDE_ROOT");
    }
    if !fs::metadata(&canonical)
        .map_err(|_| "WORKSPACE_PATH_NOT_FOUND")?
        .is_dir()
    {
        return Err("WORKSPACE_DIRECTORY_UNREADABLE");
    }
    Ok(canonical)
}

fn read_workspace(
    root: &Path,
    object: &serde_json::Map<String, Value>,
) -> Result<Value, &'static str> {
    let relative = object
        .get("path")
        .and_then(Value::as_str)
        .ok_or("WORKSPACE_READ_INVALID")?;
    let start_line = object
        .get("startLine")
        .and_then(Value::as_u64)
        .filter(|value| (1..=1_000_000).contains(value))
        .ok_or("WORKSPACE_READ_INVALID")? as usize;
    let max_lines = object
        .get("maxLines")
        .and_then(Value::as_u64)
        .filter(|value| (1..=400).contains(value))
        .ok_or("WORKSPACE_READ_INVALID")? as usize;
    let path = confined_path(root, relative)?;
    let bytes = fs::read(path).map_err(|_| "WORKSPACE_FILE_UNREADABLE")?;
    let text = std::str::from_utf8(&bytes).map_err(|_| "WORKSPACE_FILE_NOT_UTF8")?;
    let mut content = String::new();
    let mut end_line = start_line.saturating_sub(1);
    let mut truncated = false;
    for (index, line) in text
        .lines()
        .enumerate()
        .skip(start_line - 1)
        .take(max_lines)
    {
        let rendered = format!("{}: {}\n", index + 1, line);
        if content.len() + rendered.len() > MAX_OUTPUT_BYTES {
            truncated = true;
            break;
        }
        content.push_str(&rendered);
        end_line = index + 1;
    }
    if text.lines().count() > end_line {
        truncated = true;
    }
    Ok(json!({
        "content": content,
        "endLine": end_line,
        "path": relative,
        "startLine": start_line,
        "truncated": truncated
    }))
}

fn skipped_directory(name: &str) -> bool {
    matches!(
        name,
        ".git" | ".opencode" | ".turbo" | "node_modules" | "target"
    )
}

fn relative_path(root: &Path, path: &Path) -> Result<String, &'static str> {
    Ok(path
        .strip_prefix(root)
        .map_err(|_| "WORKSPACE_PATH_OUTSIDE_ROOT")?
        .to_string_lossy()
        .replace('\\', "/"))
}

fn list_directory(
    root: &Path,
    directory: &Path,
    recursive: bool,
    max_entries: usize,
    visited: &mut usize,
    entries: &mut Vec<Value>,
) -> Result<bool, &'static str> {
    if entries.len() >= max_entries || *visited >= MAX_SEARCH_ENTRIES {
        return Ok(true);
    }
    let mut children = fs::read_dir(directory)
        .map_err(|_| "WORKSPACE_LIST_FAILED")?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| "WORKSPACE_LIST_FAILED")?;
    children.sort_by_key(|entry| entry.file_name());
    for entry in children {
        *visited += 1;
        if *visited > MAX_SEARCH_ENTRIES {
            return Ok(true);
        }
        let file_type = entry.file_type().map_err(|_| "WORKSPACE_LIST_FAILED")?;
        let path = entry.path();
        let relative = relative_path(root, &path)?;
        let entry_type = if file_type.is_symlink() {
            "symlink"
        } else if file_type.is_dir() {
            "directory"
        } else if file_type.is_file() {
            "file"
        } else {
            "other"
        };
        let size = if file_type.is_file() {
            Some(entry.metadata().map_err(|_| "WORKSPACE_LIST_FAILED")?.len())
        } else {
            None
        };
        entries.push(json!({ "path": relative, "sizeBytes": size, "type": entry_type }));
        if entries.len() >= max_entries {
            return Ok(true);
        }
        if recursive
            && file_type.is_dir()
            && !skipped_directory(&entry.file_name().to_string_lossy())
            && list_directory(root, &path, true, max_entries, visited, entries)?
        {
            return Ok(true);
        }
    }
    Ok(false)
}

fn list_workspace(
    root: &Path,
    object: &serde_json::Map<String, Value>,
) -> Result<Value, &'static str> {
    let relative = object
        .get("path")
        .and_then(Value::as_str)
        .ok_or("WORKSPACE_LIST_INVALID")?;
    let recursive = object
        .get("recursive")
        .and_then(Value::as_bool)
        .ok_or("WORKSPACE_LIST_INVALID")?;
    let max_entries = object
        .get("maxEntries")
        .and_then(Value::as_u64)
        .filter(|value| (1..=1_000).contains(value))
        .ok_or("WORKSPACE_LIST_INVALID")? as usize;
    let directory = confined_directory(root, relative)?;
    let mut entries = Vec::new();
    let mut visited = 0;
    let truncated = list_directory(
        root,
        &directory,
        recursive,
        max_entries,
        &mut visited,
        &mut entries,
    )?;
    Ok(json!({
        "entries": entries,
        "path": relative,
        "recursive": recursive,
        "truncated": truncated,
        "visitedEntries": visited
    }))
}

fn glob_matches(pattern: &str, candidate: &str) -> bool {
    fn matches(
        pattern: &[char],
        candidate: &[char],
        pattern_index: usize,
        candidate_index: usize,
        memo: &mut HashMap<(usize, usize), bool>,
    ) -> bool {
        if let Some(value) = memo.get(&(pattern_index, candidate_index)) {
            return *value;
        }
        let value = if pattern_index == pattern.len() {
            candidate_index == candidate.len()
        } else if pattern[pattern_index] == '*' {
            let double = pattern.get(pattern_index + 1) == Some(&'*');
            if double {
                let next = pattern_index + 2;
                let skip = if pattern.get(next) == Some(&'/') {
                    matches(pattern, candidate, next + 1, candidate_index, memo)
                } else {
                    matches(pattern, candidate, next, candidate_index, memo)
                };
                skip || (candidate_index < candidate.len()
                    && matches(pattern, candidate, pattern_index, candidate_index + 1, memo))
            } else {
                matches(pattern, candidate, pattern_index + 1, candidate_index, memo)
                    || (candidate_index < candidate.len()
                        && candidate[candidate_index] != '/'
                        && matches(pattern, candidate, pattern_index, candidate_index + 1, memo))
            }
        } else if candidate_index < candidate.len()
            && (pattern[pattern_index] == '?' && candidate[candidate_index] != '/'
                || pattern[pattern_index] == candidate[candidate_index])
        {
            matches(
                pattern,
                candidate,
                pattern_index + 1,
                candidate_index + 1,
                memo,
            )
        } else {
            false
        };
        memo.insert((pattern_index, candidate_index), value);
        value
    }

    matches(
        &pattern.chars().collect::<Vec<_>>(),
        &candidate.chars().collect::<Vec<_>>(),
        0,
        0,
        &mut HashMap::new(),
    )
}

fn glob_workspace(
    root: &Path,
    object: &serde_json::Map<String, Value>,
) -> Result<Value, &'static str> {
    let pattern = object
        .get("pattern")
        .and_then(Value::as_str)
        .ok_or("WORKSPACE_GLOB_INVALID")?;
    if pattern.is_empty()
        || pattern.len() > 4096
        || pattern.contains('\0')
        || pattern.starts_with('/')
        || pattern.split('/').any(|part| part == "..")
    {
        return Err("WORKSPACE_GLOB_INVALID");
    }
    let max_results = object
        .get("maxResults")
        .and_then(Value::as_u64)
        .filter(|value| (1..=1_000).contains(value))
        .ok_or("WORKSPACE_GLOB_INVALID")? as usize;
    let mut listed = Vec::new();
    let mut visited = 0;
    let walk_truncated = list_directory(
        root,
        root,
        true,
        MAX_SEARCH_ENTRIES,
        &mut visited,
        &mut listed,
    )?;
    let mut matches = Vec::new();
    let mut truncated = walk_truncated;
    for entry in listed {
        let Some(path) = entry.get("path").and_then(Value::as_str) else {
            continue;
        };
        if entry.get("type").and_then(Value::as_str) == Some("file") && glob_matches(pattern, path)
        {
            matches.push(path.to_owned());
            if matches.len() >= max_results {
                truncated = true;
                break;
            }
        }
    }
    Ok(json!({
        "matches": matches,
        "pattern": pattern,
        "truncated": truncated,
        "visitedEntries": visited
    }))
}

fn file_sha256(path: &Path) -> Result<String, &'static str> {
    let mut file = fs::File::open(path).map_err(|_| "PROCESS_EXECUTABLE_UNAVAILABLE")?;
    let mut digest = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let count = file
            .read(&mut buffer)
            .map_err(|_| "PROCESS_EXECUTABLE_UNAVAILABLE")?;
        if count == 0 {
            break;
        }
        digest.update(&buffer[..count]);
    }
    Ok(format!("{:x}", digest.finalize()))
}

fn qualified_executable(
    root: &Path,
    path: &str,
    expected_sha256: &str,
) -> Result<PathBuf, &'static str> {
    let requested = Path::new(path);
    if !requested.is_absolute() {
        return Err("PROCESS_PROFILE_INVALID");
    }
    let link_metadata = fs::symlink_metadata(requested).map_err(|_| "PROCESS_PROFILE_INVALID")?;
    if link_metadata.file_type().is_symlink() || !link_metadata.is_file() {
        return Err("PROCESS_PROFILE_INVALID");
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if link_metadata.permissions().mode() & 0o111 == 0 {
            return Err("PROCESS_PROFILE_INVALID");
        }
    }
    let canonical = fs::canonicalize(requested).map_err(|_| "PROCESS_PROFILE_INVALID")?;
    if canonical.starts_with(root) {
        return Err("PROCESS_PROFILE_INVALID");
    }
    let blocked = [
        "bash", "curl", "dash", "env", "fish", "git", "nc", "netcat", "perl", "python", "python3",
        "ruby", "scp", "sh", "ssh", "wget", "zsh",
    ];
    if canonical
        .file_name()
        .and_then(|value| value.to_str())
        .is_some_and(|name| blocked.contains(&name))
    {
        return Err("PROCESS_EXECUTABLE_DENIED");
    }
    if expected_sha256.len() != 64
        || !expected_sha256.bytes().all(|byte| byte.is_ascii_hexdigit())
        || file_sha256(&canonical)? != expected_sha256.to_ascii_lowercase()
    {
        return Err("PROCESS_EXECUTABLE_DIGEST_MISMATCH");
    }
    Ok(canonical)
}

fn qualified_git_executable(
    root: &Path,
    path: &str,
    expected_sha256: &str,
) -> Result<PathBuf, &'static str> {
    let requested = Path::new(path);
    if !requested.is_absolute() {
        return Err("GIT_PROFILE_INVALID");
    }
    let metadata = fs::symlink_metadata(requested).map_err(|_| "GIT_PROFILE_INVALID")?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err("GIT_PROFILE_INVALID");
    }
    let canonical = fs::canonicalize(requested).map_err(|_| "GIT_PROFILE_INVALID")?;
    if canonical.starts_with(root)
        || canonical.file_name().and_then(|value| value.to_str()) != Some("git")
        || expected_sha256.len() != 64
        || !expected_sha256.bytes().all(|byte| byte.is_ascii_hexdigit())
        || file_sha256(&canonical)? != expected_sha256.to_ascii_lowercase()
    {
        return Err("GIT_PROFILE_INVALID");
    }
    Ok(canonical)
}

fn git_output(
    executable: &Path,
    root_handle: &fs::File,
    arguments: &[&str],
    maximum_output_bytes: usize,
) -> Result<(i32, Vec<u8>, Vec<u8>), &'static str> {
    let root_fd = root_handle.as_raw_fd();
    let mut command = Command::new(executable);
    command
        .args(arguments)
        .env_clear()
        .env("GIT_CONFIG_GLOBAL", "/dev/null")
        .env("GIT_CONFIG_NOSYSTEM", "1")
        .env("GIT_OPTIONAL_LOCKS", "0")
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("LANG", "C")
        .env("LC_ALL", "C")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    // SAFETY: the supervisor retains this opened directory descriptor for its
    // lifetime and fchdir is async-signal-safe between fork and exec.
    unsafe {
        command.pre_exec(move || {
            if libc::setpgid(0, 0) == -1 || libc::fchdir(root_fd) == -1 {
                Err(io::Error::last_os_error())
            } else {
                Ok(())
            }
        });
    }
    PROCESS_CANCEL_REQUESTED.store(false, Ordering::SeqCst);
    let child = command.spawn().map_err(|_| "GIT_EXECUTION_FAILED")?;
    ACTIVE_PROCESS_GROUP.store(child.id() as i32, Ordering::SeqCst);
    let output = child
        .wait_with_output()
        .map_err(|_| "GIT_EXECUTION_FAILED")?;
    ACTIVE_PROCESS_GROUP.store(0, Ordering::SeqCst);
    if PROCESS_CANCEL_REQUESTED.swap(false, Ordering::SeqCst) {
        return Err("GIT_OPERATION_CANCELLED");
    }
    if output.stdout.len() + output.stderr.len() > maximum_output_bytes {
        return Err("GIT_OUTPUT_TOO_LARGE");
    }
    Ok((
        output.status.code().unwrap_or(-1),
        output.stdout,
        output.stderr,
    ))
}

fn git_text(
    executable: &Path,
    root_handle: &fs::File,
    arguments: &[&str],
) -> Result<String, &'static str> {
    let (code, stdout, _) = git_output(executable, root_handle, arguments, 16 * 1024)?;
    if code != 0 {
        return Err("GIT_REPOSITORY_INVALID");
    }
    String::from_utf8(stdout)
        .map(|value| value.trim().to_owned())
        .map_err(|_| "GIT_OUTPUT_NOT_UTF8")
}

#[cfg(unix)]
fn retained_directory(root: &fs::File, relative: &str) -> Result<fs::File, &'static str> {
    if !validate_git_path(relative) {
        return Err("GIT_WORKTREE_ROOT_INVALID");
    }
    let mut directory = duplicate_fd(root.as_raw_fd())?;
    for component in Path::new(relative).components() {
        let Component::Normal(name) = component else {
            return Err("GIT_WORKTREE_ROOT_INVALID");
        };
        let name = CString::new(name.as_bytes()).map_err(|_| "GIT_WORKTREE_ROOT_INVALID")?;
        // SAFETY: directory and name are valid; O_NOFOLLOW rejects every symbolic-link hop.
        let next = unsafe {
            libc::openat(
                directory.as_raw_fd(),
                name.as_ptr(),
                libc::O_RDONLY | libc::O_DIRECTORY | libc::O_NOFOLLOW | libc::O_CLOEXEC,
            )
        };
        if next < 0 {
            return Err("GIT_WORKTREE_ROOT_INVALID");
        }
        // SAFETY: next is a newly owned valid descriptor.
        directory = unsafe { OwnedFd::from_raw_fd(next) };
    }
    Ok(directory.into())
}

#[cfg(unix)]
fn directory_identity(directory: &fs::File) -> Result<String, &'static str> {
    let metadata = directory
        .metadata()
        .map_err(|_| "GIT_WORKTREE_ROOT_INVALID")?;
    if !metadata.is_dir() {
        return Err("GIT_WORKTREE_ROOT_INVALID");
    }
    Ok(bytes_sha256(
        format!("device={}\ninode={}", metadata.dev(), metadata.ino()).as_bytes(),
    ))
}

fn git_profile(
    root: &Path,
    root_handle: &fs::File,
    value: &Value,
) -> Result<Option<GitProfile>, &'static str> {
    if value.is_null() {
        return Ok(None);
    }
    let object = value.as_object().ok_or("GIT_PROFILE_INVALID")?;
    if !matches!(object.len(), 5 | 6) {
        return Err("GIT_PROFILE_INVALID");
    }
    let executable_sha256 = object
        .get("executableSha256")
        .and_then(Value::as_str)
        .ok_or("GIT_PROFILE_INVALID")?;
    let executable = qualified_git_executable(
        root,
        object
            .get("executable")
            .and_then(Value::as_str)
            .ok_or("GIT_PROFILE_INVALID")?,
        executable_sha256,
    )?;
    let expected_head = object
        .get("expectedHead")
        .and_then(Value::as_str)
        .filter(|value| {
            matches!(value.len(), 40 | 64) && value.bytes().all(|byte| byte.is_ascii_hexdigit())
        })
        .ok_or("GIT_PROFILE_INVALID")?
        .to_ascii_lowercase();
    let repository_identity = object
        .get("repositoryIdentity")
        .and_then(Value::as_str)
        .filter(|value| value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit()))
        .ok_or("GIT_PROFILE_INVALID")?
        .to_ascii_lowercase();
    let maximum_output_bytes = object
        .get("maximumOutputBytes")
        .and_then(Value::as_u64)
        .filter(|value| (1..=MAX_PROCESS_OUTPUT_BYTES as u64).contains(value))
        .ok_or("GIT_PROFILE_INVALID")? as usize;
    let top_level = fs::canonicalize(git_text(
        &executable,
        root_handle,
        &["rev-parse", "--show-toplevel"],
    )?)
    .map_err(|_| "GIT_REPOSITORY_INVALID")?;
    if top_level != root {
        return Err("GIT_REPOSITORY_IDENTITY_MISMATCH");
    }
    let git_directory = fs::canonicalize(git_text(
        &executable,
        root_handle,
        &["rev-parse", "--absolute-git-dir"],
    )?)
    .map_err(|_| "GIT_REPOSITORY_INVALID")?;
    let computed_identity = bytes_sha256(
        format!(
            "worktree={}\ngitdir={}",
            top_level.to_string_lossy(),
            git_directory.to_string_lossy()
        )
        .as_bytes(),
    );
    if computed_identity != repository_identity
        || git_text(&executable, root_handle, &["rev-parse", "HEAD"])? != expected_head
    {
        return Err("GIT_REPOSITORY_IDENTITY_MISMATCH");
    }
    let worktree_root = if let Some(value) = object.get("worktreeRoot") {
        let relative = value.as_str().ok_or("GIT_WORKTREE_ROOT_INVALID")?;
        #[cfg(not(unix))]
        {
            let _ = relative;
            return Err("GIT_WORKTREE_UNAVAILABLE");
        }
        #[cfg(unix)]
        {
            let canonical =
                fs::canonicalize(root.join(relative)).map_err(|_| "GIT_WORKTREE_ROOT_INVALID")?;
            if canonical == git_directory || !canonical.starts_with(&git_directory) {
                return Err("GIT_WORKTREE_ROOT_INVALID");
            }
            let handle = retained_directory(root_handle, relative)?;
            let discovered_git_directory = fs::canonicalize(git_text(
                &executable,
                &handle,
                &["rev-parse", "--absolute-git-dir"],
            )?)
            .map_err(|_| "GIT_WORKTREE_ROOT_INVALID")?;
            if discovered_git_directory != git_directory {
                return Err("GIT_WORKTREE_ROOT_INVALID");
            }
            Some(WorktreeRoot {
                identity: directory_identity(&handle)?,
                handle: Arc::new(handle),
                path: canonical,
            })
        }
    } else {
        None
    };
    Ok(Some(GitProfile {
        executable,
        executable_sha256: executable_sha256.to_ascii_lowercase(),
        expected_head,
        git_directory,
        maximum_output_bytes,
        repository_identity,
        worktree_root,
    }))
}

fn validate_git_path(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 4_096
        && !value.contains('\0')
        && !Path::new(value).is_absolute()
        && Path::new(value)
            .components()
            .all(|component| matches!(component, Component::Normal(_)))
}

fn revalidate_git_repository(
    profile: &GitProfile,
    root_handle: &fs::File,
) -> Result<String, &'static str> {
    if file_sha256(&profile.executable)? != profile.executable_sha256 {
        return Err("GIT_EXECUTABLE_DIGEST_MISMATCH");
    }
    let top_level = fs::canonicalize(git_text(
        &profile.executable,
        root_handle,
        &["rev-parse", "--show-toplevel"],
    )?)
    .map_err(|_| "GIT_REPOSITORY_INVALID")?;
    let git_directory = fs::canonicalize(git_text(
        &profile.executable,
        root_handle,
        &["rev-parse", "--absolute-git-dir"],
    )?)
    .map_err(|_| "GIT_REPOSITORY_INVALID")?;
    let current_identity = bytes_sha256(
        format!(
            "worktree={}\ngitdir={}",
            top_level.to_string_lossy(),
            git_directory.to_string_lossy()
        )
        .as_bytes(),
    );
    if current_identity != profile.repository_identity || git_directory != profile.git_directory {
        return Err("GIT_REPOSITORY_IDENTITY_MISMATCH");
    }
    let head = git_text(&profile.executable, root_handle, &["rev-parse", "HEAD"])?;
    if head != profile.expected_head {
        return Err("GIT_HEAD_PRECONDITION_FAILED");
    }
    Ok(head)
}

fn git_request(
    profile: &GitProfile,
    root_handle: &fs::File,
    kind: &str,
    object: &serde_json::Map<String, Value>,
) -> Result<Value, &'static str> {
    let before = revalidate_git_repository(profile, root_handle)?;
    let requested_limit = object
        .get("maxOutputBytes")
        .and_then(Value::as_u64)
        .filter(|value| *value > 0 && *value as usize <= profile.maximum_output_bytes)
        .ok_or("GIT_OUTPUT_LIMIT_DENIED")? as usize;
    let arguments = if kind == "git.status" {
        vec![
            "status",
            "--porcelain=v2",
            "--branch",
            "--untracked-files=all",
        ]
    } else {
        let paths = object
            .get("paths")
            .and_then(Value::as_array)
            .filter(|values| values.len() <= 64)
            .ok_or("GIT_DIFF_INVALID")?;
        if paths
            .iter()
            .any(|value| !value.as_str().is_some_and(validate_git_path))
        {
            return Err("GIT_PATH_DENIED");
        }
        let mut values = vec!["diff", "--no-ext-diff", "--no-renames", "--"];
        values.extend(paths.iter().filter_map(Value::as_str));
        values
    };
    let (exit_code, stdout, stderr) = git_output(
        &profile.executable,
        root_handle,
        &arguments,
        requested_limit,
    )?;
    let after = git_text(&profile.executable, root_handle, &["rev-parse", "HEAD"])?;
    if before != after {
        return Err("GIT_REF_RACE");
    }
    let stdout = String::from_utf8(stdout).map_err(|_| "GIT_OUTPUT_NOT_UTF8")?;
    let stderr = String::from_utf8(stderr).map_err(|_| "GIT_OUTPUT_NOT_UTF8")?;
    if exit_code != 0 {
        return Err("GIT_COMMAND_FAILED");
    }
    let dirty = if kind == "git.status" {
        stdout.lines().any(|line| !line.starts_with("# "))
    } else {
        !stdout.is_empty()
    };
    Ok(json!({
        "dirty": dirty,
        "executableSha256": profile.executable_sha256,
        "head": after,
        "repositoryIdentity": profile.repository_identity,
        "stderr": stderr,
        "stdout": stdout
    }))
}

#[derive(Default)]
struct GitWorktreeRecord {
    detached: bool,
    head: Option<String>,
    locked: bool,
    path: Option<PathBuf>,
}

fn git_worktree_name(worktree_id: &str) -> Result<String, &'static str> {
    if worktree_id.is_empty()
        || worktree_id.len() > 64
        || !worktree_id
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"._-".contains(&byte))
    {
        return Err("GIT_WORKTREE_ID_INVALID");
    }
    Ok(format!(
        "curiosity-{}",
        &bytes_sha256(worktree_id.as_bytes())[..32]
    ))
}

fn git_worktree_records(
    profile: &GitProfile,
    root_handle: &fs::File,
    maximum_output_bytes: usize,
) -> Result<Vec<GitWorktreeRecord>, &'static str> {
    let (code, stdout, _) = git_output(
        &profile.executable,
        root_handle,
        &["worktree", "list", "--porcelain", "-z"],
        maximum_output_bytes,
    )?;
    if code != 0 {
        return Err("GIT_WORKTREE_LIST_FAILED");
    }
    let mut records = Vec::new();
    let mut current = GitWorktreeRecord::default();
    for field in stdout.split(|byte| *byte == 0) {
        if field.is_empty() {
            if current.path.is_some() {
                records.push(current);
                current = GitWorktreeRecord::default();
            }
            continue;
        }
        let field = std::str::from_utf8(field).map_err(|_| "GIT_OUTPUT_NOT_UTF8")?;
        if let Some(path) = field.strip_prefix("worktree ") {
            current.path = Some(PathBuf::from(path));
        } else if let Some(head) = field.strip_prefix("HEAD ") {
            current.head = Some(head.to_ascii_lowercase());
        } else if field == "detached" {
            current.detached = true;
        } else if field == "locked" || field.starts_with("locked ") {
            current.locked = true;
        }
    }
    if current.path.is_some() {
        records.push(current);
    }
    Ok(records)
}

#[cfg(unix)]
fn open_worktree_destination(
    root: &WorktreeRoot,
    name: &str,
) -> Result<Option<fs::File>, &'static str> {
    let name = CString::new(name).map_err(|_| "GIT_WORKTREE_ID_INVALID")?;
    // SAFETY: root and name are valid; O_NOFOLLOW rejects final-link substitution.
    let descriptor = unsafe {
        libc::openat(
            root.handle.as_raw_fd(),
            name.as_ptr(),
            libc::O_RDONLY | libc::O_DIRECTORY | libc::O_NOFOLLOW | libc::O_CLOEXEC,
        )
    };
    if descriptor < 0 {
        return if io::Error::last_os_error().raw_os_error() == Some(libc::ENOENT) {
            Ok(None)
        } else {
            Err("GIT_WORKTREE_PATH_UNSAFE")
        };
    }
    // SAFETY: descriptor is a newly owned valid descriptor.
    let owned = unsafe { OwnedFd::from_raw_fd(descriptor) };
    Ok(Some(owned.into()))
}

fn git_worktree_inspect(
    profile: &GitProfile,
    repository_root: &fs::File,
    worktree_id: &str,
    expected_head: &str,
    maximum_output_bytes: usize,
) -> Result<Value, &'static str> {
    let root = profile
        .worktree_root
        .as_ref()
        .ok_or("GIT_WORKTREE_UNAVAILABLE")?;
    let name = git_worktree_name(worktree_id)?;
    if expected_head != profile.expected_head {
        return Err("GIT_HEAD_PRECONDITION_FAILED");
    }
    let records = git_worktree_records(profile, repository_root, maximum_output_bytes)?;
    let expected_path = root.path.join(&name);
    let registered = records
        .into_iter()
        .find(|record| record.path.as_deref() == Some(expected_path.as_path()));
    #[cfg(not(unix))]
    let destination: Option<fs::File> = None;
    #[cfg(unix)]
    let destination = open_worktree_destination(root, &name)?;
    if registered.is_none() && destination.is_none() {
        return Ok(json!({
            "destinationName": name,
            "expectedHead": expected_head,
            "repositoryIdentity": profile.repository_identity,
            "status": "absent",
            "worktreeId": worktree_id,
            "worktreeRootIdentity": root.identity
        }));
    }
    let Some(record) = registered else {
        return Ok(json!({
            "destinationName": name,
            "expectedHead": expected_head,
            "repositoryIdentity": profile.repository_identity,
            "status": "reconciliation-required",
            "worktreeId": worktree_id,
            "worktreeRootIdentity": root.identity
        }));
    };
    let Some(destination) = destination else {
        return Ok(json!({
            "destinationName": name,
            "expectedHead": expected_head,
            "repositoryIdentity": profile.repository_identity,
            "status": "reconciliation-required",
            "worktreeId": worktree_id,
            "worktreeRootIdentity": root.identity
        }));
    };
    let facts = (|| -> Result<(String, PathBuf, PathBuf, String), &'static str> {
        let actual_head = git_text(&profile.executable, &destination, &["rev-parse", "HEAD"])?;
        let actual_common_directory = fs::canonicalize(git_text(
            &profile.executable,
            &destination,
            &["rev-parse", "--git-common-dir"],
        )?)
        .map_err(|_| "GIT_WORKTREE_RECONCILIATION_REQUIRED")?;
        let actual_top_level = fs::canonicalize(git_text(
            &profile.executable,
            &destination,
            &["rev-parse", "--show-toplevel"],
        )?)
        .map_err(|_| "GIT_WORKTREE_RECONCILIATION_REQUIRED")?;
        #[cfg(unix)]
        let worktree_identity = directory_identity(&destination)?;
        #[cfg(not(unix))]
        let worktree_identity = String::new();
        Ok((
            actual_head,
            actual_common_directory,
            actual_top_level,
            worktree_identity,
        ))
    })();
    let Ok((actual_head, actual_common_directory, actual_top_level, worktree_identity)) = facts
    else {
        return Ok(json!({
            "destinationName": name,
            "expectedHead": expected_head,
            "repositoryIdentity": profile.repository_identity,
            "status": "reconciliation-required",
            "worktreeId": worktree_id,
            "worktreeRootIdentity": root.identity
        }));
    };
    let ready = record.detached
        && record.locked
        && record.head.as_deref() == Some(expected_head)
        && actual_head == expected_head
        && actual_common_directory == profile.git_directory
        && actual_top_level == expected_path;
    Ok(json!({
        "destinationName": name,
        "detached": record.detached,
        "head": actual_head,
        "locked": record.locked,
        "repositoryIdentity": profile.repository_identity,
        "status": if ready { "ready" } else { "reconciliation-required" },
        "worktreeId": worktree_id,
        "worktreeIdentity": worktree_identity,
        "worktreeRootIdentity": root.identity
    }))
}

fn git_worktree_remove(
    profile: &GitProfile,
    repository_root: &fs::File,
    worktree_id: &str,
    expected_head: &str,
    maximum_output_bytes: usize,
) -> Result<Value, &'static str> {
    let inspected = git_worktree_inspect(
        profile,
        repository_root,
        worktree_id,
        expected_head,
        maximum_output_bytes,
    )?;
    match inspected.get("status").and_then(Value::as_str) {
        Some("absent") => return Err("GIT_WORKTREE_ABSENT"),
        Some("ready") => {}
        _ => return Err("GIT_WORKTREE_RECONCILIATION_REQUIRED"),
    }
    let root = profile
        .worktree_root
        .as_ref()
        .ok_or("GIT_WORKTREE_UNAVAILABLE")?;
    let name = git_worktree_name(worktree_id)?;
    #[cfg(not(unix))]
    let destination: Option<fs::File> = None;
    #[cfg(unix)]
    let destination = open_worktree_destination(root, &name)?;
    let destination = destination.ok_or("GIT_WORKTREE_RECONCILIATION_REQUIRED")?;
    let (status_code, status_stdout, _) = git_output(
        &profile.executable,
        &destination,
        &["status", "--porcelain=v2", "--untracked-files=all"],
        maximum_output_bytes,
    )?;
    if status_code != 0 {
        return Err("GIT_STATUS_FAILED");
    }
    if !status_stdout.is_empty() {
        return Err("GIT_CLEAN_PRECONDITION_FAILED");
    }
    let expected_path = root.path.join(name);
    let expected_path = expected_path.to_str().ok_or("GIT_WORKTREE_PATH_UNSAFE")?;
    let (unlock_code, _, _) = git_output(
        &profile.executable,
        repository_root,
        &["worktree", "unlock", expected_path],
        maximum_output_bytes,
    )?;
    if unlock_code != 0 {
        return Err("GIT_WORKTREE_RECONCILIATION_REQUIRED");
    }
    let (remove_code, _, _) = git_output(
        &profile.executable,
        repository_root,
        &["worktree", "remove", expected_path],
        maximum_output_bytes,
    )?;
    if remove_code != 0 {
        return Err("GIT_WORKTREE_RECONCILIATION_REQUIRED");
    }
    let reconciled = git_worktree_inspect(
        profile,
        repository_root,
        worktree_id,
        expected_head,
        maximum_output_bytes,
    )?;
    if reconciled.get("status").and_then(Value::as_str) != Some("absent") {
        return Err("GIT_WORKTREE_RECONCILIATION_REQUIRED");
    }
    Ok(json!({
        "destinationName": reconciled["destinationName"],
        "expectedHead": expected_head,
        "repositoryIdentity": profile.repository_identity,
        "status": "removed",
        "worktreeId": worktree_id,
        "worktreeRootIdentity": root.identity
    }))
}

fn git_worktree_request(
    profile: &GitProfile,
    repository_root: &fs::File,
    kind: &str,
    object: &serde_json::Map<String, Value>,
) -> Result<Value, &'static str> {
    revalidate_git_repository(profile, repository_root)?;
    let worktree_id = object
        .get("worktreeId")
        .and_then(Value::as_str)
        .ok_or("GIT_WORKTREE_ID_INVALID")?;
    let expected_head = object
        .get("expectedHead")
        .and_then(Value::as_str)
        .filter(|value| {
            matches!(value.len(), 40 | 64) && value.bytes().all(|byte| byte.is_ascii_hexdigit())
        })
        .ok_or("GIT_HEAD_PRECONDITION_FAILED")?
        .to_ascii_lowercase();
    let maximum_output_bytes = object
        .get("maxOutputBytes")
        .and_then(Value::as_u64)
        .filter(|value| *value > 0 && *value as usize <= profile.maximum_output_bytes)
        .ok_or("GIT_OUTPUT_LIMIT_DENIED")? as usize;
    let inspected = git_worktree_inspect(
        profile,
        repository_root,
        worktree_id,
        &expected_head,
        maximum_output_bytes,
    )?;
    if kind == "git.worktree.inspect" {
        return Ok(inspected);
    }
    if object.get("expectedClean").and_then(Value::as_bool) != Some(true) {
        return Err("GIT_CLEAN_PRECONDITION_REQUIRED");
    }
    if kind == "git.worktree.remove" {
        return git_worktree_remove(
            profile,
            repository_root,
            worktree_id,
            &expected_head,
            maximum_output_bytes,
        );
    }
    if inspected.get("status").and_then(Value::as_str) != Some("absent") {
        return Err("GIT_WORKTREE_ALREADY_EXISTS");
    }
    let (status_code, status_stdout, _) = git_output(
        &profile.executable,
        repository_root,
        &["status", "--porcelain=v2", "--untracked-files=all"],
        maximum_output_bytes,
    )?;
    if status_code != 0 {
        return Err("GIT_STATUS_FAILED");
    }
    if !status_stdout.is_empty() {
        return Err("GIT_CLEAN_PRECONDITION_FAILED");
    }
    let peeled = format!("{}^{{commit}}", expected_head);
    let verified = git_text(
        &profile.executable,
        repository_root,
        &["rev-parse", "--verify", "--end-of-options", &peeled],
    )?;
    if verified != expected_head {
        return Err("GIT_HEAD_PRECONDITION_FAILED");
    }
    let root = profile
        .worktree_root
        .as_ref()
        .ok_or("GIT_WORKTREE_UNAVAILABLE")?;
    let name = git_worktree_name(worktree_id)?;
    let reason = format!("curiosity:{worktree_id}");
    let (code, _, _) = git_output(
        &profile.executable,
        &root.handle,
        &[
            "worktree",
            "add",
            "--quiet",
            "--detach",
            "--lock",
            "--reason",
            &reason,
            &name,
            &expected_head,
        ],
        maximum_output_bytes,
    )?;
    if code != 0 {
        return Err("GIT_WORKTREE_RECONCILIATION_REQUIRED");
    }
    let result = git_worktree_inspect(
        profile,
        repository_root,
        worktree_id,
        &expected_head,
        maximum_output_bytes,
    )?;
    if result.get("status").and_then(Value::as_str) != Some("ready") {
        return Err("GIT_WORKTREE_RECONCILIATION_REQUIRED");
    }
    Ok(result)
}

fn valid_curiosity_ref(value: &str) -> bool {
    let Some(suffix) = value.strip_prefix("refs/heads/curiosity/") else {
        return false;
    };
    !suffix.is_empty()
        && value.len() <= 255
        && suffix.split('/').all(|component| {
            !component.is_empty()
                && component.len() <= 64
                && !component.starts_with('.')
                && !component.ends_with('.')
                && !component.ends_with(".lock")
                && component
                    .bytes()
                    .all(|byte| byte.is_ascii_alphanumeric() || b"._-".contains(&byte))
        })
}

fn valid_object_id(value: &str, length: usize, allow_zero: bool) -> bool {
    value.len() == length
        && value.bytes().all(|byte| byte.is_ascii_hexdigit())
        && (allow_zero || value.bytes().any(|byte| byte != b'0'))
}

fn git_ref_head(
    profile: &GitProfile,
    repository_root: &fs::File,
    ref_name: &str,
    maximum_output_bytes: usize,
) -> Result<Option<String>, &'static str> {
    let (code, stdout, _) = git_output(
        &profile.executable,
        repository_root,
        &["show-ref", "--verify", "--hash", ref_name],
        maximum_output_bytes,
    )?;
    if code != 0 && stdout.is_empty() {
        return Ok(None);
    }
    if code != 0 {
        return Err("GIT_REF_INSPECTION_FAILED");
    }
    let head = String::from_utf8(stdout)
        .map_err(|_| "GIT_OUTPUT_NOT_UTF8")?
        .trim()
        .to_ascii_lowercase();
    if !valid_object_id(&head, profile.expected_head.len(), false) {
        return Err("GIT_REF_INSPECTION_FAILED");
    }
    Ok(Some(head))
}

fn git_ref_request(
    profile: &GitProfile,
    repository_root: &fs::File,
    kind: &str,
    object: &serde_json::Map<String, Value>,
) -> Result<Value, &'static str> {
    revalidate_git_repository(profile, repository_root)?;
    let ref_name = object
        .get("refName")
        .and_then(Value::as_str)
        .filter(|value| valid_curiosity_ref(value))
        .ok_or("GIT_REF_NAME_DENIED")?;
    let maximum_output_bytes = object
        .get("maxOutputBytes")
        .and_then(Value::as_u64)
        .filter(|value| *value > 0 && *value as usize <= profile.maximum_output_bytes)
        .ok_or("GIT_OUTPUT_LIMIT_DENIED")? as usize;
    let current = git_ref_head(profile, repository_root, ref_name, maximum_output_bytes)?;
    if kind == "git.ref.inspect" {
        return Ok(json!({
            "head": current,
            "refName": ref_name,
            "repositoryIdentity": profile.repository_identity,
            "status": if current.is_some() { "present" } else { "absent" }
        }));
    }
    if object.get("expectedClean").and_then(Value::as_bool) != Some(true) {
        return Err("GIT_CLEAN_PRECONDITION_REQUIRED");
    }
    let expected_old_head = object
        .get("expectedOldHead")
        .and_then(Value::as_str)
        .filter(|value| valid_object_id(value, profile.expected_head.len(), true))
        .ok_or("GIT_REF_PRECONDITION_FAILED")?
        .to_ascii_lowercase();
    let new_head = object
        .get("newHead")
        .and_then(Value::as_str)
        .filter(|value| valid_object_id(value, profile.expected_head.len(), false))
        .ok_or("GIT_REF_TARGET_INVALID")?
        .to_ascii_lowercase();
    let zero = "0".repeat(profile.expected_head.len());
    if current.as_deref().unwrap_or(&zero) != expected_old_head {
        return Err("GIT_REF_PRECONDITION_FAILED");
    }
    let (status_code, status_stdout, _) = git_output(
        &profile.executable,
        repository_root,
        &["status", "--porcelain=v2", "--untracked-files=all"],
        maximum_output_bytes,
    )?;
    if status_code != 0 {
        return Err("GIT_STATUS_FAILED");
    }
    if !status_stdout.is_empty() {
        return Err("GIT_CLEAN_PRECONDITION_FAILED");
    }
    let peeled = format!("{new_head}^{{commit}}");
    if git_text(
        &profile.executable,
        repository_root,
        &["rev-parse", "--verify", "--end-of-options", &peeled],
    )? != new_head
    {
        return Err("GIT_REF_TARGET_INVALID");
    }
    let reason = format!("curiosity update {ref_name}");
    let (code, _, _) = git_output(
        &profile.executable,
        repository_root,
        &[
            "update-ref",
            "--no-deref",
            "-m",
            &reason,
            ref_name,
            &new_head,
            &expected_old_head,
        ],
        maximum_output_bytes,
    )?;
    if code != 0 {
        return Err("GIT_REF_UPDATE_FAILED");
    }
    revalidate_git_repository(profile, repository_root)?;
    if git_ref_head(profile, repository_root, ref_name, maximum_output_bytes)?.as_deref()
        != Some(new_head.as_str())
    {
        return Err("GIT_REF_RECONCILIATION_REQUIRED");
    }
    Ok(json!({
        "head": new_head,
        "previousHead": current,
        "refName": ref_name,
        "repositoryIdentity": profile.repository_identity,
        "status": "updated"
    }))
}

fn process_profiles(
    root: &Path,
    value: &Value,
) -> Result<HashMap<String, ProcessProfile>, &'static str> {
    let entries = value.as_array().ok_or("PROCESS_PROFILE_INVALID")?;
    if entries.len() > 16 {
        return Err("PROCESS_PROFILE_INVALID");
    }
    let mut profiles = HashMap::new();
    let allowed_environment = ["CI", "LANG", "LC_ALL", "NO_COLOR", "TERM"];
    for entry in entries {
        let object = entry.as_object().ok_or("PROCESS_PROFILE_INVALID")?;
        if object.len() != 8 {
            return Err("PROCESS_PROFILE_INVALID");
        }
        let id = object
            .get("id")
            .and_then(Value::as_str)
            .filter(|value| {
                !value.is_empty()
                    && value.len() <= 64
                    && value
                        .bytes()
                        .all(|byte| byte.is_ascii_alphanumeric() || b"._-".contains(&byte))
            })
            .ok_or("PROCESS_PROFILE_INVALID")?;
        let executable_sha256 = object
            .get("executableSha256")
            .and_then(Value::as_str)
            .ok_or("PROCESS_PROFILE_INVALID")?;
        let executable = qualified_executable(
            root,
            object
                .get("executable")
                .and_then(Value::as_str)
                .ok_or("PROCESS_PROFILE_INVALID")?,
            executable_sha256,
        )?;
        let argument_values = object
            .get("allowedArguments")
            .and_then(Value::as_array)
            .filter(|values| !values.is_empty() && values.len() <= 64)
            .ok_or("PROCESS_PROFILE_INVALID")?;
        let mut allowed_arguments = Vec::new();
        for arguments in argument_values {
            let values = arguments
                .as_array()
                .filter(|values| values.len() <= 32)
                .ok_or("PROCESS_PROFILE_INVALID")?;
            let mut normalized = Vec::new();
            for argument in values {
                let argument = argument
                    .as_str()
                    .filter(|value| !value.contains('\0') && value.len() <= 1_024)
                    .ok_or("PROCESS_PROFILE_INVALID")?;
                normalized.push(argument.to_owned());
            }
            if allowed_arguments.contains(&normalized) {
                return Err("PROCESS_PROFILE_INVALID");
            }
            allowed_arguments.push(normalized);
        }
        let cwd_values = object
            .get("allowedCwds")
            .and_then(Value::as_array)
            .filter(|values| !values.is_empty() && values.len() <= 32)
            .ok_or("PROCESS_PROFILE_INVALID")?;
        let mut allowed_cwds = HashMap::new();
        for cwd in cwd_values {
            let cwd = cwd.as_str().ok_or("PROCESS_PROFILE_INVALID")?;
            let resolved = confined_directory(root, cwd).map_err(|_| "PROCESS_PROFILE_INVALID")?;
            if allowed_cwds.insert(cwd.to_owned(), resolved).is_some() {
                return Err("PROCESS_PROFILE_INVALID");
            }
        }
        let environment_value = object
            .get("environment")
            .and_then(Value::as_object)
            .ok_or("PROCESS_PROFILE_INVALID")?;
        if environment_value.len() > allowed_environment.len() {
            return Err("PROCESS_PROFILE_INVALID");
        }
        let mut environment = Vec::new();
        for (key, value) in environment_value {
            if !allowed_environment.contains(&key.as_str()) {
                return Err("PROCESS_PROFILE_INVALID");
            }
            let value = value
                .as_str()
                .filter(|value| !value.contains('\0') && value.len() <= 256)
                .ok_or("PROCESS_PROFILE_INVALID")?;
            environment.push((key.clone(), value.to_owned()));
        }
        environment.sort();
        let maximum_timeout_ms = object
            .get("maximumTimeoutMs")
            .and_then(Value::as_u64)
            .filter(|value| (1..=300_000).contains(value))
            .ok_or("PROCESS_PROFILE_INVALID")?;
        let maximum_output_bytes = object
            .get("maximumOutputBytes")
            .and_then(Value::as_u64)
            .filter(|value| (1..=MAX_PROCESS_OUTPUT_BYTES as u64).contains(value))
            .ok_or("PROCESS_PROFILE_INVALID")? as usize;
        if profiles
            .insert(
                id.to_owned(),
                ProcessProfile {
                    allowed_arguments,
                    allowed_cwds,
                    environment,
                    executable,
                    executable_sha256: executable_sha256.to_ascii_lowercase(),
                    maximum_output_bytes,
                    maximum_timeout_ms,
                },
            )
            .is_some()
        {
            return Err("PROCESS_PROFILE_INVALID");
        }
    }
    Ok(profiles)
}

fn capture_pipe<R: Read>(
    mut pipe: R,
    output: Arc<Mutex<Vec<u8>>>,
    total: Arc<AtomicUsize>,
    maximum: usize,
    exceeded: Arc<AtomicBool>,
) {
    let mut buffer = [0_u8; 4096];
    loop {
        let count = match pipe.read(&mut buffer) {
            Ok(0) | Err(_) => return,
            Ok(count) => count,
        };
        let previous = total.fetch_add(count, Ordering::SeqCst);
        let retained = maximum.saturating_sub(previous).min(count);
        if retained > 0 {
            output
                .lock()
                .unwrap()
                .extend_from_slice(&buffer[..retained]);
        }
        if retained < count {
            exceeded.store(true, Ordering::SeqCst);
        }
    }
}

#[cfg(unix)]
fn signal_process_group(process_group: i32, signal_number: i32) {
    // SAFETY: the group ID was returned by the child spawn and is positive.
    unsafe {
        kill(-process_group, signal_number);
    }
}

fn terminate_process(
    child: &mut std::process::Child,
    #[allow(unused_variables)] process_group: i32,
) -> Result<std::process::ExitStatus, &'static str> {
    #[cfg(unix)]
    signal_process_group(process_group, 15);
    #[cfg(not(unix))]
    child.kill().map_err(|_| "PROCESS_TERMINATION_FAILED")?;
    let deadline = Instant::now() + Duration::from_millis(200);
    while Instant::now() < deadline {
        if let Some(status) = child.try_wait().map_err(|_| "PROCESS_WAIT_FAILED")? {
            return Ok(status);
        }
        thread::sleep(Duration::from_millis(10));
    }
    #[cfg(unix)]
    signal_process_group(process_group, 9);
    #[cfg(not(unix))]
    child.kill().map_err(|_| "PROCESS_TERMINATION_FAILED")?;
    child.wait().map_err(|_| "PROCESS_WAIT_FAILED")
}

fn run_process(
    profiles: &HashMap<String, ProcessProfile>,
    object: &serde_json::Map<String, Value>,
) -> Result<Value, &'static str> {
    let profile_id = object
        .get("profileId")
        .and_then(Value::as_str)
        .ok_or("PROCESS_RUN_INVALID")?;
    let profile = profiles
        .get(profile_id)
        .ok_or("PROCESS_PROFILE_UNAVAILABLE")?;
    let arguments = object
        .get("arguments")
        .and_then(Value::as_array)
        .ok_or("PROCESS_RUN_INVALID")?
        .iter()
        .map(|value| {
            value
                .as_str()
                .filter(|value| !value.contains('\0') && value.len() <= 1_024)
                .map(str::to_owned)
                .ok_or("PROCESS_RUN_INVALID")
        })
        .collect::<Result<Vec<_>, _>>()?;
    if !profile.allowed_arguments.contains(&arguments) {
        return Err("PROCESS_ARGUMENTS_DENIED");
    }
    let cwd_id = object
        .get("cwd")
        .and_then(Value::as_str)
        .ok_or("PROCESS_RUN_INVALID")?;
    let cwd = profile
        .allowed_cwds
        .get(cwd_id)
        .ok_or("PROCESS_CWD_DENIED")?;
    let timeout_ms = object
        .get("timeoutMs")
        .and_then(Value::as_u64)
        .filter(|value| *value > 0 && *value <= profile.maximum_timeout_ms)
        .ok_or("PROCESS_TIMEOUT_DENIED")?;
    let maximum_output_bytes = object
        .get("maxOutputBytes")
        .and_then(Value::as_u64)
        .filter(|value| *value > 0 && *value as usize <= profile.maximum_output_bytes)
        .ok_or("PROCESS_OUTPUT_LIMIT_DENIED")? as usize;
    if file_sha256(&profile.executable)? != profile.executable_sha256 {
        return Err("PROCESS_EXECUTABLE_DIGEST_MISMATCH");
    }

    let mut command = Command::new(&profile.executable);
    command
        .args(&arguments)
        .current_dir(cwd)
        .env_clear()
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    for (key, value) in &profile.environment {
        command.env(key, value);
    }
    #[cfg(unix)]
    command.process_group(0);
    let started = Instant::now();
    let mut child = command.spawn().map_err(|_| "PROCESS_SPAWN_FAILED")?;
    let process_group = child.id() as i32;
    #[cfg(unix)]
    ACTIVE_PROCESS_GROUP.store(process_group, Ordering::SeqCst);
    let stdout = child.stdout.take().ok_or("PROCESS_PIPE_FAILED")?;
    let stderr = child.stderr.take().ok_or("PROCESS_PIPE_FAILED")?;
    let output_total = Arc::new(AtomicUsize::new(0));
    let output_exceeded = Arc::new(AtomicBool::new(false));
    let stdout_bytes = Arc::new(Mutex::new(Vec::new()));
    let stderr_bytes = Arc::new(Mutex::new(Vec::new()));
    let stdout_thread = {
        let output = Arc::clone(&stdout_bytes);
        let total = Arc::clone(&output_total);
        let exceeded = Arc::clone(&output_exceeded);
        thread::spawn(move || capture_pipe(stdout, output, total, maximum_output_bytes, exceeded))
    };
    let stderr_thread = {
        let output = Arc::clone(&stderr_bytes);
        let total = Arc::clone(&output_total);
        let exceeded = Arc::clone(&output_exceeded);
        thread::spawn(move || capture_pipe(stderr, output, total, maximum_output_bytes, exceeded))
    };

    let (status, termination) = loop {
        if PROCESS_CANCEL_REQUESTED.load(Ordering::SeqCst) {
            break (terminate_process(&mut child, process_group)?, "cancelled");
        }
        if output_exceeded.load(Ordering::SeqCst) {
            break (
                terminate_process(&mut child, process_group)?,
                "output-limit",
            );
        }
        if started.elapsed() >= Duration::from_millis(timeout_ms) {
            break (terminate_process(&mut child, process_group)?, "timeout");
        }
        if let Some(status) = child.try_wait().map_err(|_| "PROCESS_WAIT_FAILED")? {
            break (status, "exited");
        }
        thread::sleep(Duration::from_millis(10));
    };
    #[cfg(unix)]
    ACTIVE_PROCESS_GROUP.store(0, Ordering::SeqCst);
    PROCESS_CANCEL_REQUESTED.store(false, Ordering::SeqCst);
    stdout_thread.join().map_err(|_| "PROCESS_PIPE_FAILED")?;
    stderr_thread.join().map_err(|_| "PROCESS_PIPE_FAILED")?;
    let stdout = stdout_bytes.lock().unwrap();
    let stderr = stderr_bytes.lock().unwrap();
    let stdout_lossy = String::from_utf8_lossy(&stdout);
    let stderr_lossy = String::from_utf8_lossy(&stderr);
    #[cfg(unix)]
    let signal = status.signal();
    #[cfg(not(unix))]
    let signal: Option<i32> = None;
    Ok(json!({
        "arguments": arguments,
        "cwd": cwd_id,
        "durationMs": started.elapsed().as_millis().min(u128::from(u64::MAX)) as u64,
        "executable": profile.executable.to_string_lossy(),
        "executableSha256": profile.executable_sha256,
        "exitCode": status.code(),
        "maxOutputBytes": maximum_output_bytes,
        "outputTruncated": output_exceeded.load(Ordering::SeqCst),
        "profileId": profile_id,
        "signal": signal,
        "stderr": stderr_lossy,
        "stderrUtf8Lossy": matches!(stderr_lossy, std::borrow::Cow::Owned(_)),
        "stdout": stdout_lossy,
        "stdoutUtf8Lossy": matches!(stdout_lossy, std::borrow::Cow::Owned(_)),
        "termination": termination,
        "timeoutMs": timeout_ms
    }))
}

#[cfg(unix)]
fn duplicate_fd(fd: i32) -> Result<OwnedFd, &'static str> {
    // SAFETY: dup returns a new owned descriptor or -1 without changing the source descriptor.
    let duplicated = unsafe { libc::dup(fd) };
    if duplicated < 0 {
        return Err("WORKSPACE_MUTATION_FAILED");
    }
    // SAFETY: duplicated is a newly owned valid descriptor.
    Ok(unsafe { OwnedFd::from_raw_fd(duplicated) })
}

#[cfg(unix)]
fn mutation_parent(root: &fs::File, relative: &str) -> Result<(OwnedFd, CString), &'static str> {
    if relative.is_empty() || relative.len() > 4096 || relative.contains('\0') {
        return Err("WORKSPACE_PATH_INVALID");
    }
    let path = Path::new(relative);
    if path.is_absolute()
        || path
            .components()
            .any(|component| !matches!(component, Component::Normal(_)))
    {
        return Err("WORKSPACE_PATH_INVALID");
    }
    let components = path.components().collect::<Vec<_>>();
    let Some(Component::Normal(file_name)) = components.last() else {
        return Err("WORKSPACE_PATH_INVALID");
    };
    let mut parent = duplicate_fd(root.as_raw_fd())?;
    for component in &components[..components.len() - 1] {
        let Component::Normal(name) = component else {
            return Err("WORKSPACE_PATH_INVALID");
        };
        let name = CString::new(name.as_bytes()).map_err(|_| "WORKSPACE_PATH_INVALID")?;
        // SAFETY: parent and name are valid; O_NOFOLLOW prevents a symbolic-link directory hop.
        let next = unsafe {
            libc::openat(
                parent.as_raw_fd(),
                name.as_ptr(),
                libc::O_RDONLY | libc::O_DIRECTORY | libc::O_NOFOLLOW | libc::O_CLOEXEC,
            )
        };
        if next < 0 {
            return Err("WORKSPACE_PATH_UNSAFE");
        }
        // SAFETY: next is a newly owned valid descriptor.
        parent = unsafe { OwnedFd::from_raw_fd(next) };
    }
    Ok((
        parent,
        CString::new(file_name.as_bytes()).map_err(|_| "WORKSPACE_PATH_INVALID")?,
    ))
}

#[cfg(unix)]
fn read_target_at(
    parent: &OwnedFd,
    file_name: &CString,
) -> Result<Option<(Vec<u8>, u32)>, &'static str> {
    // SAFETY: parent and file_name are valid; O_NOFOLLOW rejects a final symbolic link.
    let descriptor = unsafe {
        libc::openat(
            parent.as_raw_fd(),
            file_name.as_ptr(),
            libc::O_RDONLY | libc::O_NOFOLLOW | libc::O_CLOEXEC,
        )
    };
    if descriptor < 0 {
        return if io::Error::last_os_error().raw_os_error() == Some(libc::ENOENT) {
            Ok(None)
        } else {
            Err("WORKSPACE_PATH_UNSAFE")
        };
    }
    // SAFETY: descriptor is a newly owned valid descriptor.
    let owned = unsafe { OwnedFd::from_raw_fd(descriptor) };
    let mut file: fs::File = owned.into();
    let metadata = file.metadata().map_err(|_| "WORKSPACE_MUTATION_FAILED")?;
    if !metadata.is_file() || metadata.len() > MAX_FILE_BYTES {
        return Err("WORKSPACE_FILE_UNREADABLE");
    }
    use std::os::unix::fs::PermissionsExt;
    let mode = metadata.permissions().mode() & 0o777;
    let mut bytes = Vec::with_capacity(metadata.len() as usize);
    file.read_to_end(&mut bytes)
        .map_err(|_| "WORKSPACE_FILE_UNREADABLE")?;
    Ok(Some((bytes, mode)))
}

fn bytes_sha256(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn expected_digest(value: Option<&Value>) -> Result<Option<String>, &'static str> {
    match value {
        Some(Value::Null) => Ok(None),
        Some(Value::String(value))
            if value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit()) =>
        {
            Ok(Some(value.to_ascii_lowercase()))
        }
        _ => Err("WORKSPACE_MUTATION_INVALID"),
    }
}

#[cfg(unix)]
fn enforce_precondition(
    current: &Option<(Vec<u8>, u32)>,
    expected: &Option<String>,
) -> Result<(), &'static str> {
    match (current, expected) {
        (None, None) => Ok(()),
        (Some((bytes, _)), Some(digest)) if bytes_sha256(bytes) == *digest => Ok(()),
        _ => Err("WORKSPACE_PRECONDITION_FAILED"),
    }
}

#[cfg(unix)]
fn sync_parent(parent: &OwnedFd) -> Result<(), &'static str> {
    let duplicate = duplicate_fd(parent.as_raw_fd())?;
    let directory: fs::File = duplicate.into();
    directory
        .sync_all()
        .map_err(|_| "WORKSPACE_MUTATION_SYNC_FAILED")
}

#[cfg(unix)]
fn atomic_write_at(
    parent: &OwnedFd,
    file_name: &CString,
    content: &[u8],
    expected: &Option<String>,
    request_id: &str,
) -> Result<Value, &'static str> {
    let current = read_target_at(parent, file_name)?;
    enforce_precondition(&current, expected)?;
    let before_digest = current.as_ref().map(|(bytes, _)| bytes_sha256(bytes));
    let mode = current.as_ref().map(|(_, mode)| *mode).unwrap_or(0o644);
    let temporary_digest = bytes_sha256(request_id.as_bytes());
    let temporary_name = CString::new(format!(".curiosity-{}.tmp", &temporary_digest[..32]))
        .map_err(|_| "WORKSPACE_MUTATION_FAILED")?;
    // SAFETY: parent and temporary_name are valid; O_EXCL and O_NOFOLLOW prevent substitution.
    let descriptor = unsafe {
        libc::openat(
            parent.as_raw_fd(),
            temporary_name.as_ptr(),
            libc::O_WRONLY | libc::O_CREAT | libc::O_EXCL | libc::O_NOFOLLOW | libc::O_CLOEXEC,
            mode,
        )
    };
    if descriptor < 0 {
        return Err("WORKSPACE_MUTATION_TEMP_CONFLICT");
    }
    // SAFETY: descriptor is a newly owned valid descriptor.
    let owned = unsafe { OwnedFd::from_raw_fd(descriptor) };
    let mut temporary: fs::File = owned.into();
    let write_result = (|| {
        temporary
            .write_all(content)
            .map_err(|_| "WORKSPACE_MUTATION_WRITE_FAILED")?;
        temporary
            .sync_all()
            .map_err(|_| "WORKSPACE_MUTATION_SYNC_FAILED")?;
        enforce_precondition(&read_target_at(parent, file_name)?, expected)?;
        // SAFETY: both names are relative to the retained parent descriptor.
        if unsafe {
            libc::renameat(
                parent.as_raw_fd(),
                temporary_name.as_ptr(),
                parent.as_raw_fd(),
                file_name.as_ptr(),
            )
        } != 0
        {
            return Err("WORKSPACE_MUTATION_RENAME_FAILED");
        }
        sync_parent(parent)?;
        Ok(())
    })();
    if write_result.is_err() {
        // SAFETY: best-effort cleanup is confined to the retained parent descriptor.
        unsafe {
            libc::unlinkat(parent.as_raw_fd(), temporary_name.as_ptr(), 0);
        }
        write_result?;
    }
    let after =
        read_target_at(parent, file_name)?.ok_or("WORKSPACE_MUTATION_RECONCILIATION_FAILED")?;
    let after_digest = bytes_sha256(&after.0);
    if after.0 != content {
        return Err("WORKSPACE_MUTATION_RECONCILIATION_FAILED");
    }
    Ok(json!({
        "afterSha256": after_digest,
        "beforeSha256": before_digest,
        "bytesWritten": content.len(),
        "created": current.is_none()
    }))
}

#[cfg(unix)]
fn write_workspace(
    root: &fs::File,
    object: &serde_json::Map<String, Value>,
) -> Result<Value, &'static str> {
    let relative = object
        .get("path")
        .and_then(Value::as_str)
        .ok_or("WORKSPACE_MUTATION_INVALID")?;
    let content = object
        .get("content")
        .and_then(Value::as_str)
        .filter(|value| value.len() <= MAX_MUTATION_BYTES)
        .ok_or("WORKSPACE_MUTATION_INVALID")?;
    let expected = expected_digest(object.get("expectedSha256"))?;
    let request_id = request_id(object).ok_or("WORKSPACE_MUTATION_INVALID")?;
    let (parent, file_name) = mutation_parent(root, relative)?;
    let output = atomic_write_at(
        &parent,
        &file_name,
        content.as_bytes(),
        &expected,
        request_id,
    )?;
    Ok(json!({ "operation": "write", "path": relative, "receipt": output }))
}

#[cfg(unix)]
fn patch_workspace(
    root: &fs::File,
    object: &serde_json::Map<String, Value>,
) -> Result<Value, &'static str> {
    let relative = object
        .get("path")
        .and_then(Value::as_str)
        .ok_or("WORKSPACE_MUTATION_INVALID")?;
    let expected =
        expected_digest(object.get("expectedSha256"))?.ok_or("WORKSPACE_PRECONDITION_REQUIRED")?;
    let replacements = object
        .get("replacements")
        .and_then(Value::as_array)
        .filter(|values| !values.is_empty() && values.len() <= 64)
        .ok_or("WORKSPACE_MUTATION_INVALID")?;
    let request_id = request_id(object).ok_or("WORKSPACE_MUTATION_INVALID")?;
    let (parent, file_name) = mutation_parent(root, relative)?;
    let current = read_target_at(&parent, &file_name)?.ok_or("WORKSPACE_PRECONDITION_FAILED")?;
    enforce_precondition(&Some(current.clone()), &Some(expected.clone()))?;
    let mut content = String::from_utf8(current.0).map_err(|_| "WORKSPACE_FILE_NOT_UTF8")?;
    for replacement in replacements {
        let replacement = replacement
            .as_object()
            .filter(|object| object.len() == 3)
            .ok_or("WORKSPACE_MUTATION_INVALID")?;
        let old = replacement
            .get("old")
            .and_then(Value::as_str)
            .filter(|value| !value.is_empty() && value.len() <= 8 * 1024)
            .ok_or("WORKSPACE_MUTATION_INVALID")?;
        let new = replacement
            .get("new")
            .and_then(Value::as_str)
            .filter(|value| value.len() <= 8 * 1024)
            .ok_or("WORKSPACE_MUTATION_INVALID")?;
        let expected_occurrences = replacement
            .get("expectedOccurrences")
            .and_then(Value::as_u64)
            .filter(|value| (1..=1_000).contains(value))
            .ok_or("WORKSPACE_MUTATION_INVALID")? as usize;
        if content.matches(old).count() != expected_occurrences {
            return Err("WORKSPACE_PATCH_OCCURRENCE_MISMATCH");
        }
        content = content.replace(old, new);
        if content.len() > MAX_MUTATION_BYTES {
            return Err("WORKSPACE_MUTATION_TOO_LARGE");
        }
    }
    let output = atomic_write_at(
        &parent,
        &file_name,
        content.as_bytes(),
        &Some(expected),
        request_id,
    )?;
    Ok(json!({ "operation": "patch", "path": relative, "receipt": output }))
}

#[cfg(unix)]
fn delete_workspace(
    root: &fs::File,
    object: &serde_json::Map<String, Value>,
) -> Result<Value, &'static str> {
    let relative = object
        .get("path")
        .and_then(Value::as_str)
        .ok_or("WORKSPACE_MUTATION_INVALID")?;
    let expected =
        expected_digest(object.get("expectedSha256"))?.ok_or("WORKSPACE_PRECONDITION_REQUIRED")?;
    let (parent, file_name) = mutation_parent(root, relative)?;
    let current = read_target_at(&parent, &file_name)?.ok_or("WORKSPACE_PRECONDITION_FAILED")?;
    enforce_precondition(&Some(current.clone()), &Some(expected))?;
    let before_digest = bytes_sha256(&current.0);
    // SAFETY: the exact preconditioned final name is removed relative to the retained parent.
    if unsafe { libc::unlinkat(parent.as_raw_fd(), file_name.as_ptr(), 0) } != 0 {
        return Err("WORKSPACE_MUTATION_DELETE_FAILED");
    }
    sync_parent(&parent)?;
    if read_target_at(&parent, &file_name)?.is_some() {
        return Err("WORKSPACE_MUTATION_RECONCILIATION_FAILED");
    }
    Ok(json!({
        "beforeSha256": before_digest,
        "operation": "delete",
        "path": relative
    }))
}

fn search_directory(
    root: &Path,
    directory: &Path,
    query: &str,
    max_results: usize,
    visited: &mut usize,
    matches: &mut Vec<Value>,
) -> Result<bool, &'static str> {
    if matches.len() >= max_results || *visited >= MAX_SEARCH_ENTRIES {
        return Ok(true);
    }
    let mut entries = fs::read_dir(directory)
        .map_err(|_| "WORKSPACE_SEARCH_FAILED")?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| "WORKSPACE_SEARCH_FAILED")?;
    entries.sort_by_key(|entry| entry.file_name());
    for entry in entries {
        *visited += 1;
        if *visited > MAX_SEARCH_ENTRIES {
            return Ok(true);
        }
        let file_type = entry.file_type().map_err(|_| "WORKSPACE_SEARCH_FAILED")?;
        if file_type.is_symlink() {
            continue;
        }
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if file_type.is_dir() {
            if !skipped_directory(&name)
                && search_directory(root, &entry.path(), query, max_results, visited, matches)?
            {
                return Ok(true);
            }
            continue;
        }
        if !file_type.is_file() {
            continue;
        }
        let metadata = entry.metadata().map_err(|_| "WORKSPACE_SEARCH_FAILED")?;
        if metadata.len() > MAX_FILE_BYTES {
            continue;
        }
        let bytes = match fs::read(entry.path()) {
            Ok(value) => value,
            Err(_) => continue,
        };
        let text = match std::str::from_utf8(&bytes) {
            Ok(value) => value,
            Err(_) => continue,
        };
        for (index, line) in text.lines().enumerate() {
            if !line.contains(query) {
                continue;
            }
            let preview: String = line.chars().take(300).collect();
            let relative = entry
                .path()
                .strip_prefix(root)
                .map_err(|_| "WORKSPACE_PATH_OUTSIDE_ROOT")?
                .to_string_lossy()
                .replace('\\', "/");
            matches.push(json!({ "line": index + 1, "path": relative, "preview": preview }));
            if matches.len() >= max_results {
                return Ok(true);
            }
            break;
        }
    }
    Ok(false)
}

fn search_workspace(
    root: &Path,
    object: &serde_json::Map<String, Value>,
) -> Result<Value, &'static str> {
    let query = object
        .get("query")
        .and_then(Value::as_str)
        .ok_or("WORKSPACE_SEARCH_INVALID")?;
    if query.is_empty() || query.len() > 256 || query.contains('\0') {
        return Err("WORKSPACE_SEARCH_INVALID");
    }
    let max_results = object
        .get("maxResults")
        .and_then(Value::as_u64)
        .filter(|value| (1..=20).contains(value))
        .ok_or("WORKSPACE_SEARCH_INVALID")? as usize;
    let mut matches = Vec::new();
    let mut visited = 0;
    let truncated = search_directory(root, root, query, max_results, &mut visited, &mut matches)?;
    Ok(
        json!({ "matches": matches, "query": query, "truncated": truncated, "visitedEntries": visited }),
    )
}

fn write_frame<W: Write>(writer: &mut W, value: &Value) -> io::Result<()> {
    let bytes = serde_json::to_vec(value)?;
    if bytes.len() > MAX_FRAME_BYTES {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "SUPERVISOR_FRAME_TOO_LARGE",
        ));
    }
    writer.write_all(&bytes)?;
    writer.write_all(b"\n")?;
    writer.flush()
}

fn run<R: BufRead, W: Write>(reader: &mut R, writer: &mut W) -> Result<(), &'static str> {
    let frame = read_frame(reader)
        .map_err(|_| "SUPERVISOR_HANDSHAKE_READ_FAILED")?
        .ok_or("SUPERVISOR_HANDSHAKE_REQUIRED")?;
    let request: Value =
        serde_json::from_slice(&frame).map_err(|_| "SUPERVISOR_HANDSHAKE_INVALID")?;
    let object =
        exact_request(&request, "handshake.request", 7).ok_or("SUPERVISOR_HANDSHAKE_INVALID")?;
    let nonce = object
        .get("nonce")
        .and_then(Value::as_str)
        .ok_or("SUPERVISOR_HANDSHAKE_INVALID")?;
    if nonce.len() != 64 || !nonce.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err("SUPERVISOR_HANDSHAKE_INVALID");
    }
    let workspace = object
        .get("workspaceRoot")
        .and_then(Value::as_str)
        .ok_or("SUPERVISOR_HANDSHAKE_INVALID")?;
    let root = fs::canonicalize(workspace).map_err(|_| "SUPERVISOR_WORKSPACE_INVALID")?;
    if !root.is_dir() {
        return Err("SUPERVISOR_WORKSPACE_INVALID");
    }
    let root_handle = fs::File::open(&root).map_err(|_| "SUPERVISOR_WORKSPACE_INVALID")?;
    let mutation_requested = object
        .get("workspaceMutationEnabled")
        .and_then(Value::as_bool)
        .ok_or("SUPERVISOR_HANDSHAKE_INVALID")?;
    let mutation_enabled = mutation_requested && cfg!(unix);
    let profiles = process_profiles(
        &root,
        object
            .get("processProfiles")
            .ok_or("SUPERVISOR_HANDSHAKE_INVALID")?,
    )?;
    let git = git_profile(
        &root,
        &root_handle,
        object
            .get("gitProfile")
            .ok_or("SUPERVISOR_HANDSHAKE_INVALID")?,
    )?;
    write_frame(
        writer,
        &json!({
            "protocolVersion": PROTOCOL_VERSION,
            "kind": "handshake.accepted",
            "nonce": nonce,
            "capabilities": {
                "filesystemMutation": mutation_enabled,
                "filesystemRead": true,
                "git": git.is_some(),
                "gitMutation": git.as_ref().is_some_and(|profile| profile.worktree_root.is_some()),
                "process": !profiles.is_empty(),
                "sandbox": false
            }
        }),
    )
    .map_err(|_| "SUPERVISOR_HANDSHAKE_WRITE_FAILED")?;

    while let Some(frame) = read_frame(reader).map_err(|_| "SUPERVISOR_FRAME_READ_FAILED")? {
        let request: Value =
            serde_json::from_slice(&frame).map_err(|_| "SUPERVISOR_REQUEST_INVALID")?;
        if exact_request(&request, "shutdown", 2).is_some() {
            write_frame(
                writer,
                &json!({ "protocolVersion": PROTOCOL_VERSION, "kind": "shutdown.accepted" }),
            )
            .map_err(|_| "SUPERVISOR_SHUTDOWN_WRITE_FAILED")?;
            return Ok(());
        }
        if request.get("kind").and_then(Value::as_str) == Some("process.run") {
            let object =
                exact_request(&request, "process.run", 8).ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let request_id = request_id(object).ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let response = match run_process(&profiles, object) {
                Ok(output) => json!({
                    "protocolVersion": PROTOCOL_VERSION,
                    "kind": "process.run.succeeded",
                    "requestId": request_id,
                    "output": output
                }),
                Err(error_code) => json!({
                    "protocolVersion": PROTOCOL_VERSION,
                    "kind": "process.run.failed",
                    "requestId": request_id,
                    "errorCode": error_code
                }),
            };
            write_frame(writer, &response).map_err(|_| "SUPERVISOR_RESPONSE_WRITE_FAILED")?;
            continue;
        }
        if matches!(
            request.get("kind").and_then(Value::as_str),
            Some("git.status" | "git.diff")
        ) {
            let kind = request
                .get("kind")
                .and_then(Value::as_str)
                .ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let expected_fields = if kind == "git.status" { 4 } else { 5 };
            let object = exact_request(&request, kind, expected_fields)
                .ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let request_id = request_id(object).ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let result = git
                .as_ref()
                .ok_or("GIT_PROFILE_UNAVAILABLE")
                .and_then(|profile| git_request(profile, &root_handle, kind, object));
            let response = match result {
                Ok(output) => json!({
                    "protocolVersion": PROTOCOL_VERSION,
                    "kind": format!("{kind}.succeeded"),
                    "requestId": request_id,
                    "output": output
                }),
                Err(error_code) => json!({
                    "protocolVersion": PROTOCOL_VERSION,
                    "kind": format!("{kind}.failed"),
                    "requestId": request_id,
                    "errorCode": error_code
                }),
            };
            write_frame(writer, &response).map_err(|_| "SUPERVISOR_RESPONSE_WRITE_FAILED")?;
            continue;
        }
        if matches!(
            request.get("kind").and_then(Value::as_str),
            Some("git.ref.inspect" | "git.ref.update")
        ) {
            let kind = request
                .get("kind")
                .and_then(Value::as_str)
                .ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let expected_fields = if kind == "git.ref.inspect" { 5 } else { 8 };
            let object = exact_request(&request, kind, expected_fields)
                .ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let request_id = request_id(object).ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let result = git
                .as_ref()
                .ok_or("GIT_PROFILE_UNAVAILABLE")
                .and_then(|profile| git_ref_request(profile, &root_handle, kind, object));
            let response = match result {
                Ok(output) => json!({
                    "protocolVersion": PROTOCOL_VERSION,
                    "kind": format!("{kind}.succeeded"),
                    "requestId": request_id,
                    "output": output
                }),
                Err(error_code) => json!({
                    "protocolVersion": PROTOCOL_VERSION,
                    "kind": format!("{kind}.failed"),
                    "requestId": request_id,
                    "errorCode": error_code
                }),
            };
            write_frame(writer, &response).map_err(|_| "SUPERVISOR_RESPONSE_WRITE_FAILED")?;
            continue;
        }
        if matches!(
            request.get("kind").and_then(Value::as_str),
            Some("git.worktree.create" | "git.worktree.inspect" | "git.worktree.remove")
        ) {
            let kind = request
                .get("kind")
                .and_then(Value::as_str)
                .ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let expected_fields = if kind == "git.worktree.inspect" { 6 } else { 7 };
            let object = exact_request(&request, kind, expected_fields)
                .ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let request_id = request_id(object).ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let result = git
                .as_ref()
                .ok_or("GIT_PROFILE_UNAVAILABLE")
                .and_then(|profile| git_worktree_request(profile, &root_handle, kind, object));
            let response = match result {
                Ok(output) => json!({
                    "protocolVersion": PROTOCOL_VERSION,
                    "kind": format!("{kind}.succeeded"),
                    "requestId": request_id,
                    "output": output
                }),
                Err(error_code) => json!({
                    "protocolVersion": PROTOCOL_VERSION,
                    "kind": format!("{kind}.failed"),
                    "requestId": request_id,
                    "errorCode": error_code
                }),
            };
            write_frame(writer, &response).map_err(|_| "SUPERVISOR_RESPONSE_WRITE_FAILED")?;
            continue;
        }
        if matches!(
            request.get("kind").and_then(Value::as_str),
            Some("workspace.write" | "workspace.patch" | "workspace.delete")
        ) {
            let kind = request
                .get("kind")
                .and_then(Value::as_str)
                .ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let expected_fields = if kind == "workspace.delete" { 5 } else { 6 };
            let object = exact_request(&request, kind, expected_fields)
                .ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let request_id = request_id(object).ok_or("SUPERVISOR_REQUEST_INVALID")?;
            let result = if !mutation_enabled {
                Err("WORKSPACE_MUTATION_UNAVAILABLE")
            } else {
                #[cfg(unix)]
                {
                    match kind {
                        "workspace.write" => write_workspace(&root_handle, object),
                        "workspace.patch" => patch_workspace(&root_handle, object),
                        "workspace.delete" => delete_workspace(&root_handle, object),
                        _ => Err("SUPERVISOR_REQUEST_UNSUPPORTED"),
                    }
                }
                #[cfg(not(unix))]
                {
                    Err("WORKSPACE_MUTATION_UNAVAILABLE")
                }
            };
            let response = match result {
                Ok(output) => json!({
                    "protocolVersion": PROTOCOL_VERSION,
                    "kind": format!("{kind}.succeeded"),
                    "requestId": request_id,
                    "output": output
                }),
                Err(error_code) => json!({
                    "protocolVersion": PROTOCOL_VERSION,
                    "kind": format!("{kind}.failed"),
                    "requestId": request_id,
                    "errorCode": error_code
                }),
            };
            write_frame(writer, &response).map_err(|_| "SUPERVISOR_RESPONSE_WRITE_FAILED")?;
            continue;
        }
        let (kind, expected_fields, operation): (&str, usize, WorkspaceOperation) =
            if request.get("kind").and_then(Value::as_str) == Some("workspace.read") {
                ("workspace.read", 6, read_workspace)
            } else if request.get("kind").and_then(Value::as_str) == Some("workspace.search") {
                ("workspace.search", 5, search_workspace)
            } else if request.get("kind").and_then(Value::as_str) == Some("workspace.list") {
                ("workspace.list", 6, list_workspace)
            } else if request.get("kind").and_then(Value::as_str) == Some("workspace.glob") {
                ("workspace.glob", 5, glob_workspace)
            } else {
                return Err("SUPERVISOR_REQUEST_UNSUPPORTED");
            };
        let object =
            exact_request(&request, kind, expected_fields).ok_or("SUPERVISOR_REQUEST_INVALID")?;
        let request_id = request_id(object).ok_or("SUPERVISOR_REQUEST_INVALID")?;
        let response = match operation(&root, object) {
            Ok(output) => json!({
                "protocolVersion": PROTOCOL_VERSION,
                "kind": format!("{kind}.succeeded"),
                "requestId": request_id,
                "output": output
            }),
            Err(error_code) => json!({
                "protocolVersion": PROTOCOL_VERSION,
                "kind": format!("{kind}.failed"),
                "requestId": request_id,
                "errorCode": error_code
            }),
        };
        write_frame(writer, &response).map_err(|_| "SUPERVISOR_RESPONSE_WRITE_FAILED")?;
    }
    Ok(())
}

fn main() {
    install_process_signal_handler();
    let stdin = io::stdin();
    let stdout = io::stdout();
    if let Err(diagnostic) = run(&mut stdin.lock(), &mut stdout.lock()) {
        eprintln!("{diagnostic}");
        std::process::exit(64);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{BufReader, Cursor};
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::time::{SystemTime, UNIX_EPOCH};

    static FIXTURE_ORDINAL: AtomicU64 = AtomicU64::new(0);

    fn fixture_root() -> PathBuf {
        let root = std::env::temp_dir().join(format!(
            "curiosity-supervisor-{}-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos(),
            FIXTURE_ORDINAL.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&root).unwrap();
        fs::write(root.join("baseline.md"), "baseline marker-001\n").unwrap();
        root
    }

    #[test]
    fn accepts_handshake_search_read_then_shutdown() {
        let root = fixture_root();
        fs::write(
            root.join("baseline.md"),
            "baseline marker-001\nsecond marker-001\n",
        )
        .unwrap();
        fs::create_dir(root.join(".turbo")).unwrap();
        fs::write(root.join(".turbo/cache.log"), "marker-001\n").unwrap();
        fs::create_dir(root.join("src")).unwrap();
        fs::write(root.join("src/main.ts"), "export {};\n").unwrap();
        let input = format!(
            "{{\"protocolVersion\":4,\"kind\":\"handshake.request\",\"nonce\":\"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\",\"workspaceRoot\":{},\"processProfiles\":[],\"workspaceMutationEnabled\":false,\"gitProfile\":null}}\n{{\"protocolVersion\":4,\"kind\":\"workspace.search\",\"requestId\":\"search-1\",\"query\":\"marker-001\",\"maxResults\":2}}\n{{\"protocolVersion\":4,\"kind\":\"workspace.read\",\"requestId\":\"read-1\",\"path\":\"baseline.md\",\"startLine\":1,\"maxLines\":5}}\n{{\"protocolVersion\":4,\"kind\":\"workspace.list\",\"requestId\":\"list-1\",\"path\":\".\",\"recursive\":false,\"maxEntries\":10}}\n{{\"protocolVersion\":4,\"kind\":\"workspace.glob\",\"requestId\":\"glob-1\",\"pattern\":\"**/*.ts\",\"maxResults\":10}}\n{{\"protocolVersion\":4,\"kind\":\"shutdown\"}}\n",
            serde_json::to_string(root.to_str().unwrap()).unwrap()
        );
        let mut output = Vec::new();
        run(&mut BufReader::new(Cursor::new(input)), &mut output).expect("valid protocol");
        let lines: Vec<Value> = output
            .split(|byte| *byte == b'\n')
            .filter(|line| !line.is_empty())
            .map(|line| serde_json::from_slice(line).expect("valid response"))
            .collect();
        assert_eq!(lines.len(), 6);
        assert_eq!(lines[0]["capabilities"]["filesystemRead"], true);
        assert_eq!(lines[1]["output"]["matches"][0]["path"], "baseline.md");
        assert_eq!(lines[1]["output"]["matches"].as_array().unwrap().len(), 1);
        assert!(
            lines[2]["output"]["content"]
                .as_str()
                .unwrap()
                .contains("marker-001")
        );
        let listed_paths: Vec<&str> = lines[3]["output"]["entries"]
            .as_array()
            .unwrap()
            .iter()
            .map(|entry| entry["path"].as_str().unwrap())
            .collect();
        assert!(listed_paths.contains(&".turbo"));
        assert!(listed_paths.contains(&"src"));
        assert_eq!(lines[4]["output"]["matches"][0], "src/main.ts");
        assert_eq!(lines[5]["kind"], "shutdown.accepted");
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn rejects_oversized_frames_before_parsing() {
        let mut input = vec![b'a'; MAX_FRAME_BYTES + 1];
        input.push(b'\n');
        let error = read_frame(&mut BufReader::new(Cursor::new(input))).expect_err("oversized");
        assert_eq!(error.kind(), io::ErrorKind::InvalidData);
    }

    #[cfg(unix)]
    #[test]
    fn rejects_a_symlink_that_escapes_the_workspace() {
        use std::os::unix::fs::symlink;

        let root = fixture_root();
        let outside = root.with_extension("outside");
        fs::write(&outside, "secret\n").unwrap();
        symlink(&outside, root.join("escape.md")).unwrap();
        let input = format!(
            "{{\"protocolVersion\":4,\"kind\":\"handshake.request\",\"nonce\":\"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\",\"workspaceRoot\":{},\"processProfiles\":[],\"workspaceMutationEnabled\":false,\"gitProfile\":null}}\n{{\"protocolVersion\":4,\"kind\":\"workspace.read\",\"requestId\":\"read-escape\",\"path\":\"escape.md\",\"startLine\":1,\"maxLines\":5}}\n{{\"protocolVersion\":4,\"kind\":\"shutdown\"}}\n",
            serde_json::to_string(root.to_str().unwrap()).unwrap()
        );
        let mut output = Vec::new();
        run(&mut BufReader::new(Cursor::new(input)), &mut output).expect("valid protocol");
        let lines: Vec<Value> = output
            .split(|byte| *byte == b'\n')
            .filter(|line| !line.is_empty())
            .map(|line| serde_json::from_slice(line).expect("valid response"))
            .collect();
        assert_eq!(lines[1]["kind"], "workspace.read.failed");
        assert_eq!(lines[1]["errorCode"], "WORKSPACE_PATH_OUTSIDE_ROOT");
        fs::remove_dir_all(root).unwrap();
        fs::remove_file(outside).unwrap();
    }
}
