use super::{
    canonical::{canonical_json, sha256_text},
    diagnostic::{Code, Failure, fail},
    entity::decode_ledger_entity,
    json::{JsString, Json},
};

#[derive(Clone, Debug)]
pub(crate) struct Replay {
    pub(crate) digest: String,
    pub(crate) events: Vec<Json>,
    pub(crate) entities: Vec<(String, Json)>,
}

#[derive(Clone, Debug)]
pub(crate) struct View {
    pub(crate) intents: Vec<(String, Json)>,
    pub(crate) work: Vec<(String, Json)>,
    pub(crate) claims: Vec<(String, Json)>,
    pub(crate) evidence: Vec<Json>,
    pub(crate) approvals: Vec<(String, Json)>,
    pub(crate) resolutions: Vec<(String, Json)>,
    pub(crate) facts: Vec<(String, Json)>,
    pub(crate) capture_gaps: Vec<(String, Json)>,
    pub(crate) sequence: f64,
    pub(crate) digest: String,
}
impl View {
    pub(crate) fn empty() -> Self {
        Self {
            intents: vec![],
            work: vec![],
            claims: vec![],
            evidence: vec![],
            approvals: vec![],
            resolutions: vec![],
            facts: vec![],
            capture_gaps: vec![],
            sequence: 0.0,
            digest: "GENESIS".into(),
        }
    }
}

pub(crate) fn replay(inputs: &[Json]) -> Result<Replay, Failure> {
    let mut digest = "GENESIS".to_owned();
    let mut events = Vec::new();
    let mut entities = Vec::new();
    for (index, input) in inputs.iter().enumerate() {
        if input.get("schemaVersion").and_then(Json::number) != Some(1.0) {
            return Err(fail(
                Code::LedgerVersionUnsupported,
                Some(format!("events[{index}].schemaVersion")),
            ));
        }
        if input.get("sequence").and_then(Json::number) != Some((index + 1) as f64) {
            return Err(fail(
                Code::LedgerReplayInvalid,
                Some(format!("events[{index}].sequence")),
            ));
        }
        if input
            .get("previousDigest")
            .and_then(Json::string)
            .as_deref()
            != Some(&digest)
        {
            return Err(fail(
                Code::LedgerReplayInvalid,
                Some(format!("events[{index}].previousDigest")),
            ));
        }
        let base = set_field(input, "digest", Json::Undefined);
        let computed = sha256_text(canonical_json(&base)?.as_bytes());
        if input.get("digest").is_some()
            && input.get("digest").and_then(Json::string).as_deref() != Some(&computed)
        {
            return Err(fail(
                Code::LedgerReplayInvalid,
                Some(format!("events[{index}].digest")),
            ));
        }
        let event = set_field(input, "digest", Json::String(JsString::from_str(&computed)));
        digest = computed;
        let data = event
            .get("data")
            .filter(|value| !matches!(value, Json::Null | Json::Undefined))
            .ok_or_else(|| fail(Code::ParityInternalFailure, None))?;
        if truthy(data.get("entityType")) && truthy(data.get("id")) {
            let entity = decode_ledger_entity(data, &format!("events[{index}].data"))?;
            let key = format!(
                "{}:{}",
                entity
                    .get("entityType")
                    .and_then(Json::string)
                    .unwrap_or_default(),
                entity.get("id").and_then(Json::string).unwrap_or_default()
            );
            map_set(&mut entities, key, entity);
        }
        events.push(event);
    }
    entities.sort_by(|a, b| a.0.cmp(&b.0));
    Ok(Replay {
        digest,
        events,
        entities,
    })
}

pub(crate) fn reduce(events: &[Json]) -> View {
    let mut view = View::empty();
    for event in events {
        let Some(kind) = event.get("type").and_then(Json::string) else {
            continue;
        };
        let data = event.get("data").cloned().unwrap_or(Json::Object(vec![]));
        match kind.as_str() {
            "intent.captured" => {
                let key = text(&data, "id");
                let mut value = data.clone();
                set_mut(
                    &mut value,
                    "lifecycle",
                    Json::String(JsString::from_str("captured")),
                );
                set_mut(&mut value, "criteria", Json::Array(vec![]));
                map_set(&mut view.intents, key, value);
            }
            "intent.framed" => {
                if let Some(value) = map_get_mut(&mut view.intents, &text(&data, "intentID")) {
                    set_mut(
                        value,
                        "criteria",
                        data.get("criteria").cloned().unwrap_or(Json::Undefined),
                    );
                    set_mut(
                        value,
                        "lifecycle",
                        Json::String(JsString::from_str("framed")),
                    );
                }
            }
            "intent.activated" => lifecycle(&mut view.intents, &data, "active"),
            "intent.reconciled" => lifecycle(&mut view.intents, &data, "reconciled"),
            "intent.archived" => lifecycle(&mut view.intents, &data, "archived"),
            "work.proposed" => map_set(&mut view.work, text(&data, "id"), data.clone()),
            "claim.acquired" => {
                let mut value = data.clone();
                set_mut(&mut value, "released", Json::Bool(false));
                map_set(&mut view.claims, text(&data, "workID"), value);
            }
            "claim.released" => {
                if let Some(value) = map_get_mut(&mut view.claims, &text(&data, "workID")) {
                    set_mut(value, "released", Json::Bool(true));
                    let at = data
                        .get("releasedAt")
                        .cloned()
                        .unwrap_or_else(|| event.get("at").cloned().unwrap_or(Json::Undefined));
                    set_mut(value, "releasedAt", at);
                }
            }
            "evidence.submitted" => view.evidence.push(data.clone()),
            "fact.recorded" => map_set(&mut view.facts, text(&data, "id"), data.clone()),
            "capture-gap.recorded" => {
                map_set(&mut view.capture_gaps, text(&data, "id"), data.clone())
            }
            "capture-gap.resolved" => {
                if let Some(value) = map_get_mut(&mut view.capture_gaps, &text(&data, "id")) {
                    set_mut(
                        value,
                        "status",
                        Json::String(JsString::from_str("resolved")),
                    );
                }
            }
            "approval.requested" => {
                let mut value = data.clone();
                set_mut(&mut value, "confirmed", Json::Bool(false));
                map_set(&mut view.approvals, text(&data, "id"), value);
            }
            "approval.confirmed" => {
                if let Some(value) = map_get_mut(&mut view.approvals, &text(&data, "id")) {
                    set_mut(value, "confirmed", Json::Bool(true));
                }
            }
            "resolution.proposed" => {
                let mut value = data.clone();
                set_mut(
                    &mut value,
                    "actor",
                    event.get("actor").cloned().unwrap_or(Json::Undefined),
                );
                map_set(&mut view.resolutions, text(&data, "intentID"), value);
            }
            _ => {}
        }
        view.sequence = event
            .get("sequence")
            .and_then(Json::number)
            .unwrap_or(view.sequence);
        view.digest = event
            .get("digest")
            .and_then(Json::string)
            .unwrap_or_else(|| view.digest.clone());
    }
    for map in [
        &mut view.intents,
        &mut view.work,
        &mut view.claims,
        &mut view.approvals,
        &mut view.resolutions,
        &mut view.facts,
        &mut view.capture_gaps,
    ] {
        map.sort_by(|a, b| a.0.cmp(&b.0));
    }
    view
}

fn lifecycle(map: &mut [(String, Json)], data: &Json, state: &str) {
    if let Some(value) = map_get_mut(map, &text(data, "intentID")) {
        set_mut(value, "lifecycle", Json::String(JsString::from_str(state)));
    }
}
fn text(value: &Json, key: &str) -> String {
    value
        .get(key)
        .and_then(Json::string)
        .unwrap_or_else(|| match value.get(key) {
            Some(Json::Number(n)) => format!("{n}"),
            Some(Json::Null) => "null".into(),
            Some(Json::Undefined) | None => "undefined".into(),
            _ => "[object Object]".into(),
        })
}
fn truthy(value: Option<&Json>) -> bool {
    !matches!(
        value,
        None | Some(Json::Null | Json::Bool(false) | Json::Undefined)
    ) && !matches!(value,Some(Json::String(s))if s.0.is_empty())
        && !matches!(value,Some(Json::Number(n))if *n==0.0||n.is_nan())
}
fn map_set(map: &mut Vec<(String, Json)>, key: String, value: Json) {
    if let Some(item) = map.iter_mut().find(|(name, _)| name == &key) {
        item.1 = value
    } else {
        map.push((key, value))
    }
}
fn map_get_mut<'a>(map: &'a mut [(String, Json)], key: &str) -> Option<&'a mut Json> {
    map.iter_mut()
        .find(|(name, _)| name == key)
        .map(|(_, value)| value)
}
pub(crate) fn set_field(value: &Json, key: &str, new: Json) -> Json {
    let mut value = value.clone();
    set_mut(&mut value, key, new);
    value
}
fn set_mut(value: &mut Json, key: &str, new: Json) {
    if let Json::Object(entries) = value {
        if let Some((_, value)) = entries
            .iter_mut()
            .find(|(name, _)| name.0 == key.encode_utf16().collect::<Vec<_>>())
        {
            *value = new
        } else {
            entries.push((JsString::from_str(key), new))
        }
    }
}
