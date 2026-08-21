use super::{
    canonical::{canonical_json, sha256_text, stringify, write_string},
    diagnostic::{Code, Failure, fail},
    entity::decode_ledger_entity,
    event::decode_ledger_event,
    inspector::{CaptureInspection, LedgerInspection, inspect_capture, inspect_ledger},
    json::{JsString, Json},
    replay::{Replay, View, replay},
};

const INPUT_LIMIT: usize = 1_048_576;
const OUTPUT_LIMIT: usize = 4_194_304;

#[derive(Debug, Eq, PartialEq)]
pub(crate) struct DispatchOutcome {
    pub(crate) bytes: Vec<u8>,
    pub(crate) internal_failure: bool,
}

#[allow(dead_code)]
pub(crate) fn internal_failure_bytes() -> DispatchOutcome {
    DispatchOutcome {
        bytes: format!(
            "{}\n",
            error(None, &adapter_fail("PARITY_INTERNAL_FAILURE", None))
        )
        .into_bytes(),
        internal_failure: true,
    }
}

pub(crate) fn dispatch_bytes(bytes: &[u8]) -> DispatchOutcome {
    let mut request_id = None;
    let (response, internal_failure) = match handle_bytes(bytes, &mut request_id) {
        Ok(value) => (value, false),
        Err(failure) => {
            let internal = failure.code_text == "PARITY_INTERNAL_FAILURE";
            (error(request_id.as_deref(), &failure), internal)
        }
    };
    let output = if response.len() + 1 > OUTPUT_LIMIT {
        error(
            request_id.as_deref(),
            &adapter_fail("PARITY_OUTPUT_TOO_LARGE", None),
        )
    } else {
        response
    };
    DispatchOutcome {
        bytes: format!("{output}\n").into_bytes(),
        internal_failure,
    }
}

struct AdapterFailure {
    code_text: &'static str,
    path: Option<String>,
}
trait Diagnostic {
    fn code(&self) -> &str;
    fn path(&self) -> Option<&str>;
}
impl Diagnostic for super::diagnostic::Failure {
    fn code(&self) -> &str {
        self.code.text()
    }
    fn path(&self) -> Option<&str> {
        self.path.as_deref()
    }
}
impl Diagnostic for AdapterFailure {
    fn code(&self) -> &str {
        self.code_text
    }
    fn path(&self) -> Option<&str> {
        self.path.as_deref()
    }
}
fn error(id: Option<&str>, failure: &impl Diagnostic) -> String {
    format!(
        "{{\"protocolVersion\":1,\"requestId\":{},\"status\":\"error\",\"diagnostic\":{{\"code\":\"{}\",\"path\":{}}}}}",
        id.unwrap_or("null"),
        failure.code(),
        failure.path().map(quoted).unwrap_or_else(|| "null".into())
    )
}
fn quoted(value: &str) -> String {
    let mut out = String::new();
    write_string(&JsString::from_str(value), &mut out);
    out
}
fn adapter_fail(code: &'static str, path: Option<&str>) -> AdapterFailure {
    AdapterFailure {
        code_text: code,
        path: path.map(str::to_owned),
    }
}

fn handle_bytes(bytes: &[u8], request_id: &mut Option<String>) -> Result<String, AdapterFailure> {
    if bytes.len() > INPUT_LIMIT {
        return Err(adapter_fail("PARITY_INPUT_TOO_LARGE", None));
    }
    if bytes.contains(&0)
        || bytes.contains(&b'\r')
        || !bytes.ends_with(b"\n")
        || bytes[..bytes.len() - 1].contains(&b'\n')
    {
        return Err(adapter_fail("PARITY_FRAME_INVALID", None));
    }
    let line = std::str::from_utf8(&bytes[..bytes.len() - 1])
        .map_err(|_| adapter_fail("PARITY_UTF8_INVALID", None))?;
    if line.is_empty() {
        return Err(adapter_fail("PARITY_FRAME_INVALID", None));
    }
    let request =
        Json::parse(line.as_bytes()).map_err(|_| adapter_fail("PARITY_JSON_INVALID", None))?;
    *request_id = request
        .get("requestId")
        .and_then(|value| stringify(value).ok());
    let entries = request
        .object()
        .ok_or_else(|| adapter_fail("PARITY_PROTOCOL_SCHEMA_INVALID", Some("/protocolVersion")))?;
    let expected = ["protocolVersion", "requestId", "operation", "input"];
    for (index, name) in expected.iter().enumerate() {
        if !entries
            .iter()
            .any(|(actual, _)| actual.to_string_lossy() == *name)
        {
            return Err(adapter_fail(
                "PARITY_PROTOCOL_SCHEMA_INVALID",
                Some(&format!("/{name}")),
            ));
        }
        let Some((actual, value)) = entries.get(index) else {
            return Err(adapter_fail(
                "PARITY_PROTOCOL_SCHEMA_INVALID",
                Some(&format!("/{name}")),
            ));
        };
        if actual.to_string_lossy() != *name {
            return Err(adapter_fail(
                "PARITY_PROTOCOL_SCHEMA_INVALID",
                Some(&format!("/{}", actual.to_string_lossy())),
            ));
        }
        let right = match *name {
            "protocolVersion" => matches!(value,Json::Number(n)if n.fract()==0.0),
            "requestId" | "operation" => matches!(value, Json::String(_)),
            "input" => matches!(value, Json::Object(_)),
            _ => false,
        };
        if !right {
            return Err(adapter_fail(
                "PARITY_PROTOCOL_SCHEMA_INVALID",
                Some(&format!("/{name}")),
            ));
        }
    }
    if entries.len() != 4 {
        return Err(adapter_fail(
            "PARITY_PROTOCOL_SCHEMA_INVALID",
            Some(&format!("/{}", entries[4].0.to_string_lossy())),
        ));
    }
    if request.get("protocolVersion").and_then(Json::number) != Some(1.0) {
        return Err(adapter_fail(
            "PARITY_PROTOCOL_VERSION_UNSUPPORTED",
            Some("/protocolVersion"),
        ));
    }
    let id = request.get("requestId").and_then(Json::string).unwrap();
    if id.is_empty()
        || id.len() > 64
        || !id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(&b))
    {
        return Err(adapter_fail(
            "PARITY_REQUEST_ID_INVALID",
            Some("/requestId"),
        ));
    }
    *request_id = Some(quoted(&id));
    let operation = request.get("operation").and_then(Json::string).unwrap();
    if ![
        "canonicalize",
        "digest",
        "decodeLedgerEntity",
        "decodeLedgerEvent",
        "replayLedgerEvents",
        "inspectLedger",
        "inspectEventCapture",
    ]
    .contains(&operation.as_str())
    {
        return Err(adapter_fail("PARITY_OPERATION_UNSUPPORTED", None));
    }
    let input = request.get("input").unwrap();
    let result = dispatch(&operation, input).map_err(|failure| AdapterFailure {
        code_text: failure.code.text(),
        path: failure.path,
    })?;
    Ok(format!(
        "{{\"protocolVersion\":1,\"requestId\":{},\"status\":\"ok\",\"result\":{result}}}",
        quoted(&id)
    ))
}

fn dispatch(operation: &str, input: &Json) -> Result<String, Failure> {
    match operation {
        "canonicalize" | "digest" => {
            exact(input, &["value"])?;
            let value = realize(
                input.get("value").unwrap(),
                "/input/value",
                0,
                &mut 0,
                false,
            )?;
            let canonical = canonical_json(&value).map_err(|failure| {
                if matches!(value, Json::Undefined | Json::Function | Json::Symbol) {
                    fail(
                        if operation == "digest" {
                            Code::ParityCanonicalDigestFailed
                        } else {
                            Code::ParityCanonicalResultUndefined
                        },
                        Some("/input/value".into()),
                    )
                } else {
                    fail(failure.code, Some("/input/value".into()))
                }
            })?;
            let bytes = canonical.as_bytes();
            let base = format!(
                "\"bytesBase64\":\"{}\",\"byteLength\":{}",
                base64(bytes),
                bytes.len()
            );
            if operation == "digest" {
                Ok(format!("{{{base},\"digest\":\"{}\"}}", sha256_text(bytes)))
            } else {
                Ok(format!("{{{base}}}"))
            }
        }
        "decodeLedgerEntity" => {
            exact(input, &["value"])?;
            let value = decode_ledger_entity(input.get("value").unwrap(), "entity")?;
            Ok(format!("{{\"value\":{}}}", stringify(&value)?))
        }
        "decodeLedgerEvent" => {
            exact(input, &["value"])?;
            let value = decode_ledger_event(input.get("value").unwrap())?;
            Ok(format!("{{\"value\":{}}}", stringify(&value)?))
        }
        "replayLedgerEvents" => {
            exact(input, &["events"])?;
            let Json::Array(events) = input.get("events").unwrap() else {
                return Err(fail(
                    Code::ParityInputSchemaInvalid,
                    Some("/input/events".into()),
                ));
            };
            if events.len() > 4096 {
                return Err(fail(
                    Code::ParityLimitExceeded,
                    Some("/input/events".into()),
                ));
            }
            replay_result(&replay(events)?)
        }
        "inspectLedger" => {
            let root = inspector_root(input)?;
            ledger_result(inspect_ledger(&root)?)
        }
        "inspectEventCapture" => {
            let root = inspector_root(input)?;
            capture_result(inspect_capture(&root)?)
        }
        _ => unreachable!(),
    }
}
fn exact(value: &Json, keys: &[&str]) -> Result<(), Failure> {
    let Some(entries) = value.object() else {
        return Err(fail(Code::ParityInputSchemaInvalid, Some("/input".into())));
    };
    for (index, key) in keys.iter().enumerate() {
        if !entries
            .iter()
            .any(|(actual, _)| actual.to_string_lossy() == *key)
        {
            return Err(fail(
                Code::ParityInputSchemaInvalid,
                Some(format!("/input/{key}")),
            ));
        }
        let Some((actual, _)) = entries.get(index) else {
            return Err(fail(
                Code::ParityInputSchemaInvalid,
                Some(format!("/input/{key}")),
            ));
        };
        if actual.to_string_lossy() != *key {
            return Err(fail(
                Code::ParityInputSchemaInvalid,
                Some(format!("/input/{}", actual.to_string_lossy())),
            ));
        }
    }
    if entries.len() != keys.len() {
        return Err(fail(
            Code::ParityInputSchemaInvalid,
            Some(format!(
                "/input/{}",
                entries[keys.len()].0.to_string_lossy()
            )),
        ));
    }
    Ok(())
}
fn inspector_root(input: &Json) -> Result<String, Failure> {
    exact(input, &["root"])?;
    input
        .get("root")
        .and_then(Json::string)
        .ok_or_else(|| fail(Code::ParityInputSchemaInvalid, Some("/input/root".into())))
}

fn realize(
    tag: &Json,
    path: &str,
    depth: usize,
    nodes: &mut usize,
    allow_hole: bool,
) -> Result<Json, Failure> {
    if depth > 64 {
        return Err(fail(Code::ParityLimitExceeded, Some(path.into())));
    }
    *nodes += 1;
    if *nodes > 65536 {
        return Err(fail(Code::ParityLimitExceeded, Some(path.into())));
    }
    let entries = tag
        .object()
        .ok_or_else(|| fail(Code::ParityInputSchemaInvalid, Some(path.into())))?;
    exact_at(entries, &["kind"], path, true)?;
    let kind = tag
        .get("kind")
        .and_then(Json::string)
        .ok_or_else(|| fail(Code::ParityInputSchemaInvalid, Some(format!("{path}/kind"))))?;
    let expected: &[&str] = match kind.as_str() {
        "json" => &["kind", "value"],
        "undefined" | "function" | "symbol" => &["kind"],
        "bigint" => &["kind", "decimal"],
        "f64" => &["kind", "bits"],
        "array" => &["kind", "items"],
        "object" => &["kind", "entries"],
        "objectWithSymbolKey" => &["kind", "entries", "symbolValue"],
        "cycle" => &["kind", "shape"],
        "hole" => &["kind"],
        _ => {
            return Err(fail(
                Code::ParityInputSchemaInvalid,
                Some(format!("{path}/kind")),
            ));
        }
    };
    exact_at(entries, expected, path, false)?;
    match kind.as_str() {
        "json" => {
            let value = tag.get("value").unwrap();
            validate_json(value, &format!("{path}/value"), depth + 1, nodes)?;
            Ok(value.clone())
        }
        "undefined" => Ok(Json::Undefined),
        "function" => Ok(Json::Function),
        "symbol" => Ok(Json::Symbol),
        "hole" if allow_hole => Ok(Json::Hole),
        "hole" => Err(fail(
            Code::ParityInputSchemaInvalid,
            Some(format!("{path}/kind")),
        )),
        "bigint" => {
            let value = tag.get("decimal").and_then(Json::string).ok_or_else(|| {
                fail(
                    Code::ParityInputSchemaInvalid,
                    Some(format!("{path}/decimal")),
                )
            })?;
            if !valid_decimal(&value) {
                return Err(fail(
                    Code::ParityInputSchemaInvalid,
                    Some(format!("{path}/decimal")),
                ));
            }
            Ok(Json::BigInt)
        }
        "f64" => {
            let bits = tag.get("bits").and_then(Json::string).ok_or_else(|| {
                fail(Code::ParityInputSchemaInvalid, Some(format!("{path}/bits")))
            })?;
            if bits.len() != 16
                || !bits
                    .bytes()
                    .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
            {
                return Err(fail(
                    Code::ParityInputSchemaInvalid,
                    Some(format!("{path}/bits")),
                ));
            }
            Ok(Json::Number(f64::from_bits(
                u64::from_str_radix(&bits, 16).unwrap(),
            )))
        }
        "array" => {
            let Json::Array(items) = tag.get("items").unwrap() else {
                return Err(fail(
                    Code::ParityInputSchemaInvalid,
                    Some(format!("{path}/items")),
                ));
            };
            if items.len() > 8192 {
                return Err(fail(
                    Code::ParityLimitExceeded,
                    Some(format!("{path}/items")),
                ));
            }
            let mut out = Vec::new();
            for (index, item) in items.iter().enumerate() {
                out.push(realize(
                    item,
                    &format!("{path}/items/{index}"),
                    depth + 1,
                    nodes,
                    true,
                )?)
            }
            Ok(Json::Array(out))
        }
        "object" | "objectWithSymbolKey" => {
            let Json::Array(items) = tag.get("entries").unwrap() else {
                return Err(fail(
                    Code::ParityInputSchemaInvalid,
                    Some(format!("{path}/entries")),
                ));
            };
            if items.len() > 8192 {
                return Err(fail(
                    Code::ParityLimitExceeded,
                    Some(format!("{path}/entries")),
                ));
            }
            let mut out = Vec::new();
            for (index, item) in items.iter().enumerate() {
                let item_path = format!("{path}/entries/{index}");
                let pair = item
                    .object()
                    .ok_or_else(|| fail(Code::ParityInputSchemaInvalid, Some(item_path.clone())))?;
                exact_at(pair, &["key", "value"], &item_path, false)?;
                let key = item
                    .get("key")
                    .and_then(|v| match v {
                        Json::String(s) => Some(s.clone()),
                        _ => None,
                    })
                    .ok_or_else(|| {
                        fail(
                            Code::ParityInputSchemaInvalid,
                            Some(format!("{item_path}/key")),
                        )
                    })?;
                if key.utf8_len() > 65536 {
                    return Err(fail(
                        Code::ParityLimitExceeded,
                        Some(format!("{item_path}/key")),
                    ));
                }
                if out.iter().any(|(name, _)| name == &key) {
                    return Err(fail(
                        Code::ParityInputSchemaInvalid,
                        Some(format!("{item_path}/key")),
                    ));
                }
                out.push((
                    key,
                    realize(
                        item.get("value").unwrap(),
                        &format!("{item_path}/value"),
                        depth + 1,
                        nodes,
                        false,
                    )?,
                ))
            }
            if kind == "objectWithSymbolKey" {
                let _ = realize(
                    tag.get("symbolValue").unwrap(),
                    &format!("{path}/symbolValue"),
                    depth + 1,
                    nodes,
                    false,
                )?;
            }
            Ok(Json::Object(out))
        }
        "cycle" => {
            let shape = tag.get("shape").and_then(Json::string);
            if !matches!(shape.as_deref(), Some("direct" | "indirect")) {
                return Err(fail(
                    Code::ParityInputSchemaInvalid,
                    Some(format!("{path}/shape")),
                ));
            }
            Ok(Json::Cycle)
        }
        _ => unreachable!(),
    }
}
fn exact_at(
    entries: &[(JsString, Json)],
    expected: &[&str],
    path: &str,
    allow_remaining: bool,
) -> Result<(), Failure> {
    for (index, name) in expected.iter().enumerate() {
        if !entries
            .iter()
            .any(|(actual, _)| actual.to_string_lossy() == *name)
        {
            return Err(fail(
                Code::ParityInputSchemaInvalid,
                Some(format!("{path}/{name}")),
            ));
        }
        let Some((actual, _)) = entries.get(index) else {
            return Err(fail(
                Code::ParityInputSchemaInvalid,
                Some(format!("{path}/{name}")),
            ));
        };
        if actual.to_string_lossy() != *name {
            return Err(fail(
                Code::ParityInputSchemaInvalid,
                Some(format!("{path}/{}", actual.to_string_lossy())),
            ));
        }
    }
    if !allow_remaining && entries.len() > expected.len() {
        return Err(fail(
            Code::ParityInputSchemaInvalid,
            Some(format!(
                "{path}/{}",
                entries[expected.len()].0.to_string_lossy()
            )),
        ));
    }
    Ok(())
}
fn validate_json(value: &Json, path: &str, depth: usize, nodes: &mut usize) -> Result<(), Failure> {
    if depth > 64 {
        return Err(fail(Code::ParityLimitExceeded, Some(path.into())));
    }
    *nodes += 1;
    if *nodes > 65536 {
        return Err(fail(Code::ParityLimitExceeded, Some(path.into())));
    }
    match value {
        Json::String(value) if value.utf8_len() > 65536 => {
            Err(fail(Code::ParityLimitExceeded, Some(path.into())))
        }
        Json::Array(items) => {
            if items.len() > 8192 {
                return Err(fail(Code::ParityLimitExceeded, Some(path.into())));
            }
            for (index, item) in items.iter().enumerate() {
                validate_json(item, &format!("{path}/{index}"), depth + 1, nodes)?;
            }
            Ok(())
        }
        Json::Object(entries) => {
            if entries.len() > 8192 {
                return Err(fail(Code::ParityLimitExceeded, Some(path.into())));
            }
            for (key, item) in entries {
                if key.utf8_len() > 65536 {
                    return Err(fail(Code::ParityLimitExceeded, Some(path.into())));
                }
                validate_json(item, path, depth + 1, nodes)?;
            }
            Ok(())
        }
        _ => Ok(()),
    }
}
fn valid_decimal(value: &str) -> bool {
    let digits = value.strip_prefix('-').unwrap_or(value);
    !digits.is_empty()
        && digits.bytes().all(|b| b.is_ascii_digit())
        && (digits == "0" || !digits.starts_with('0'))
}
fn base64(bytes: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::new();
    for chunk in bytes.chunks(3) {
        let n = (u32::from(chunk[0]) << 16)
            | (u32::from(*chunk.get(1).unwrap_or(&0)) << 8)
            | u32::from(*chunk.get(2).unwrap_or(&0));
        out.push(TABLE[((n >> 18) & 63) as usize] as char);
        out.push(TABLE[((n >> 12) & 63) as usize] as char);
        out.push(if chunk.len() > 1 {
            TABLE[((n >> 6) & 63) as usize] as char
        } else {
            '='
        });
        out.push(if chunk.len() > 2 {
            TABLE[(n & 63) as usize] as char
        } else {
            '='
        })
    }
    out
}

fn replay_result(value: &Replay) -> Result<String, Failure> {
    let events = value
        .events
        .iter()
        .map(stringify)
        .collect::<Result<Vec<_>, _>>()?
        .join(",");
    let entities = value
        .entities
        .iter()
        .map(|(key, value)| {
            Ok(format!(
                "{{\"key\":{},\"value\":{}}}",
                quoted(key),
                stringify(value)?
            ))
        })
        .collect::<Result<Vec<_>, Failure>>()?
        .join(",");
    Ok(format!(
        "{{\"digest\":\"{}\",\"events\":[{events}],\"entities\":[{entities}]}}",
        value.digest
    ))
}
fn inventory(items: &[super::inspector::Inventory]) -> String {
    items
        .iter()
        .map(|item| {
            format!(
                "{{\"path\":{},\"size\":{},\"sha256\":\"{}\"}}",
                quoted(&item.path),
                item.size,
                item.digest
            )
        })
        .collect::<Vec<_>>()
        .join(",")
}
fn map(items: &[(String, Json)]) -> Result<String, Failure> {
    Ok(items
        .iter()
        .map(|(key, value)| {
            Ok(format!(
                "{{\"key\":{},\"value\":{}}}",
                quoted(key),
                stringify(value)?
            ))
        })
        .collect::<Result<Vec<_>, Failure>>()?
        .join(","))
}
fn view(value: &View) -> Result<String, Failure> {
    Ok(format!(
        "{{\"intents\":[{}],\"work\":[{}],\"claims\":[{}],\"evidence\":[{}],\"approvals\":[{}],\"resolutions\":[{}],\"facts\":[{}],\"captureGaps\":[{}]}}",
        map(&value.intents)?,
        map(&value.work)?,
        map(&value.claims)?,
        value
            .evidence
            .iter()
            .map(stringify)
            .collect::<Result<Vec<_>, _>>()?
            .join(","),
        map(&value.approvals)?,
        map(&value.resolutions)?,
        map(&value.facts)?,
        map(&value.capture_gaps)?
    ))
}
fn ledger_result(value: LedgerInspection) -> Result<String, Failure> {
    Ok(format!(
        "{{\"kind\":\"ledger-v1\",\"schemaVersion\":1,\"inventory\":[{}],\"sequence\":{},\"digest\":\"{}\",\"view\":{}}}",
        inventory(&value.inventory),
        super::canonical::js_number(value.view.sequence),
        value.view.digest,
        view(&value.view)?
    ))
}
fn capture_result(value: CaptureInspection) -> Result<String, Failure> {
    Ok(format!(
        "{{\"kind\":\"event-capture-v1\",\"inventory\":[{}],\"events\":[{}],\"gaps\":{}}}",
        inventory(&value.inventory),
        value
            .events
            .iter()
            .map(stringify)
            .collect::<Result<Vec<_>, _>>()?
            .join(","),
        stringify(&value.gaps)?
    ))
}

#[cfg(test)]
mod adapter_protocol_tests {
    use super::*;

    #[test]
    fn reports_exact_first_protocol_and_tag_pointer() {
        for (raw, code, path, vector, field) in [
            (
                "{}\n",
                "PARITY_PROTOCOL_SCHEMA_INVALID",
                "/protocolVersion",
                "protocol-missing-version",
                "diagnostic.path",
            ),
            (
                "{\"requestId\":\"r\",\"protocolVersion\":1,\"operation\":\"canonicalize\",\"input\":{}}\n",
                "PARITY_PROTOCOL_SCHEMA_INVALID",
                "/requestId",
                "protocol-wrong-order",
                "diagnostic.path",
            ),
            (
                "{\"extra\":1,\"protocolVersion\":1,\"requestId\":\"r\",\"operation\":\"canonicalize\",\"input\":{}}\n",
                "PARITY_PROTOCOL_SCHEMA_INVALID",
                "/extra",
                "protocol-extra-first",
                "diagnostic.path",
            ),
            (
                "{\"protocolVersion\":1,\"requestId\":\"r\",\"operation\":\"canonicalize\",\"input\":{}}\n",
                "PARITY_INPUT_SCHEMA_INVALID",
                "/input/value",
                "input-missing-value",
                "diagnostic.path",
            ),
            (
                "{\"protocolVersion\":1,\"requestId\":\"r\",\"operation\":\"canonicalize\",\"input\":{\"value\":{\"bits\":\"0000000000000000\",\"kind\":\"f64\"}}}\n",
                "PARITY_INPUT_SCHEMA_INVALID",
                "/input/value/bits",
                "tag-f64-wrong-order",
                "diagnostic.path",
            ),
            (
                "{\"protocolVersion\":1,\"requestId\":\"r\",\"operation\":\"canonicalize\",\"input\":{\"value\":{\"kind\":\"f64\"}}}\n",
                "PARITY_INPUT_SCHEMA_INVALID",
                "/input/value/bits",
                "tag-f64-missing-bits",
                "diagnostic.path",
            ),
            (
                "{\"protocolVersion\":1,\"requestId\":\"r\",\"operation\":\"canonicalize\",\"input\":{\"value\":{\"kind\":\"hole\"}}}\n",
                "PARITY_INPUT_SCHEMA_INVALID",
                "/input/value/kind",
                "tag-hole-outside",
                "diagnostic.code",
            ),
        ] {
            let observed = handle_bytes(raw.as_bytes(), &mut None);
            assert!(observed.is_err(), "{vector}|{field}");
            let failure = observed.unwrap_err();
            assert_eq!(failure.code_text, code, "{vector}|{field}");
            assert_eq!(failure.path.as_deref(), Some(path), "{vector}|{field}");
        }
    }
}
