use super::{
    canonical::{canonical_json, js_number, sha256_text},
    diagnostic::Code,
    entity::decode_ledger_entity,
    event::decode_ledger_event,
    json::Json,
    replay::{reduce, replay, set_field},
};

#[test]
fn canonicalizes_legacy_bytes_and_rejects_unknown_entity_keys() {
    let value = Json::parse(br#"{"z":1,"a":[true,null,"x"]}"#).unwrap();
    assert_eq!(
        canonical_json(&value).unwrap(),
        r#"{"a":[true,null,"x"],"z":1}"#
    );

    let entity = Json::parse(
        br#"{"schemaVersion":1,"entityType":"capability","id":"c1","revision":0,"scenarios":[],"extra":true}"#,
    )
    .unwrap();
    let decoded = decode_ledger_entity(&entity, "entity");
    assert!(decoded.is_err(), "entity-unknown-key|diagnostic.path");
    let failure = decoded.unwrap_err();
    assert_eq!(
        failure.code,
        Code::LedgerSchemaInvalid,
        "entity-unknown-key|diagnostic.path"
    );
    assert_eq!(
        failure.path.as_deref(),
        Some("capability.extra"),
        "entity-unknown-key|diagnostic.path"
    );
    let object = Json::Object(vec![
        (super::json::JsString::from_str("a"), Json::Undefined),
        (super::json::JsString::from_str("z"), Json::Number(1.0)),
    ]);
    let canonical = canonical_json(&object);
    assert!(canonical.is_ok(), "object-undefined|bytesBase64");
    assert_eq!(
        canonical.unwrap(),
        r#"{"z":1}"#,
        "object-undefined|bytesBase64"
    );
    assert_eq!(
        canonical_json(&Json::Array(vec![Json::Hole, Json::Undefined])).unwrap(),
        "[null,null]",
        "array-hole|bytesBase64"
    );
    assert_eq!(
        canonical_json(&Json::String(super::json::JsString(vec![0xd800]))).unwrap(),
        r#""\ud800""#,
        "lone-surrogate|bytesBase64"
    );
}

#[test]
fn reducer_qualifies_every_transition_and_referenced_state_noop() {
    let source = r#"[
      {"sequence":1,"digest":"d1","type":"intent.framed","at":"t1","actor":{},"data":{"intentID":"missing","criteria":[1]}},
      {"sequence":2,"digest":"d2","type":"intent.captured","at":"t2","actor":{},"data":{"id":"i1","revision":1}},
      {"sequence":3,"digest":"d3","type":"intent.framed","at":"t3","actor":{},"data":{"intentID":"i1","criteria":[{"id":"c1"}]}},
      {"sequence":4,"digest":"d4","type":"intent.activated","at":"t4","actor":{},"data":{"intentID":"i1"}},
      {"sequence":5,"digest":"d5","type":"work.proposed","at":"t5","actor":{},"data":{"id":"w1","intentID":"i1"}},
      {"sequence":6,"digest":"d6","type":"claim.acquired","at":"t6","actor":{},"data":{"workID":"w1","token":"a"}},
      {"sequence":7,"digest":"d7","type":"claim.released","at":"fallback","actor":{},"data":{"workID":"w1"}},
      {"sequence":8,"digest":"d8","type":"evidence.submitted","at":"t8","actor":{},"data":{"id":"e1"}},
      {"sequence":9,"digest":"d9","type":"evidence.submitted","at":"t9","actor":{},"data":{"id":"e1"}},
      {"sequence":10,"digest":"d10","type":"fact.recorded","at":"t10","actor":{},"data":{"id":"f1","nested":{"x":1}}},
      {"sequence":11,"digest":"d11","type":"capture-gap.recorded","at":"t11","actor":{},"data":{"id":"g1","status":"open"}},
      {"sequence":12,"digest":"d12","type":"capture-gap.resolved","at":"t12","actor":{},"data":{"id":"g1"}},
      {"sequence":13,"digest":"d13","type":"approval.requested","at":"t13","actor":{},"data":{"id":"a1","confirmed":true}},
      {"sequence":14,"digest":"d14","type":"approval.confirmed","at":"t14","actor":{},"data":{"id":"a1"}},
      {"sequence":15,"digest":"d15","type":"resolution.proposed","at":"t15","actor":{"kind":"model","sessionID":"s"},"data":{"intentID":"i1","verdict":"accept"}},
      {"sequence":16,"digest":"d16","type":"intent.reconciled","at":"t16","actor":{},"data":{"intentID":"i1"}},
      {"sequence":17,"digest":"d17","type":"intent.archived","at":"t17","actor":{},"data":{"intentID":"i1"}},
      {"sequence":18,"digest":"d18","type":"unknown","at":"t18","actor":{},"data":{}}
    ]"#;
    let Json::Array(events) = Json::parse(source.as_bytes()).unwrap() else {
        panic!()
    };
    let view = reduce(&events);
    assert_eq!(view.sequence, 18.0);
    assert_eq!(view.digest, "d18");
    assert_eq!(view.evidence.len(), 2);
    assert_eq!(
        view.intents[0]
            .1
            .get("lifecycle")
            .and_then(Json::string)
            .as_deref(),
        Some("archived")
    );
    assert_eq!(view.claims[0].1.get("released"), Some(&Json::Bool(true)));
    assert_eq!(
        view.claims[0]
            .1
            .get("releasedAt")
            .and_then(Json::string)
            .as_deref(),
        Some("fallback")
    );
    assert_eq!(
        view.capture_gaps[0]
            .1
            .get("status")
            .and_then(Json::string)
            .as_deref(),
        Some("resolved")
    );
    assert_eq!(
        view.approvals[0].1.get("confirmed"),
        Some(&Json::Bool(true))
    );
    assert_eq!(
        view.resolutions[0]
            .1
            .get("actor")
            .and_then(|actor| actor.get("kind"))
            .and_then(Json::string)
            .as_deref(),
        Some("model")
    );
}

fn reduced(source: &str) -> super::replay::View {
    let Json::Array(events) = Json::parse(source.as_bytes()).unwrap() else {
        panic!()
    };
    reduce(&events)
}

#[test]
fn reducer_transition_mutation_vectors_are_independently_observable() {
    let captured = reduced(
        r#"[{"sequence":1,"digest":"d","type":"intent.captured","at":"t","actor":{},"data":{"id":"i","lifecycle":"wrong","criteria":[1]}}]"#,
    );
    assert!(
        !captured.intents.is_empty(),
        "transition:intent.captured|view"
    );
    assert_eq!(
        captured.intents[0]
            .1
            .get("lifecycle")
            .and_then(Json::string)
            .as_deref(),
        Some("captured"),
        "transition:intent.captured|view"
    );
    assert_eq!(
        captured.intents[0].1.get("criteria"),
        Some(&Json::Array(vec![])),
        "transition:intent.captured|view"
    );
    let framed = reduced(
        r#"[{"sequence":1,"digest":"a","type":"intent.captured","at":"t","actor":{},"data":{"id":"i"}},{"sequence":2,"digest":"b","type":"intent.framed","at":"t","actor":{},"data":{"intentID":"i","criteria":[1]}}]"#,
    );
    assert_eq!(
        framed.intents[0]
            .1
            .get("lifecycle")
            .and_then(Json::string)
            .as_deref(),
        Some("framed"),
        "transition:intent.framed|view"
    );
    assert_eq!(
        framed.intents[0].1.get("criteria"),
        Some(&Json::Array(vec![Json::Number(1.0)])),
        "transition:intent.framed|view"
    );
    for (kind, expected) in [
        ("intent.activated", "active"),
        ("intent.reconciled", "reconciled"),
        ("intent.archived", "archived"),
    ] {
        let source = format!(
            r#"[{{"sequence":1,"digest":"a","type":"intent.captured","at":"t","actor":{{}},"data":{{"id":"i"}}}},{{"sequence":2,"digest":"b","type":"{kind}","at":"t","actor":{{}},"data":{{"intentID":"i"}}}}]"#
        );
        let view = reduced(&source);
        assert_eq!(
            view.intents[0]
                .1
                .get("lifecycle")
                .and_then(Json::string)
                .as_deref(),
            Some(expected),
            "transition:{kind}|view"
        );
    }
    let cases = [
        ("work.proposed", "work", "id"),
        ("claim.acquired", "claims", "workID"),
        ("fact.recorded", "facts", "id"),
        ("capture-gap.recorded", "gaps", "id"),
        ("approval.requested", "approvals", "id"),
        ("resolution.proposed", "resolutions", "intentID"),
    ];
    for (kind, map, key) in cases {
        let source = format!(
            r#"[{{"sequence":1,"digest":"d","type":"{kind}","at":"t","actor":{{"kind":"model"}},"data":{{"{key}":"k","marker":1}}}}]"#
        );
        let view = reduced(&source);
        let present = match map {
            "work" => !view.work.is_empty(),
            "claims" => !view.claims.is_empty(),
            "facts" => !view.facts.is_empty(),
            "gaps" => !view.capture_gaps.is_empty(),
            "approvals" => !view.approvals.is_empty(),
            _ => !view.resolutions.is_empty(),
        };
        assert!(present, "transition:{kind}|view");
    }
    let evidence = reduced(
        r#"[{"sequence":1,"digest":"d","type":"evidence.submitted","at":"t","actor":{},"data":{"id":"e"}}]"#,
    );
    assert_eq!(
        evidence.evidence.len(),
        1,
        "transition:evidence.submitted|view"
    );
    let released = reduced(
        r#"[{"sequence":1,"digest":"a","type":"claim.acquired","at":"t","actor":{},"data":{"workID":"w"}},{"sequence":2,"digest":"b","type":"claim.released","at":"fallback","actor":{},"data":{"workID":"w","releasedAt":"explicit"}}]"#,
    );
    assert_eq!(
        released.claims[0]
            .1
            .get("releasedAt")
            .and_then(Json::string)
            .as_deref(),
        Some("explicit"),
        "claim-release-explicit|view.claims[0].releasedAt"
    );
    assert_eq!(
        released.claims[0].1.get("released"),
        Some(&Json::Bool(true)),
        "transition:claim.released|view"
    );
    let gap = reduced(
        r#"[{"sequence":1,"digest":"a","type":"capture-gap.recorded","at":"t","actor":{},"data":{"id":"g","status":"open"}},{"sequence":2,"digest":"b","type":"capture-gap.resolved","at":"t","actor":{},"data":{"id":"g"}}]"#,
    );
    assert_eq!(
        gap.capture_gaps[0]
            .1
            .get("status")
            .and_then(Json::string)
            .as_deref(),
        Some("resolved"),
        "transition:capture-gap.resolved|view"
    );
    let approval = reduced(
        r#"[{"sequence":1,"digest":"a","type":"approval.requested","at":"t","actor":{},"data":{"id":"a","confirmed":true}},{"sequence":2,"digest":"b","type":"approval.confirmed","at":"t","actor":{},"data":{"id":"a"}}]"#,
    );
    assert_eq!(
        approval.approvals[0].1.get("confirmed"),
        Some(&Json::Bool(true)),
        "transition:approval.confirmed|view"
    );
    let resolution = reduced(
        r#"[{"sequence":1,"digest":"d","type":"resolution.proposed","at":"t","actor":{"kind":"model"},"data":{"intentID":"i","actor":{"kind":"wrong"}}}]"#,
    );
    assert_eq!(
        resolution.resolutions[0]
            .1
            .get("actor")
            .and_then(|actor| actor.get("kind"))
            .and_then(Json::string)
            .as_deref(),
        Some("model"),
        "transition:resolution.proposed|view"
    );
}

#[test]
fn reducer_noop_overwrite_default_and_advancement_vectors_are_independent() {
    for kind in [
        "intent.framed",
        "intent.activated",
        "intent.reconciled",
        "intent.archived",
        "claim.released",
        "capture-gap.resolved",
        "approval.confirmed",
    ] {
        let key = if kind.starts_with("intent.") {
            "intentID"
        } else if kind.starts_with("claim.") {
            "workID"
        } else {
            "id"
        };
        let source = format!(
            r#"[{{"sequence":1,"digest":"d","type":"{kind}","at":"t","actor":{{}},"data":{{"{key}":"missing"}}}}]"#
        );
        let view = reduced(&source);
        assert!(
            view.intents.is_empty()
                && view.claims.is_empty()
                && view.capture_gaps.is_empty()
                && view.approvals.is_empty(),
            "missing-state:{kind}|view.{}",
            if kind.starts_with("intent.") {
                "intents"
            } else if kind.starts_with("claim.") {
                "claims"
            } else if kind.starts_with("capture-gap.") {
                "capture_gaps"
            } else {
                "approvals"
            }
        );
        assert_eq!(view.sequence, 1.0, "recognized-noop-advance|sequence");
        assert_eq!(view.digest, "d", "recognized-noop-advance|digest");
    }
    for (kind, key, map) in [
        ("intent.captured", "id", "intent"),
        ("work.proposed", "id", "work"),
        ("claim.acquired", "workID", "claim"),
        ("fact.recorded", "id", "fact"),
        ("capture-gap.recorded", "id", "gap"),
        ("approval.requested", "id", "approval"),
        ("resolution.proposed", "intentID", "resolution"),
    ] {
        let source = format!(
            r#"[{{"sequence":1,"digest":"a","type":"{kind}","at":"t","actor":{{}},"data":{{"{key}":"k","marker":1}}}},{{"sequence":2,"digest":"b","type":"{kind}","at":"t","actor":{{}},"data":{{"{key}":"k","marker":2}}}}]"#
        );
        let view = reduced(&source);
        let value = match map {
            "intent" => &view.intents[0].1,
            "work" => &view.work[0].1,
            "claim" => &view.claims[0].1,
            "fact" => &view.facts[0].1,
            "gap" => &view.capture_gaps[0].1,
            "approval" => &view.approvals[0].1,
            _ => &view.resolutions[0].1,
        };
        assert_eq!(
            value.get("marker").and_then(Json::number),
            Some(2.0),
            "overwrite:{map}|view.{map}.marker"
        );
    }
    let evidence = reduced(
        r#"[{"sequence":1,"digest":"a","type":"evidence.submitted","at":"t","actor":{},"data":{"id":"same","marker":1}},{"sequence":2,"digest":"b","type":"evidence.submitted","at":"t","actor":{},"data":{"id":"same","marker":2}}]"#,
    );
    assert_eq!(
        evidence.evidence.len(),
        2,
        "evidence-duplicates|view.evidence.length"
    );
    let defaulted = reduced(
        r#"[{"sequence":1,"digest":"a","type":"claim.acquired","at":"t","actor":{},"data":{"workID":"w"}},{"sequence":2,"digest":"b","type":"claim.released","at":"fallback","actor":{},"data":{"workID":"w"}}]"#,
    );
    assert_eq!(
        defaulted.claims[0]
            .1
            .get("releasedAt")
            .and_then(Json::string)
            .as_deref(),
        Some("fallback"),
        "claim-release-default|view.claims[0].releasedAt"
    );
    let ignored = reduced(
        r#"[{"sequence":7,"digest":"ignored","type":"unknown","at":"t","actor":{},"data":{}}]"#,
    );
    assert!(
        ignored.intents.is_empty() && ignored.evidence.is_empty(),
        "unknown-event|view.evidence"
    );
    assert_eq!(ignored.sequence, 7.0, "ignored-advance|sequence");
    assert_eq!(ignored.digest, "ignored", "ignored-advance|digest");
    let empty = super::replay::View::empty();
    assert_eq!(empty.sequence, 0.0, "empty-view|sequence");
    assert_eq!(empty.digest, "GENESIS");
    assert!(empty.intents.is_empty() && empty.evidence.is_empty());
}

#[test]
fn reduced_facts_own_their_top_level_construction_data() {
    let mut input = Json::parse(
        br#"{"sequence":1,"digest":"d","type":"fact.recorded","at":"t","actor":{},"data":{"id":"f","statement":"original"}}"#,
    )
    .unwrap();
    let view = reduce(std::slice::from_ref(&input));
    input = set_field(&input, "data", Json::Object(vec![]));
    assert_eq!(input.get("data"), Some(&Json::Object(vec![])));
    assert_eq!(
        view.facts[0]
            .1
            .get("statement")
            .and_then(Json::string)
            .as_deref(),
        Some("original")
    );
    // The parity module and all returned construction types are crate-private;
    // external callers receive only serialized adapter envelopes.
    fn accepts_shared_fact(_: &Json) {}
    accepts_shared_fact(&view.facts[0].1);
}

#[test]
fn preserves_javascript_number_boundaries() {
    for (source, expected) in [
        ("-0", "0"),
        ("1e-7", "1e-7"),
        ("1e-6", "0.000001"),
        ("1e20", "100000000000000000000"),
        ("1e21", "1e+21"),
        ("0.30000000000000004", "0.30000000000000004"),
    ] {
        let value = Json::parse(source.as_bytes()).unwrap();
        assert_eq!(canonical_json(&value).unwrap(), expected);
    }
    assert_eq!(
        js_number(f64::from_bits(0xc30cf011799305b2)),
        "-1018157149085878.2",
        "f64-c30cf011799305b2|bytesBase64"
    );
}

#[test]
fn decoder_and_replay_failure_precedence_is_stable() {
    let entity = Json::parse(br#"{"schemaVersion":2,"entityType":"nope","extra":true}"#).unwrap();
    assert_eq!(
        decode_ledger_entity(&entity, "entity").unwrap_err().code,
        Code::LedgerVersionUnsupported,
        "entity-version-precedence|diagnostic.code"
    );
    let event = Json::parse(br#"{"schemaVersion":2,"extra":true}"#).unwrap();
    assert_eq!(
        decode_ledger_event(&event).unwrap_err().code,
        Code::LedgerVersionUnsupported,
        "event-version-precedence|diagnostic.code"
    );
    let replay_version = Json::parse(
        br#"{"schemaVersion":2,"sequence":2,"previousDigest":"bad","data":{},"digest":"bad"}"#,
    )
    .unwrap();
    assert_eq!(
        replay(&[replay_version]).unwrap_err().path.as_deref(),
        Some("events[0].schemaVersion"),
        "replay-version-precedence|diagnostic.path"
    );
    let event = Json::parse(br#"{"schemaVersion":1,"id":"e","sequence":1,"aggregate":"a","type":"x","at":"t","actor":{"extra":true},"data":{},"previousDigest":"GENESIS","digest":"x"}"#).unwrap();
    assert_eq!(
        decode_ledger_event(&event).unwrap_err().code,
        Code::LedgerSchemaInvalid,
        "event-actor-unknown-key|diagnostic.code"
    );
    let event = Json::parse(br#"{"schemaVersion":1,"id":"e","sequence":1,"aggregate":"a","type":"x","at":"t","actor":{},"data":{},"previousDigest":"GENESIS","digest":"x","extra":true}"#).unwrap();
    let decoded = decode_ledger_event(&event);
    assert!(decoded.is_err(), "event-unknown-key|diagnostic.code");
    assert_eq!(
        decoded.unwrap_err().code,
        Code::LedgerSchemaInvalid,
        "event-unknown-key|diagnostic.code"
    );
    for (source, path, vector) in [
        (
            r#"{"schemaVersion":1,"sequence":2,"previousDigest":"bad","data":{},"digest":"bad"}"#,
            "events[0].sequence",
            "replay-sequence-precedence",
        ),
        (
            r#"{"schemaVersion":1,"sequence":1,"previousDigest":"bad","data":{},"digest":"bad"}"#,
            "events[0].previousDigest",
            "replay-previous-precedence",
        ),
        (
            r#"{"schemaVersion":1,"sequence":1,"previousDigest":"GENESIS","data":{},"digest":"bad"}"#,
            "events[0].digest",
            "replay-digest",
        ),
    ] {
        let event = Json::parse(source.as_bytes()).unwrap();
        let replayed = replay(&[event]);
        assert!(replayed.is_err(), "{vector}|diagnostic.path");
        assert_eq!(
            replayed.unwrap_err().path.as_deref(),
            Some(path),
            "{vector}|diagnostic.path"
        );
    }
    let base = Json::parse(br#"{"schemaVersion":1,"sequence":1,"previousDigest":"GENESIS","data":{"schemaVersion":1,"entityType":"capability","id":"c","extra":true}}"#).unwrap();
    let digest = sha256_text(canonical_json(&base).unwrap().as_bytes());
    let event = set_field(
        &base,
        "digest",
        Json::String(super::json::JsString::from_str(&digest)),
    );
    let replayed = replay(&[event]);
    assert!(replayed.is_err(), "replay-entity-invalid|diagnostic.code");
    assert_eq!(
        replayed.unwrap_err().code,
        Code::LedgerSchemaInvalid,
        "replay-entity-invalid|diagnostic.code"
    );
    let missing_data = Json::parse(br#"{"schemaVersion":1,"id":"e","sequence":1,"aggregate":"a","type":"x","at":"t","actor":{},"previousDigest":"GENESIS","digest":"sha256:b7ee57dbf4be59abf6d34536dc876b25b08b4880021cd132d58a343af283eeee"}"#).unwrap();
    assert_eq!(
        replay(&[missing_data]).unwrap_err().code,
        Code::ParityInternalFailure
    );
}

#[test]
fn matches_the_closed_pinned_collation_vectors() {
    for (keys, expected) in [
        (
            vec!["A", "a", "0", "-", "_"],
            r#"{"0":1,"_":1,"-":1,"a":1,"A":1}"#,
        ),
        (vec!["e\u{301}", "é"], r#"{"é":1,"é":1}"#),
        (vec!["é", "e\u{301}"], r#"{"é":1,"é":1}"#),
        (vec!["z", "ä"], r#"{"ä":1,"z":1}"#),
        (vec!["ä", "å"], r#"{"å":1,"ä":1}"#),
        (vec!["ß", "ss"], r#"{"ss":1,"ß":1}"#),
        (vec!["ı", "İ", "I", "i"], r#"{"i":1,"I":1,"İ":1,"ı":1}"#),
        (vec!["\u{e000}", "z", "😀"], r#"{"😀":1,"z":1,"":1}"#),
    ] {
        let entries = keys
            .into_iter()
            .map(|key| format!("\"{key}\":1"))
            .collect::<Vec<_>>()
            .join(",");
        let value = Json::parse(format!("{{{entries}}}").as_bytes()).unwrap();
        assert_eq!(canonical_json(&value).unwrap(), expected);
    }
}

#[test]
fn qualified_collation_is_permutation_stable_and_unqualified_pairs_fail_closed() {
    let groups = [
        (vec!["_", "-", "0", "a", "A"], vec!["0", "_", "-", "a", "A"]),
        (vec!["ä", "z"], vec!["ä", "z"]),
        (vec!["å", "ä"], vec!["å", "ä"]),
        (vec!["ss", "ß"], vec!["ss", "ß"]),
        (vec!["i", "I", "İ", "ı"], vec!["i", "I", "İ", "ı"]),
        (vec!["😀", "z", "\u{e000}"], vec!["😀", "z", "\u{e000}"]),
    ];
    for (input, expected) in groups {
        for permutation in permutations(input) {
            let entries = permutation
                .into_iter()
                .map(|key| format!("\"{key}\":1"))
                .collect::<Vec<_>>()
                .join(",");
            let value = Json::parse(format!("{{{entries}}}").as_bytes()).unwrap();
            let expected = expected
                .iter()
                .map(|key| format!("\"{key}\":1"))
                .collect::<Vec<_>>()
                .join(",");
            assert_eq!(
                canonical_json(&value).unwrap(),
                format!("{{{expected}}}"),
                "keys-ascii|bytesBase64"
            );
        }
    }
    for permutation in [vec!["é", "e\u{301}"], vec!["e\u{301}", "é"]] {
        let entries = permutation
            .iter()
            .map(|key| format!("\"{key}\":1"))
            .collect::<Vec<_>>()
            .join(",");
        let value = Json::parse(format!("{{{entries}}}").as_bytes()).unwrap();
        assert_eq!(
            canonical_json(&value).unwrap(),
            format!("{{{entries}}}"),
            "locale-equal keys preserve insertion order"
        );
    }
    let value = Json::parse("{\"b\":1,\"á\":2}".as_bytes()).unwrap();
    assert_eq!(
        canonical_json(&value).unwrap_err().code,
        Code::ParityCollationUnsupported
    );
}

fn permutations(values: Vec<&'static str>) -> Vec<Vec<&'static str>> {
    fn visit(values: &mut Vec<&'static str>, at: usize, output: &mut Vec<Vec<&'static str>>) {
        if at == values.len() {
            output.push(values.clone());
            return;
        }
        for index in at..values.len() {
            values.swap(at, index);
            visit(values, at + 1, output);
            values.swap(at, index);
        }
    }
    let mut values = values;
    let mut output = Vec::new();
    visit(&mut values, 0, &mut output);
    output
}

#[test]
fn inspector_precedence_sorting_fallback_and_ancestor_policy_are_read_only() {
    use super::inspector::{inspect_capture, inspect_ledger};
    use std::{
        fs,
        os::unix::{fs::symlink, net::UnixListener},
        path::PathBuf,
    };
    let root = std::env::var_os("CURIOSITY_PARITY_TEST_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            PathBuf::from("/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode")
                .join(format!("lm-{}", std::process::id()))
        });
    let _ = fs::remove_dir_all(&root);
    fs::create_dir_all(root.join("l/events")).unwrap();
    fs::write(root.join("l/schema-version"), b"2\n").unwrap();
    fs::write(root.join("l/events/a.json"), b"not-json").unwrap();
    fs::create_dir_all(root.join("c/events")).unwrap();
    fs::write(root.join("c/events/z.json"), br#"{"id":"z"}"#).unwrap();
    fs::write(root.join("c/events/a.json"), br#"{"id":"a"}"#).unwrap();
    fs::write(root.join("c/gaps.json"), b"not-json").unwrap();
    let ledger_entries = fs::read_dir(root.join("l")).unwrap().count();
    // SAFETY: no other parity test reads this test-only environment variable.
    unsafe { std::env::set_var("CURIOSITY_PARITY_FIXTURE_ROOT", &root) };
    assert_eq!(
        inspect_ledger("../l").unwrap_err().code,
        Code::ParityPathInvalid,
        "traversal|diagnostic.code"
    );
    assert_eq!(
        inspect_ledger(".opencode/live").unwrap_err().code,
        Code::ParityLiveRootForbidden
    );
    assert_eq!(
        inspect_ledger("l").unwrap_err().code,
        Code::LedgerVersionUnsupported,
        "ledger-version-precedence|diagnostic.code"
    );
    assert_eq!(
        fs::read_dir(root.join("l")).unwrap().count(),
        ledger_entries,
        "zero-write|filesystem.inventory"
    );
    let before = fs::read_dir(root.join("c")).unwrap().count();
    let capture = inspect_capture("c").unwrap();
    assert_eq!(fs::read_dir(root.join("c")).unwrap().count(), before);
    assert_eq!(
        capture.events[0]
            .get("id")
            .and_then(Json::string)
            .as_deref(),
        Some("a"),
        "capture-sorting|events[0].id"
    );
    assert_eq!(
        capture.events[1]
            .get("id")
            .and_then(Json::string)
            .as_deref(),
        Some("z")
    );
    assert_eq!(
        capture.gaps,
        Json::Array(vec![]),
        "capture-malformed-gaps|gaps"
    );
    symlink("missing", root.join("c/events/0.json")).unwrap();
    assert_eq!(
        inspect_capture("c").unwrap_err().code,
        Code::ParitySymlinkForbidden,
        "capture-entry-symlink|diagnostic.code"
    );
    fs::remove_file(root.join("c/events/0.json")).unwrap();
    let socket = UnixListener::bind(root.join("c/events/0.json")).unwrap();
    assert_eq!(
        inspect_capture("c").unwrap_err().code,
        Code::ParityFilesystemKindInvalid,
        "capture-special|diagnostic.code"
    );
    drop(socket);
    fs::remove_file(root.join("c/events/0.json")).unwrap();
    let linked = root.with_extension("linked");
    let _ = fs::remove_file(&linked);
    symlink(&root, &linked).unwrap();
    unsafe { std::env::set_var("CURIOSITY_PARITY_FIXTURE_ROOT", &linked) };
    assert_eq!(
        inspect_ledger("l").unwrap_err().code,
        Code::ParityFixtureRootUnavailable,
        "ancestor-symlink|diagnostic.code"
    );
    unsafe { std::env::remove_var("CURIOSITY_PARITY_FIXTURE_ROOT") };
    fs::remove_file(linked).unwrap();
    fs::remove_dir_all(root).unwrap();
}
