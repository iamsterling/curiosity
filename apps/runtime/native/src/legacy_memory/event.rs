use super::{
    diagnostic::{Code, Failure, fail},
    json::Json,
};

const KEYS: &[&str] = &[
    "schemaVersion",
    "id",
    "sequence",
    "aggregate",
    "type",
    "at",
    "actor",
    "data",
    "previousDigest",
    "digest",
];

pub(crate) fn decode_ledger_event(value: &Json) -> Result<Json, Failure> {
    let entries = value
        .object()
        .ok_or_else(|| fail(Code::LedgerSchemaInvalid, None))?;
    if value.get("schemaVersion").and_then(Json::number) != Some(1.0) {
        return Err(fail(Code::LedgerVersionUnsupported, None));
    }
    if entries
        .iter()
        .any(|(key, _)| !KEYS.contains(&key.to_string_lossy().as_str()))
    {
        return Err(fail(Code::LedgerSchemaInvalid, None));
    }
    let actor = value
        .get("actor")
        .and_then(Json::object)
        .ok_or_else(|| fail(Code::LedgerSchemaInvalid, None))?;
    if actor.iter().any(|(key, _)| {
        !["kind", "sessionID", "correlationID"].contains(&key.to_string_lossy().as_str())
    }) {
        return Err(fail(Code::LedgerSchemaInvalid, None));
    }
    if value.get("id").and_then(Json::string).is_none()
        || value.get("sequence").and_then(Json::number).is_none()
        || value.get("aggregate").and_then(Json::string).is_none()
        || value.get("type").and_then(Json::string).is_none()
        || value.get("at").and_then(Json::string).is_none()
    {
        return Err(fail(Code::LedgerSchemaInvalid, None));
    }
    Ok(value.clone())
}
