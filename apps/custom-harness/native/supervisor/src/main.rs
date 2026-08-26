use serde_json::{Value, json};
use std::fs;
use std::io::{self, BufRead, Write};
use std::path::{Component, Path, PathBuf};

const MAX_FILE_BYTES: u64 = 1024 * 1024;
const MAX_FRAME_BYTES: usize = 64 * 1024;
const MAX_OUTPUT_BYTES: usize = 32 * 1024;
const MAX_SEARCH_ENTRIES: usize = 20_000;
const PROTOCOL_VERSION: u64 = 2;
type WorkspaceOperation = fn(&Path, &serde_json::Map<String, Value>) -> Result<Value, &'static str>;

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
        exact_request(&request, "handshake.request", 4).ok_or("SUPERVISOR_HANDSHAKE_INVALID")?;
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
    write_frame(
        writer,
        &json!({
            "protocolVersion": PROTOCOL_VERSION,
            "kind": "handshake.accepted",
            "nonce": nonce,
            "capabilities": {
                "filesystemMutation": false,
                "filesystemRead": true,
                "git": false,
                "process": false,
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
        let (kind, expected_fields, operation): (&str, usize, WorkspaceOperation) =
            if request.get("kind").and_then(Value::as_str) == Some("workspace.read") {
                ("workspace.read", 6, read_workspace)
            } else if request.get("kind").and_then(Value::as_str) == Some("workspace.search") {
                ("workspace.search", 5, search_workspace)
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
    use std::time::{SystemTime, UNIX_EPOCH};

    fn fixture_root() -> PathBuf {
        let root = std::env::temp_dir().join(format!(
            "curiosity-supervisor-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
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
        let input = format!(
            "{{\"protocolVersion\":2,\"kind\":\"handshake.request\",\"nonce\":\"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\",\"workspaceRoot\":{}}}\n{{\"protocolVersion\":2,\"kind\":\"workspace.search\",\"requestId\":\"search-1\",\"query\":\"marker-001\",\"maxResults\":2}}\n{{\"protocolVersion\":2,\"kind\":\"workspace.read\",\"requestId\":\"read-1\",\"path\":\"baseline.md\",\"startLine\":1,\"maxLines\":5}}\n{{\"protocolVersion\":2,\"kind\":\"shutdown\"}}\n",
            serde_json::to_string(root.to_str().unwrap()).unwrap()
        );
        let mut output = Vec::new();
        run(&mut BufReader::new(Cursor::new(input)), &mut output).expect("valid protocol");
        let lines: Vec<Value> = output
            .split(|byte| *byte == b'\n')
            .filter(|line| !line.is_empty())
            .map(|line| serde_json::from_slice(line).expect("valid response"))
            .collect();
        assert_eq!(lines.len(), 4);
        assert_eq!(lines[0]["capabilities"]["filesystemRead"], true);
        assert_eq!(lines[1]["output"]["matches"][0]["path"], "baseline.md");
        assert_eq!(lines[1]["output"]["matches"].as_array().unwrap().len(), 1);
        assert!(
            lines[2]["output"]["content"]
                .as_str()
                .unwrap()
                .contains("marker-001")
        );
        assert_eq!(lines[3]["kind"], "shutdown.accepted");
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
            "{{\"protocolVersion\":2,\"kind\":\"handshake.request\",\"nonce\":\"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\",\"workspaceRoot\":{}}}\n{{\"protocolVersion\":2,\"kind\":\"workspace.read\",\"requestId\":\"read-escape\",\"path\":\"escape.md\",\"startLine\":1,\"maxLines\":5}}\n{{\"protocolVersion\":2,\"kind\":\"shutdown\"}}\n",
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
