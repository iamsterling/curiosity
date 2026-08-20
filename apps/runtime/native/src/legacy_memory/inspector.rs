use super::{
    canonical::{canonical_json, sha256_text},
    diagnostic::{Code, Failure, fail},
    event::decode_ledger_event,
    json::Json,
    replay::{View, reduce, set_field},
};
use std::{
    env, fs,
    path::{Component, Path, PathBuf},
};

const FILE_LIMIT: u64 = 262_144;
const ENTRY_LIMIT: usize = 4096;
const TOTAL_LIMIT: u64 = 16_777_216;
#[derive(Clone, Debug)]
pub(crate) struct Inventory {
    pub(crate) path: String,
    pub(crate) size: u64,
    pub(crate) digest: String,
}
#[derive(Clone, Debug)]
pub(crate) struct LedgerInspection {
    pub(crate) inventory: Vec<Inventory>,
    pub(crate) view: View,
}
#[derive(Clone, Debug)]
pub(crate) struct CaptureInspection {
    pub(crate) inventory: Vec<Inventory>,
    pub(crate) events: Vec<Json>,
    pub(crate) gaps: Json,
}

pub(crate) fn inspect_ledger(requested: &str) -> Result<LedgerInspection, Failure> {
    let root = qualification_root(requested)?;
    let mut inventory = Vec::new();
    let version = read_required(&root, "schema-version", &mut inventory, true)?;
    let text = std::str::from_utf8(&version)
        .ok()
        .map(str::trim)
        .ok_or_else(|| {
            fail(
                Code::LedgerSchemaVersionInvalid,
                Some("schema-version".into()),
            )
        })?;
    if text.is_empty() || !text.bytes().all(|b| b.is_ascii_digit()) {
        return Err(fail(
            Code::LedgerSchemaVersionInvalid,
            Some("schema-version".into()),
        ));
    }
    if text != "1" {
        return Err(fail(
            Code::LedgerVersionUnsupported,
            Some("schema-version".into()),
        ));
    }
    let names = json_entries(&root, "events")?;
    let mut events = Vec::new();
    let mut sequence = 0.0;
    let mut digest = "GENESIS".to_owned();
    for name in names {
        let relative = format!("events/{name}");
        let bytes = read_required(&root, &relative, &mut inventory, false)?;
        let value = Json::parse(&bytes)
            .ok()
            .and_then(|value| decode_ledger_event(&value).ok())
            .ok_or_else(|| fail(Code::LedgerCorrupt, Some(relative.clone())))?;
        if value.get("sequence").and_then(Json::number) != Some(sequence + 1.0)
            || value
                .get("previousDigest")
                .and_then(Json::string)
                .as_deref()
                != Some(&digest)
        {
            return Err(fail(Code::LedgerReplayInvalid, Some(relative)));
        }
        let base = set_field(&value, "digest", Json::Undefined);
        let computed = sha256_text(
            canonical_json(&base)
                .map_err(|_| fail(Code::LedgerReplayInvalid, Some(relative.clone())))?
                .as_bytes(),
        );
        if value.get("digest").and_then(Json::string).as_deref() != Some(&computed) {
            return Err(fail(Code::LedgerReplayInvalid, Some(relative)));
        }
        sequence += 1.0;
        digest = computed;
        events.push(value)
    }
    inventory.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(LedgerInspection {
        inventory,
        view: reduce(&events),
    })
}

pub(crate) fn inspect_capture(requested: &str) -> Result<CaptureInspection, Failure> {
    let root = qualification_root(requested)?;
    let mut inventory = Vec::new();
    let mut events = Vec::new();
    for name in json_entries(&root, "events")? {
        let relative = format!("events/{name}");
        let bytes = read_required(&root, &relative, &mut inventory, false)?;
        events.push(Json::parse(&bytes).map_err(|_| fail(Code::CaptureCorrupt, Some(relative)))?)
    }
    let gaps = match read_optional(&root, "gaps.json", &mut inventory)? {
        Some(bytes) => Json::parse(&bytes).unwrap_or(Json::Array(vec![])),
        None => Json::Array(vec![]),
    };
    inventory.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(CaptureInspection {
        inventory,
        events,
        gaps,
    })
}

fn qualification_root(requested: &str) -> Result<PathBuf, Failure> {
    let configured = env::var_os("CURIOSITY_PARITY_FIXTURE_ROOT")
        .map(PathBuf::from)
        .ok_or_else(|| fail(Code::ParityFixtureRootUnavailable, None))?;
    if !configured.is_absolute()
        || configured
            .components()
            .any(|c| matches!(c,Component::Normal(v)if v==".opencode"))
    {
        return Err(fail(Code::ParityFixtureRootUnavailable, None));
    }
    let mut ancestor = PathBuf::new();
    for component in configured.components() {
        ancestor.push(component.as_os_str());
        if matches!(component, Component::RootDir) {
            continue;
        }
        let metadata = fs::symlink_metadata(&ancestor)
            .map_err(|_| fail(Code::ParityFixtureRootUnavailable, None))?;
        if metadata.file_type().is_symlink() {
            return Err(fail(Code::ParityFixtureRootUnavailable, None));
        }
    }
    let configured_meta = fs::symlink_metadata(&configured)
        .map_err(|_| fail(Code::ParityFixtureRootUnavailable, None))?;
    if configured_meta.file_type().is_symlink() || !configured_meta.is_dir() {
        return Err(fail(Code::ParityFixtureRootUnavailable, None));
    }
    if requested.is_empty()
        || requested.contains('\\')
        || requested.contains('\0')
        || Path::new(requested).is_absolute()
        || requested
            .split('/')
            .any(|part| part.is_empty() || matches!(part, "." | ".."))
    {
        return Err(fail(Code::ParityPathInvalid, Some("/input/root".into())));
    }
    if requested.split('/').any(|part| part == ".opencode") {
        return Err(fail(
            Code::ParityLiveRootForbidden,
            Some("/input/root".into()),
        ));
    }
    let mut current = configured;
    for part in requested.split('/') {
        current.push(part);
        let metadata = match fs::symlink_metadata(&current) {
            Ok(value) => value,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Err(fail(Code::ParityRootMissing, Some(requested.into())));
            }
            Err(_) => {
                return Err(fail(
                    Code::ParityFilesystemReadFailed,
                    Some(requested.into()),
                ));
            }
        };
        if metadata.file_type().is_symlink() {
            return Err(fail(Code::ParitySymlinkForbidden, Some(requested.into())));
        }
        if !metadata.is_dir() {
            return Err(fail(
                Code::ParityFilesystemKindInvalid,
                Some(requested.into()),
            ));
        }
    }
    Ok(current)
}

fn json_entries(root: &Path, relative: &str) -> Result<Vec<String>, Failure> {
    let directory = root.join(relative);
    let metadata = match fs::symlink_metadata(&directory) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(vec![]),
        Err(_) => {
            return Err(fail(
                Code::ParityFilesystemReadFailed,
                Some(relative.into()),
            ));
        }
    };
    if metadata.file_type().is_symlink() {
        return Err(fail(Code::ParitySymlinkForbidden, Some(relative.into())));
    }
    if !metadata.is_dir() {
        return Err(fail(
            Code::ParityFilesystemKindInvalid,
            Some(relative.into()),
        ));
    }
    let mut names = Vec::new();
    for entry in fs::read_dir(&directory)
        .map_err(|_| fail(Code::ParityFilesystemReadFailed, Some(relative.into())))?
    {
        let entry =
            entry.map_err(|_| fail(Code::ParityFilesystemReadFailed, Some(relative.into())))?;
        let name = entry
            .file_name()
            .into_string()
            .map_err(|_| fail(Code::ParityFilesystemReadFailed, Some(relative.into())))?;
        if name.ends_with(".json") {
            names.push(name)
        }
    }
    names.sort();
    if names.len() > ENTRY_LIMIT {
        return Err(fail(Code::ParityLimitExceeded, Some(relative.into())));
    }
    for name in &names {
        let path = format!("{relative}/{name}");
        let metadata = fs::symlink_metadata(directory.join(name))
            .map_err(|_| fail(Code::ParityFilesystemReadFailed, Some(path.clone())))?;
        if metadata.file_type().is_symlink() {
            return Err(fail(Code::ParitySymlinkForbidden, Some(path)));
        }
        if !metadata.is_file() {
            return Err(fail(Code::ParityFilesystemKindInvalid, Some(path)));
        }
    }
    Ok(names)
}
fn read_required(
    root: &Path,
    relative: &str,
    inventory: &mut Vec<Inventory>,
    version: bool,
) -> Result<Vec<u8>, Failure> {
    match read_optional(root, relative, inventory)? {
        Some(value) => Ok(value),
        None => Err(fail(
            if version {
                Code::LedgerSchemaVersionMissing
            } else {
                Code::ParityRootMissing
            },
            Some(relative.into()),
        )),
    }
}
fn read_optional(
    root: &Path,
    relative: &str,
    inventory: &mut Vec<Inventory>,
) -> Result<Option<Vec<u8>>, Failure> {
    let path = root.join(relative);
    let metadata = match fs::symlink_metadata(&path) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(_) => {
            return Err(fail(
                Code::ParityFilesystemReadFailed,
                Some(relative.into()),
            ));
        }
    };
    if metadata.file_type().is_symlink() {
        return Err(fail(Code::ParitySymlinkForbidden, Some(relative.into())));
    }
    if !metadata.is_file() {
        return Err(fail(
            Code::ParityFilesystemKindInvalid,
            Some(relative.into()),
        ));
    }
    if metadata.len() > FILE_LIMIT
        || inventory.len() >= ENTRY_LIMIT
        || inventory.iter().map(|item| item.size).sum::<u64>() + metadata.len() > TOTAL_LIMIT
    {
        return Err(fail(Code::ParityLimitExceeded, Some(relative.into())));
    }
    let bytes = fs::read(path)
        .map_err(|_| fail(Code::ParityFilesystemReadFailed, Some(relative.into())))?;
    inventory.push(Inventory {
        path: relative.into(),
        size: bytes.len() as u64,
        digest: sha256_text(&bytes),
    });
    Ok(Some(bytes))
}
