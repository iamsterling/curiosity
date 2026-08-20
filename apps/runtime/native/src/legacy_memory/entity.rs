use super::{
    diagnostic::{Code, Failure, fail},
    json::Json,
};

const TYPES: &[(&str, &[&str])] = &[
    (
        "intent",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "revision",
            "objective",
            "invariant",
            "scope",
            "nonGoals",
            "rigor",
            "lifecycle",
        ],
    ),
    (
        "capability",
        &["schemaVersion", "entityType", "id", "revision", "scenarios"],
    ),
    (
        "criterion",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "intentID",
            "revision",
            "observable",
            "oracle",
            "requiredEvidence",
            "scenarios",
        ],
    ),
    (
        "scenario",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "capabilityID",
            "revision",
            "parentRevision",
            "strength",
            "destructive",
        ],
    ),
    (
        "work",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "intentID",
            "intentRevision",
            "criterionIDs",
            "writableScope",
            "state",
        ],
    ),
    (
        "dependency",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "fromWorkID",
            "toWorkID",
            "kind",
        ],
    ),
    (
        "claim",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "workID",
            "token",
            "sessionID",
            "rootSessionID",
            "revision",
            "scopeFingerprint",
            "fenceEpoch",
            "acquiredAt",
            "expiresAt",
            "releasedAt",
        ],
    ),
    (
        "evidence",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "kind",
            "intentID",
            "criterionID",
            "criterionRevision",
            "workID",
            "executionID",
            "environmentDigest",
            "inputDigest",
            "outputDigest",
            "status",
            "eventIDs",
            "observedAt",
            "expiresAt",
            "producer",
        ],
    ),
    (
        "fact",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "intentID",
            "statement",
            "provenance",
            "digest",
            "authority",
        ],
    ),
    (
        "resolution",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "intentID",
            "verdict",
            "rationale",
            "evidenceIDs",
        ],
    ),
    (
        "approval",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "intentID",
            "reason",
            "rootSessionID",
            "revision",
            "confirmed",
        ],
    ),
    (
        "capture-gap",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "intentID",
            "fromSequence",
            "toSequence",
            "status",
        ],
    ),
    (
        "audit",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "action",
            "actor",
            "subjectID",
            "at",
        ],
    ),
    (
        "archive",
        &[
            "schemaVersion",
            "entityType",
            "id",
            "intentID",
            "intentRevision",
            "lineageDigest",
            "bundleDigest",
            "committed",
        ],
    ),
];

pub(crate) fn decode_ledger_entity(value: &Json, path: &str) -> Result<Json, Failure> {
    let entries = value
        .object()
        .ok_or_else(|| fail(Code::LedgerSchemaInvalid, Some(path.into())))?;
    if value.get("schemaVersion").and_then(Json::number) != Some(1.0) {
        return Err(fail(
            Code::LedgerVersionUnsupported,
            Some("schemaVersion".into()),
        ));
    }
    let entity_type = value
        .get("entityType")
        .and_then(Json::string)
        .ok_or_else(|| {
            fail(
                Code::LedgerEntityTypeInvalid,
                Some(format!("{path}.entityType")),
            )
        })?;
    let keys = TYPES
        .iter()
        .find(|(name, _)| *name == entity_type)
        .map(|(_, keys)| *keys)
        .ok_or_else(|| {
            fail(
                Code::LedgerEntityTypeInvalid,
                Some(format!("{path}.entityType")),
            )
        })?;
    for (key, _) in entries {
        let key = key.to_string_lossy();
        if !keys.contains(&key.as_str()) {
            return Err(fail(
                Code::LedgerSchemaInvalid,
                Some(format!("{entity_type}.{key}")),
            ));
        }
    }
    for key in keys {
        if value.get(key).is_none() && !(entity_type == "evidence" && *key == "expiresAt") {
            return Err(fail(
                Code::LedgerSchemaInvalid,
                Some(format!("{entity_type}.{key}")),
            ));
        }
    }
    require_nonempty_string(value, "id", &entity_type)?;
    for key in ["revision", "intentRevision"] {
        if value.get(key).is_some() {
            require_nonnegative_integer(value, key, &entity_type)?;
        }
    }
    if entity_type == "claim" {
        require_nonnegative_integer(value, "fenceEpoch", &entity_type)?;
    }
    if entity_type == "capture-gap" {
        require_nonnegative_integer(value, "fromSequence", &entity_type)?;
        require_nonnegative_integer(value, "toSequence", &entity_type)?;
        if value
            .get("toSequence")
            .and_then(Json::number)
            .unwrap_or(-1.0)
            < value
                .get("fromSequence")
                .and_then(Json::number)
                .unwrap_or(0.0)
        {
            return Err(fail(
                Code::LedgerSchemaInvalid,
                Some("capture-gap.toSequence".into()),
            ));
        }
    }
    for key in [
        "scope",
        "nonGoals",
        "scenarios",
        "requiredEvidence",
        "criterionIDs",
        "writableScope",
        "eventIDs",
        "evidenceIDs",
    ] {
        if let Some(item) = value.get(key)
            && !matches!(item, Json::Array(items) if items.iter().all(|entry| matches!(entry, Json::String(_))))
        {
            return Err(fail(
                Code::LedgerSchemaInvalid,
                Some(format!("{entity_type}.{key}")),
            ));
        }
    }
    if entity_type == "fact"
        && value.get("authority").and_then(Json::string).as_deref() != Some("none")
    {
        return Err(fail(
            Code::LedgerFactAuthorityInvalid,
            Some("fact.authority".into()),
        ));
    }
    if matches!(entity_type.as_str(), "evidence" | "audit") {
        let key = if entity_type == "evidence" {
            "producer"
        } else {
            "actor"
        };
        let actor_path = format!("{entity_type}.{key}");
        let actor = value
            .get(key)
            .and_then(Json::object)
            .ok_or_else(|| fail(Code::LedgerSchemaInvalid, Some(actor_path.clone())))?;
        for (name, _) in actor {
            let name = name.to_string_lossy();
            if !["kind", "sessionID", "correlationID"].contains(&name.as_str()) {
                return Err(fail(
                    Code::LedgerSchemaInvalid,
                    Some(format!("{actor_path}.{name}")),
                ));
            }
        }
        require_nonempty_string(value.get(key).unwrap(), "kind", &actor_path)?;
        require_nonempty_string(value.get(key).unwrap(), "sessionID", &actor_path)?;
    }
    Ok(value.clone())
}

fn require_nonempty_string(value: &Json, key: &str, path: &str) -> Result<(), Failure> {
    if value
        .get(key)
        .and_then(Json::string)
        .is_some_and(|text| !text.is_empty())
    {
        Ok(())
    } else {
        Err(fail(
            Code::LedgerSchemaInvalid,
            Some(format!("{path}.{key}")),
        ))
    }
}
fn require_nonnegative_integer(value: &Json, key: &str, path: &str) -> Result<(), Failure> {
    if value
        .get(key)
        .and_then(Json::number)
        .is_some_and(|number| number >= 0.0 && number.fract() == 0.0)
    {
        Ok(())
    } else {
        Err(fail(
            Code::LedgerSchemaInvalid,
            Some(format!("{path}.{key}")),
        ))
    }
}
