use std::fs::{self, File, OpenOptions};
use std::os::unix::fs::{MetadataExt, OpenOptionsExt};
use std::path::{Path, PathBuf};

use super::sha256::digest;

const NOFOLLOW: i32 = 0x0000_0100;
const MANIFEST: &str = include_str!("../../../fixtures/owned-web-qualification/v1/manifest.txt");

#[derive(Clone, Debug)]
pub(super) struct FixtureProof {
    pub capture_digest: String,
    pub receipt_id: String,
    pub anchor_ref: String,
    pub authority_ref: String,
    pub nonce: String,
    pub proof_digest: String,
}

pub(super) struct AdmittedFixture {
    pub relative_path: String,
    pub media_type: String,
    pub body: Vec<u8>,
    pub proof: FixtureProof,
}

pub(super) fn admit_fixture(
    body_path: &Path,
    proof_path: &Path,
) -> Result<AdmittedFixture, &'static str> {
    let root = fixture_root()?;
    let body_relative = confined_relative(&root, body_path)?;
    let proof_relative = confined_relative(&root, proof_path)?;
    let body = read_nofollow(body_path, "CAPTURE_FIXTURE_READ_FAILED")?;
    let proof_bytes = read_nofollow(proof_path, "CAPTURE_PROOF_READ_FAILED")?;
    let line = MANIFEST
        .lines()
        .find(|line| line.starts_with(&format!("{body_relative}|")))
        .ok_or("CAPTURE_FIXTURE_NOT_MANIFESTED")?;
    let fields: Vec<_> = line.split('|').collect();
    if fields.len() != 6 || fields[4] != proof_relative {
        return Err("CAPTURE_FIXTURE_MANIFEST_INVALID");
    }
    let expected_size = fields[2]
        .parse::<usize>()
        .map_err(|_| "CAPTURE_FIXTURE_MANIFEST_INVALID")?;
    if fields[1] != media_type_for(&body_relative)?
        || expected_size != body.len()
        || fields[3] != digest(&body)
    {
        return Err("CAPTURE_FIXTURE_PIN_MISMATCH");
    }
    let proof = parse_proof(&proof_bytes)?;
    if proof.capture_digest != fields[3] || proof.proof_digest != fields[5] {
        return Err("CAPTURE_PROOF_BINDING_MISMATCH");
    }
    validate_proof_digest(&proof)?;
    Ok(AdmittedFixture {
        relative_path: body_relative,
        media_type: fields[1].into(),
        body,
        proof,
    })
}

fn fixture_root() -> Result<PathBuf, &'static str> {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .ok_or("CAPTURE_FIXTURE_PATH_INVALID")?
        .join("fixtures/owned-web-qualification/v1")
        .canonicalize()
        .map_err(|_| "CAPTURE_FIXTURE_PATH_INVALID")
}

fn confined_relative(root: &Path, candidate: &Path) -> Result<String, &'static str> {
    if !candidate.is_absolute() {
        return Err("CAPTURE_FIXTURE_PATH_INVALID");
    }
    reject_symlink_components(candidate)?;
    let parent = candidate
        .parent()
        .ok_or("CAPTURE_FIXTURE_PATH_INVALID")?
        .canonicalize()
        .map_err(|_| "CAPTURE_FIXTURE_PATH_INVALID")?;
    if parent != root {
        return Err("CAPTURE_FIXTURE_NOT_PROJECT_AUTHORED");
    }
    candidate
        .file_name()
        .and_then(|name| name.to_str())
        .map(str::to_owned)
        .ok_or("CAPTURE_FIXTURE_PATH_INVALID")
}

fn read_nofollow(path: &Path, code: &'static str) -> Result<Vec<u8>, &'static str> {
    let before = fs::symlink_metadata(path).map_err(|_| code)?;
    if !before.is_file() || before.file_type().is_symlink() {
        return Err(code);
    }
    let file = OpenOptions::new()
        .read(true)
        .custom_flags(NOFOLLOW)
        .open(path)
        .map_err(|_| code)?;
    let after = file.metadata().map_err(|_| code)?;
    if before.dev() != after.dev() || before.ino() != after.ino() || !after.is_file() {
        return Err(code);
    }
    read_bounded(file, code)
}

fn read_bounded(file: File, code: &'static str) -> Result<Vec<u8>, &'static str> {
    use std::io::Read;
    let mut bytes = Vec::new();
    file.take(1_048_577)
        .read_to_end(&mut bytes)
        .map_err(|_| code)?;
    if bytes.len() > 1_048_576 {
        return Err("CAPTURE_FIXTURE_LIMIT_EXCEEDED");
    }
    Ok(bytes)
}

fn parse_proof(bytes: &[u8]) -> Result<FixtureProof, &'static str> {
    let text = std::str::from_utf8(bytes).map_err(|_| "CAPTURE_PROOF_INVALID")?;
    let lines: Vec<_> = text.lines().collect();
    if lines.len() != 6 {
        return Err("CAPTURE_PROOF_INVALID");
    }
    let value = |index: usize, key: &str| {
        lines[index]
            .strip_prefix(&format!("{key}="))
            .filter(|value| !value.is_empty())
            .map(str::to_owned)
            .ok_or("CAPTURE_PROOF_INVALID")
    };
    Ok(FixtureProof {
        capture_digest: value(0, "capture_digest")?,
        receipt_id: value(1, "receipt_id")?,
        anchor_ref: value(2, "anchor_ref")?,
        authority_ref: value(3, "authority_ref")?,
        nonce: value(4, "nonce")?,
        proof_digest: value(5, "proof_digest")?,
    })
}

fn validate_proof_digest(proof: &FixtureProof) -> Result<(), &'static str> {
    if proof.authority_ref != "plugin-adr0024-fixture-authority-v1" {
        return Err("CAPTURE_PROOF_AUTHORITY_INVALID");
    }
    let canonical = format!(
        "{}|{}|{}|{}|{}",
        proof.capture_digest, proof.receipt_id, proof.anchor_ref, proof.authority_ref, proof.nonce
    );
    if digest(canonical.as_bytes()) != proof.proof_digest {
        return Err("CAPTURE_PROOF_DIGEST_INVALID");
    }
    Ok(())
}

fn media_type_for(path: &str) -> Result<&'static str, &'static str> {
    if path.ends_with(".txt") {
        return Ok("text/plain");
    }
    if path.ends_with(".html") {
        return Ok("text/html");
    }
    Err("MIME_UNSUPPORTED")
}

fn reject_symlink_components(path: &Path) -> Result<(), &'static str> {
    let mut current = PathBuf::new();
    for component in path.components() {
        current.push(component.as_os_str());
        let metadata =
            fs::symlink_metadata(&current).map_err(|_| "CAPTURE_FIXTURE_PATH_INVALID")?;
        if metadata.file_type().is_symlink() {
            return Err("CAPTURE_FIXTURE_SYMLINK");
        }
    }
    Ok(())
}
