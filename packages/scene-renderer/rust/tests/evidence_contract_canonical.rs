use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{cmp::Ordering, fs, path::PathBuf};

fn byte_cmp(left: &str, right: &str) -> Ordering {
    left.as_bytes().cmp(right.as_bytes())
}

fn escape_json_string(value: &str) -> String {
    let mut output = String::from("\"");
    for scalar in value.chars() {
        match scalar {
            '\"' => output.push_str("\\\""),
            '\\' => output.push_str("\\\\"),
            '\u{08}' => output.push_str("\\b"),
            '\t' => output.push_str("\\t"),
            '\n' => output.push_str("\\n"),
            '\u{0c}' => output.push_str("\\f"),
            '\r' => output.push_str("\\r"),
            scalar if scalar <= '\u{1f}' => output.push_str(&format!("\\u{:04x}", scalar as u32)),
            scalar => output.push(scalar),
        }
    }
    output.push('\"');
    output
}

fn sort_fields(parent: &str) -> Option<&'static [&'static str]> {
    match parent {
        "entries" => Some(&["sourceOffset"]),
        "nativeRanges" | "clusters" | "glyphs" | "fonts" | "artifacts" => Some(&["id"]),
        "lines" => Some(&["index", "id"]),
        "diagnostics" => Some(&["code", "stage", "subjectId"]),
        "dependencies" => Some(&["purl", "sha256"]),
        "observations" => Some(&["metric", "unit", "state"]),
        "variations" => Some(&["tag"]),
        "affinities" => Some(&["edge", "label"]),
        _ => None,
    }
}

fn scalar_cmp(left: &Value, right: &Value) -> Ordering {
    match (left, right) {
        (Value::Number(left), Value::Number(right)) => left.as_i64().cmp(&right.as_i64()),
        (Value::String(left), Value::String(right)) => byte_cmp(left, right),
        _ => panic!("contract sort key must be an integer or string"),
    }
}

fn canonical_json(value: &Value, parent: &str) -> String {
    match value {
        Value::Null => panic!("contract forbids null"),
        Value::Bool(value) => value.to_string(),
        Value::Number(value) => {
            assert!(
                value.is_i64() || value.is_u64(),
                "contract permits integer JSON numbers only"
            );
            value.to_string()
        }
        Value::String(value) => escape_json_string(value),
        Value::Array(values) => {
            let mut values = values.iter().collect::<Vec<_>>();
            if parent == "flags" {
                values.sort_by(|left, right| {
                    byte_cmp(
                        left.as_str().expect("flag is a string"),
                        right.as_str().expect("flag is a string"),
                    )
                });
            } else if parent == "samples" {
                values.sort_by(|left, right| {
                    byte_cmp(
                        left["f64"].as_str().expect("sample f64"),
                        right["f64"].as_str().expect("sample f64"),
                    )
                });
            } else if let Some(fields) = sort_fields(parent) {
                values.sort_by(|left, right| {
                    let left_record = left.as_object().expect("contract sort entry is an object");
                    let right_record = right.as_object().expect("contract sort entry is an object");
                    for field in fields {
                        let order = scalar_cmp(&left_record[*field], &right_record[*field]);
                        if order != Ordering::Equal {
                            return order;
                        }
                    }
                    byte_cmp(&canonical_json(left, ""), &canonical_json(right, ""))
                });
            }
            format!(
                "[{}]",
                values
                    .into_iter()
                    .map(|entry| canonical_json(entry, ""))
                    .collect::<Vec<_>>()
                    .join(",")
            )
        }
        Value::Object(values) => {
            let mut keys = values.keys().collect::<Vec<_>>();
            keys.sort_by(|left, right| byte_cmp(left, right));
            format!(
                "{{{}}}",
                keys.into_iter()
                    .map(|key| format!(
                        "{}:{}",
                        escape_json_string(key),
                        canonical_json(&values[key], key)
                    ))
                    .collect::<Vec<_>>()
                    .join(",")
            )
        }
    }
}

#[test]
fn evidence_contract_vector_matches_committed_js_bytes_and_sha256() {
    let fixture_root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../openspec/changes/dynamic-text-capability/evidence-contract/fixtures");
    let vector: Value = serde_json::from_str(
        &fs::read_to_string(fixture_root.join("canonical-contract-vector.json")).unwrap(),
    )
    .unwrap();
    let expected_bytes =
        fs::read(fixture_root.join("canonical-contract-vector.canonical.json")).unwrap();
    let expected_sha =
        fs::read_to_string(fixture_root.join("canonical-contract-vector.sha256")).unwrap();
    let actual = format!("{}\n", canonical_json(&vector, "")).into_bytes();

    assert_eq!(actual, expected_bytes);
    let actual_sha = Sha256::digest(&actual)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect::<String>();
    assert_eq!(actual_sha, expected_sha.trim());
}
