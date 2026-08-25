use serde_json::{Value, json};
use std::io::{self, BufRead, Write};

const MAX_FRAME_BYTES: usize = 8 * 1024;
const PROTOCOL_VERSION: u64 = 1;

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

fn handshake_nonce(value: &Value) -> Option<&str> {
    let object = exact_request(value, "handshake.request", 3)?;
    let nonce = object.get("nonce")?.as_str()?;
    if nonce.len() != 64 || !nonce.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return None;
    }
    Some(nonce)
}

fn write_frame<W: Write>(writer: &mut W, value: &Value) -> io::Result<()> {
    serde_json::to_writer(&mut *writer, value)?;
    writer.write_all(b"\n")?;
    writer.flush()
}

fn run<R: BufRead, W: Write>(reader: &mut R, writer: &mut W) -> Result<(), &'static str> {
    let frame = read_frame(reader)
        .map_err(|_| "SUPERVISOR_HANDSHAKE_READ_FAILED")?
        .ok_or("SUPERVISOR_HANDSHAKE_REQUIRED")?;
    let request: Value =
        serde_json::from_slice(&frame).map_err(|_| "SUPERVISOR_HANDSHAKE_INVALID")?;
    let nonce = handshake_nonce(&request).ok_or("SUPERVISOR_HANDSHAKE_INVALID")?;
    write_frame(
        writer,
        &json!({
            "protocolVersion": PROTOCOL_VERSION,
            "kind": "handshake.accepted",
            "nonce": nonce,
            "capabilities": {
                "filesystemMutation": false,
                "git": false,
                "process": false,
                "sandbox": false
            }
        }),
    )
    .map_err(|_| "SUPERVISOR_HANDSHAKE_WRITE_FAILED")?;

    let Some(frame) = read_frame(reader).map_err(|_| "SUPERVISOR_FRAME_READ_FAILED")? else {
        return Ok(());
    };
    let request: Value =
        serde_json::from_slice(&frame).map_err(|_| "SUPERVISOR_REQUEST_INVALID")?;
    if exact_request(&request, "shutdown", 2).is_none() {
        return Err("SUPERVISOR_REQUEST_UNSUPPORTED");
    }
    write_frame(
        writer,
        &json!({
            "protocolVersion": PROTOCOL_VERSION,
            "kind": "shutdown.accepted"
        }),
    )
    .map_err(|_| "SUPERVISOR_SHUTDOWN_WRITE_FAILED")?;
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

    #[test]
    fn accepts_handshake_then_shutdown() {
        let input = br#"{"protocolVersion":1,"kind":"handshake.request","nonce":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"}
{"protocolVersion":1,"kind":"shutdown"}
"#;
        let mut output = Vec::new();
        run(&mut BufReader::new(Cursor::new(input)), &mut output).expect("valid protocol");
        let lines: Vec<Value> = output
            .split(|byte| *byte == b'\n')
            .filter(|line| !line.is_empty())
            .map(|line| serde_json::from_slice(line).expect("valid response"))
            .collect();
        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0]["kind"], "handshake.accepted");
        assert_eq!(lines[1]["kind"], "shutdown.accepted");
    }

    #[test]
    fn rejects_oversized_frames_before_parsing() {
        let mut input = vec![b'a'; MAX_FRAME_BYTES + 1];
        input.push(b'\n');
        let error = read_frame(&mut BufReader::new(Cursor::new(input))).expect_err("oversized");
        assert_eq!(error.kind(), io::ErrorKind::InvalidData);
    }
}
