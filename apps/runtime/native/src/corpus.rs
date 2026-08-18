use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Component, Path, PathBuf};
use std::slice;

const MAX_OUTPUT: usize = 32_768;
const ACCEPTED_MANIFEST_SHA256: &str =
    "78579c26058b557bda39f987d2fa1988d82c06d48f965260a3161b1a46767880";

#[repr(i32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum CorpusStatus {
    Ok = 0,
    Invalid = 1,
    Denied = 2,
    Absent = 3,
    Corrupt = 4,
    Conflict = 5,
    OutputTooSmall = 6,
    Failure = 7,
    ProjectionCorrupt = 8,
}

struct Lock(PathBuf);
impl Drop for Lock {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}

pub(crate) fn checked_absolute(value: &str) -> Result<PathBuf, CorpusStatus> {
    let path = PathBuf::from(value);
    if !path.is_absolute()
        || path
            .components()
            .any(|part| !matches!(part, Component::RootDir | Component::Normal(_)))
    {
        return Err(CorpusStatus::Invalid);
    }
    let mut current = PathBuf::new();
    for part in path.components() {
        current.push(part);
        if let Ok(metadata) = fs::symlink_metadata(&current)
            && metadata.file_type().is_symlink()
        {
            return Err(CorpusStatus::Corrupt);
        }
    }
    Ok(path)
}

fn text(pointer: *const u8, length: u64, maximum: usize) -> Result<String, CorpusStatus> {
    if pointer.is_null() || length > maximum as u64 {
        return Err(CorpusStatus::Invalid);
    }
    let length = usize::try_from(length).map_err(|_| CorpusStatus::Invalid)?;
    // SAFETY: exported ABI documents that the caller owns a readable region for this call.
    let bytes = unsafe { slice::from_raw_parts(pointer, length) };
    std::str::from_utf8(bytes)
        .map(str::to_owned)
        .map_err(|_| CorpusStatus::Invalid)
}

fn bytes(pointer: *const u8, length: u64, maximum: usize) -> Result<Vec<u8>, CorpusStatus> {
    if pointer.is_null() || length == 0 || length > maximum as u64 {
        return Err(CorpusStatus::Invalid);
    }
    let length = usize::try_from(length).map_err(|_| CorpusStatus::Invalid)?;
    // SAFETY: exported ABI requires a readable region for this call.
    Ok(unsafe { slice::from_raw_parts(pointer, length) }.to_vec())
}

fn confined(root: &Path, path: &Path) -> Result<(), CorpusStatus> {
    let relative = path.strip_prefix(root).map_err(|_| CorpusStatus::Invalid)?;
    let canonical_root = fs::canonicalize(root).map_err(|_| CorpusStatus::Corrupt)?;
    let mut current = root.to_path_buf();
    for component in relative.components() {
        if !matches!(component, Component::Normal(_)) {
            return Err(CorpusStatus::Invalid);
        }
        current.push(component);
        match fs::symlink_metadata(&current) {
            Ok(metadata) => {
                if metadata.file_type().is_symlink() {
                    return Err(CorpusStatus::Corrupt);
                }
                if !fs::canonicalize(&current)
                    .map_err(|_| CorpusStatus::Corrupt)?
                    .starts_with(&canonical_root)
                {
                    return Err(CorpusStatus::Corrupt);
                }
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => break,
            Err(_) => return Err(CorpusStatus::Corrupt),
        }
    }
    Ok(())
}

fn read_confined(root: &Path, path: &Path) -> Result<Vec<u8>, CorpusStatus> {
    confined(root, path)?;
    let metadata = fs::symlink_metadata(path).map_err(|_| CorpusStatus::Corrupt)?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err(CorpusStatus::Corrupt);
    }
    fs::read(path).map_err(|_| CorpusStatus::Corrupt)
}

fn exists_confined(root: &Path, path: &Path) -> Result<bool, CorpusStatus> {
    confined(root, path)?;
    Ok(path.exists())
}

fn lock(root: &Path) -> Result<Lock, CorpusStatus> {
    if !root.exists() {
        return Err(CorpusStatus::Denied);
    }
    let path = root.join("writer.lock");
    confined(root, &path)?;
    OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)
        .map_err(|_| CorpusStatus::Conflict)?;
    Ok(Lock(path))
}

pub(crate) fn sync_write(root: &Path, path: &Path, bytes: &[u8]) -> Result<(), CorpusStatus> {
    confined(root, path)?;
    let parent = path.parent().ok_or(CorpusStatus::Invalid)?;
    let parent_metadata = fs::symlink_metadata(parent).map_err(|_| CorpusStatus::Corrupt)?;
    if parent_metadata.file_type().is_symlink() || !parent_metadata.is_dir() {
        return Err(CorpusStatus::Corrupt);
    }
    let temporary = parent.join(format!(".stage-{}", std::process::id()));
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temporary)
        .map_err(|_| CorpusStatus::Conflict)?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|_| CorpusStatus::Failure)?;
    fs::rename(&temporary, path).map_err(|_| CorpusStatus::Failure)?;
    if let Ok(directory) = OpenOptions::new().read(true).open(parent) {
        let _ = directory.sync_all();
    }
    Ok(())
}

pub(crate) fn authorize(root: &Path, kind: &str, capability: &[u8]) -> Result<(), CorpusStatus> {
    if capability.is_empty() || capability.len() > 256 {
        return Err(CorpusStatus::Denied);
    }
    let path = root.join("authority").join(format!("{kind}.sha256"));
    let expected = read_confined(root, &path)?;
    let supplied = format!("{}\n", sha256(capability));
    if expected.len() != supplied.len()
        || expected
            .iter()
            .zip(supplied.as_bytes())
            .fold(0u8, |difference, (left, right)| difference | (left ^ right))
            != 0
    {
        return Err(CorpusStatus::Denied);
    }
    Ok(())
}

fn json_u64(source: &str, key: &str) -> Result<u64, CorpusStatus> {
    let marker = format!("\"{key}\":");
    let tail = source
        .strip_prefix('{')
        .and_then(|value| {
            value
                .find(&marker)
                .map(|start| &value[start + marker.len()..])
        })
        .ok_or(CorpusStatus::Corrupt)?
        .trim_start();
    let length = tail.bytes().take_while(u8::is_ascii_digit).count();
    if length == 0 || !matches!(tail.as_bytes().get(length), Some(b',') | Some(b'}')) {
        return Err(CorpusStatus::Corrupt);
    }
    tail[..length].parse().map_err(|_| CorpusStatus::Corrupt)
}

fn json_string(source: &str, key: &str) -> Result<String, CorpusStatus> {
    let marker = format!("\"{key}\"");
    let start = source.find(&marker).ok_or(CorpusStatus::Corrupt)? + marker.len();
    let tail = source[start..].trim_start();
    let tail = tail
        .strip_prefix(':')
        .ok_or(CorpusStatus::Corrupt)?
        .trim_start();
    let tail = tail.strip_prefix('"').ok_or(CorpusStatus::Corrupt)?;
    let end = tail.find('"').ok_or(CorpusStatus::Corrupt)?;
    let value = &tail[..end];
    if value.contains(['\\', '/', '\0']) && key != "path" && key != "sourceUrl" {
        return Err(CorpusStatus::Corrupt);
    }
    Ok(value.to_owned())
}

#[derive(Clone)]
struct Document {
    id: String,
    version: String,
    path: String,
    source_url: String,
    digest: String,
    length: usize,
}

fn documents(manifest: &str) -> Result<Vec<Document>, CorpusStatus> {
    let area = manifest
        .split_once("\"documents\"")
        .ok_or(CorpusStatus::Corrupt)?
        .1;
    let area = area
        .split_once('[')
        .ok_or(CorpusStatus::Corrupt)?
        .1
        .split_once(']')
        .ok_or(CorpusStatus::Corrupt)?
        .0;
    let mut result = Vec::new();
    for object in area.split("},") {
        let id = json_string(object, "documentId")?;
        let version = json_string(object, "version")?;
        let path = json_string(object, "path")?;
        let source_url = json_string(object, "sourceUrl")?;
        let digest = json_string(object, "sha256")?;
        let length_marker = "\"byteLength\":";
        let length_tail =
            object.find(length_marker).ok_or(CorpusStatus::Corrupt)? + length_marker.len();
        let length = object[length_tail..]
            .trim_start()
            .split(|c: char| !c.is_ascii_digit())
            .next()
            .ok_or(CorpusStatus::Corrupt)?
            .parse()
            .map_err(|_| CorpusStatus::Corrupt)?;
        if !safe_relative(&path)
            || !source_url.starts_with("https://m2-synthetic.invalid/documents/")
            || source_url["https://m2-synthetic.invalid/documents/".len()..] != id
            || digest.len() != 64
            || !digest
                .bytes()
                .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
        {
            return Err(CorpusStatus::Corrupt);
        }
        result.push(Document {
            id,
            version,
            path,
            source_url,
            digest,
            length,
        });
    }
    if result.is_empty() {
        return Err(CorpusStatus::Corrupt);
    }
    Ok(result)
}

fn safe_relative(value: &str) -> bool {
    !value.is_empty()
        && !value.contains('\\')
        && Path::new(value)
            .components()
            .all(|part| matches!(part, Component::Normal(_)))
}

fn sha256(input: &[u8]) -> String {
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
    ];
    let mut h = [
        0x6a09e667u32,
        0xbb67ae85,
        0x3c6ef372,
        0xa54ff53a,
        0x510e527f,
        0x9b05688c,
        0x1f83d9ab,
        0x5be0cd19,
    ];
    let mut data = input.to_vec();
    let bits = (data.len() as u64) * 8;
    data.push(0x80);
    while data.len() % 64 != 56 {
        data.push(0);
    }
    data.extend_from_slice(&bits.to_be_bytes());
    for chunk in data.chunks_exact(64) {
        let mut w = [0u32; 64];
        for (i, word) in w[..16].iter_mut().enumerate() {
            *word = u32::from_be_bytes(chunk[i * 4..i * 4 + 4].try_into().unwrap());
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }
        let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut hh] = h;
        for i in 0..64 {
            let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let ch = (e & f) ^ (!e & g);
            let t1 = hh
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(K[i])
                .wrapping_add(w[i]);
            let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let t2 = s0.wrapping_add(maj);
            hh = g;
            g = f;
            f = e;
            e = d.wrapping_add(t1);
            d = c;
            c = b;
            b = a;
            a = t1.wrapping_add(t2);
        }
        let v = [a, b, c, d, e, f, g, hh];
        for i in 0..8 {
            h[i] = h[i].wrapping_add(v[i]);
        }
    }
    h.iter().map(|value| format!("{value:08x}")).collect()
}

fn initialize(root: &Path) -> Result<(), CorpusStatus> {
    if root.exists() && !root.is_dir() {
        return Err(CorpusStatus::Corrupt);
    }
    fs::create_dir_all(root).map_err(|_| CorpusStatus::Failure)?;
    if fs::symlink_metadata(root)
        .map_err(|_| CorpusStatus::Failure)?
        .file_type()
        .is_symlink()
    {
        return Err(CorpusStatus::Corrupt);
    }
    let format = root.join("format.json");
    if exists_confined(root, &format)? {
        if read_confined(root, &format)? != b"{\"format\":\"curiosity.corpus/v1\"}\n" {
            return Err(CorpusStatus::Corrupt);
        }
    } else {
        sync_write(root, &format, b"{\"format\":\"curiosity.corpus/v1\"}\n")?;
    }
    for path in [
        "objects/sha256",
        "records/snapshots",
        "commits",
        "refs",
        "tombstones/snapshots",
        "projections/lexical",
    ] {
        ensure_directory(root, path)?;
    }
    remove_staging(root)?;
    Ok(())
}

fn ensure_directory(root: &Path, relative: &str) -> Result<(), CorpusStatus> {
    let mut current = root.to_path_buf();
    for component in relative.split('/') {
        current.push(component);
        if !current.exists() {
            fs::create_dir(&current).map_err(|_| CorpusStatus::Failure)?;
        }
        let metadata = fs::symlink_metadata(&current).map_err(|_| CorpusStatus::Corrupt)?;
        if metadata.file_type().is_symlink() || !metadata.is_dir() {
            return Err(CorpusStatus::Corrupt);
        }
    }
    Ok(())
}

fn remove_staging(path: &Path) -> Result<(), CorpusStatus> {
    for entry in fs::read_dir(path).map_err(|_| CorpusStatus::Failure)? {
        let entry = entry.map_err(|_| CorpusStatus::Failure)?;
        let metadata = fs::symlink_metadata(entry.path()).map_err(|_| CorpusStatus::Corrupt)?;
        if metadata.file_type().is_symlink() {
            return Err(CorpusStatus::Corrupt);
        }
        if metadata.is_dir() {
            remove_staging(&entry.path())?;
        } else if entry.file_name().to_string_lossy().starts_with(".stage-") {
            fs::remove_file(entry.path()).map_err(|_| CorpusStatus::Failure)?;
        }
    }
    Ok(())
}

fn next_commit(root: &Path) -> Result<u64, CorpusStatus> {
    let mut maximum = 0;
    let commits = root.join("commits");
    confined(root, &commits)?;
    for entry in fs::read_dir(&commits).map_err(|_| CorpusStatus::Failure)? {
        let entry = entry.map_err(|_| CorpusStatus::Failure)?;
        confined(root, &entry.path())?;
        let metadata = fs::symlink_metadata(entry.path()).map_err(|_| CorpusStatus::Corrupt)?;
        if metadata.file_type().is_symlink() || !metadata.is_file() {
            return Err(CorpusStatus::Corrupt);
        }
        let name = entry.file_name();
        if let Ok(value) = name
            .to_string_lossy()
            .trim_end_matches(".json")
            .parse::<u64>()
        {
            maximum = maximum.max(value);
        }
    }
    Ok(maximum + 1)
}

fn import(root: &Path, fixture: &Path) -> Result<(), CorpusStatus> {
    let _guard = lock(root)?;
    initialize(root)?;
    let manifest_path = fixture.join("manifest.json");
    confined(fixture, &manifest_path)?;
    let bytes = read_confined(fixture, &manifest_path).map_err(|_| CorpusStatus::Invalid)?;
    if sha256(&bytes) != ACCEPTED_MANIFEST_SHA256 {
        return Err(CorpusStatus::Denied);
    }
    let manifest = std::str::from_utf8(&bytes).map_err(|_| CorpusStatus::Corrupt)?;
    let id = json_string(manifest, "candidateId")?;
    let version = json_string(manifest, "candidateVersion")?;
    if id != "m2-synthetic-lexical" || version != "1.0.0" {
        return Err(CorpusStatus::Corrupt);
    }
    let tombstone = root
        .join("tombstones/snapshots")
        .join(format!("{id}-{version}.json"));
    if exists_confined(root, &tombstone)? {
        return Err(CorpusStatus::Denied);
    }
    let docs = documents(manifest)?;
    let mut aggregate = Vec::new();
    for doc in &docs {
        let path = fixture.join(&doc.path);
        confined(fixture, &path)?;
        let metadata = fs::symlink_metadata(&path).map_err(|_| CorpusStatus::Corrupt)?;
        if metadata.file_type().is_symlink() || !metadata.is_file() {
            return Err(CorpusStatus::Corrupt);
        }
        let body = read_confined(fixture, &path)?;
        if body.len() != doc.length || sha256(&body) != doc.digest {
            return Err(CorpusStatus::Corrupt);
        }
        aggregate.extend_from_slice(doc.path.as_bytes());
        aggregate.push(0);
        aggregate.extend_from_slice(doc.digest.as_bytes());
        aggregate.push(b'\n');
        let object = root
            .join("objects/sha256")
            .join(&doc.digest[..2])
            .join(&doc.digest[2..]);
        ensure_directory(root, &format!("objects/sha256/{}", &doc.digest[..2]))?;
        if exists_confined(root, &object)? {
            if read_confined(root, &object)? != body {
                return Err(CorpusStatus::Corrupt);
            }
        } else {
            sync_write(root, &object, &body)?;
        }
    }
    if json_string(manifest, "sha256")? != sha256(&aggregate) {
        return Err(CorpusStatus::Corrupt);
    }
    let record = root
        .join("records/snapshots")
        .join(&id)
        .join(format!("{version}.json"));
    ensure_directory(root, &format!("records/snapshots/{id}"))?;
    if exists_confined(root, &record)? {
        if read_confined(root, &record)? != bytes {
            return Err(CorpusStatus::Conflict);
        }
    } else {
        sync_write(root, &record, &bytes)?;
    }
    let commit = next_commit(root)?;
    let commit_path = root.join("commits").join(format!("{commit:020}.json"));
    let commit_bytes = format!(
        "{{\"commit\":{commit},\"id\":\"{id}\",\"operation\":\"import\",\"version\":\"{version}\"}}\n"
    );
    sync_write(root, &commit_path, commit_bytes.as_bytes())?;
    if read_confined(root, &commit_path)? != commit_bytes.as_bytes() {
        return Err(CorpusStatus::Corrupt);
    }
    sync_write(
        root,
        &root.join("refs/imported.json"),
        format!("{{\"commit\":{commit},\"id\":\"{id}\",\"version\":\"{version}\"}}\n").as_bytes(),
    )
}

fn identity(root: &Path) -> Result<(String, String), CorpusStatus> {
    let path = root.join("refs/imported.json");
    let source = String::from_utf8(read_confined(root, &path).map_err(|_| CorpusStatus::Absent)?)
        .map_err(|_| CorpusStatus::Corrupt)?;
    let id = json_string(&source, "id")?;
    let version = json_string(&source, "version")?;
    let commit = json_u64(&source, "commit")?;
    let commit_path = root.join("commits").join(format!("{commit:020}.json"));
    let expected = format!(
        "{{\"commit\":{commit},\"id\":\"{id}\",\"operation\":\"import\",\"version\":\"{version}\"}}\n"
    );
    if read_confined(root, &commit_path)? != expected.as_bytes() {
        return Err(CorpusStatus::Corrupt);
    }
    Ok((id, version))
}
fn transition(root: &Path, operation: &str) -> Result<(), CorpusStatus> {
    let _guard = lock(root)?;
    initialize(root)?;
    let (id, version) = identity(root)?;
    let tomb = root
        .join("tombstones/snapshots")
        .join(format!("{id}-{version}.json"));
    if operation == "activate" && exists_confined(root, &tomb)? {
        return Err(CorpusStatus::Denied);
    }
    let commit = next_commit(root)?;
    let commit_path = root.join("commits").join(format!("{commit:020}.json"));
    let commit_bytes = format!(
        "{{\"commit\":{commit},\"id\":\"{id}\",\"operation\":\"{operation}\",\"version\":\"{version}\"}}\n"
    );
    if operation == "activate" {
        rebuild_inner(root, &id, &version)?;
        sync_write(root, &commit_path, commit_bytes.as_bytes())?;
        if read_confined(root, &commit_path)? != commit_bytes.as_bytes() {
            return Err(CorpusStatus::Corrupt);
        }
        sync_write(
            root,
            &root.join("refs/visible.json"),
            format!("{{\"commit\":{commit},\"id\":\"{id}\",\"version\":\"{version}\"}}\n")
                .as_bytes(),
        )?;
    } else if operation == "withdraw" || operation == "delete" {
        sync_write(
            root,
            &tomb,
            format!(
                "{{\"id\":\"{id}\",\"reason\":\"owner-withdrawal\",\"version\":\"{version}\"}}\n"
            )
            .as_bytes(),
        )?;
        sync_write(root, &commit_path, commit_bytes.as_bytes())?;
        if read_confined(root, &commit_path)? != commit_bytes.as_bytes() {
            return Err(CorpusStatus::Corrupt);
        }
        let visible = root.join("refs/visible.json");
        confined(root, &visible)?;
        if visible.exists() {
            fs::remove_file(&visible).map_err(|_| CorpusStatus::Failure)?;
        }
        let projection = root.join("projections/lexical/current.json");
        confined(root, &projection)?;
        if projection.exists() {
            fs::remove_file(&projection).map_err(|_| CorpusStatus::Failure)?;
        }
        if operation == "delete" {
            let record = root
                .join("records/snapshots")
                .join(&id)
                .join(format!("{version}.json"));
            if let Ok(bytes) = read_confined(root, &record) {
                let text = String::from_utf8(bytes).map_err(|_| CorpusStatus::Corrupt)?;
                for doc in documents(&text)? {
                    let object = root
                        .join("objects/sha256")
                        .join(&doc.digest[..2])
                        .join(&doc.digest[2..]);
                    confined(root, &object)?;
                    if object.exists() {
                        fs::remove_file(object).map_err(|_| CorpusStatus::Failure)?;
                    }
                }
            }
            confined(root, &record)?;
            if record.exists() {
                fs::remove_file(record).map_err(|_| CorpusStatus::Failure)?;
            }
        }
    } else {
        return Err(CorpusStatus::Invalid);
    }
    Ok(())
}

fn rebuild_inner(root: &Path, id: &str, version: &str) -> Result<(), CorpusStatus> {
    let tombstone = root
        .join("tombstones/snapshots")
        .join(format!("{id}-{version}.json"));
    if exists_confined(root, &tombstone)? {
        return Err(CorpusStatus::Denied);
    }
    let projection = projection_text(root, id, version)?;
    sync_write(
        root,
        &root.join("projections/lexical/current.json"),
        projection.as_bytes(),
    )
}

fn projection_text(root: &Path, id: &str, version: &str) -> Result<String, CorpusStatus> {
    let record_path = root
        .join("records/snapshots")
        .join(id)
        .join(format!("{version}.json"));
    let record =
        String::from_utf8(read_confined(root, &record_path)?).map_err(|_| CorpusStatus::Corrupt)?;
    let mut projection = String::from("{\"documents\":[");
    for (doc_index, doc) in documents(&record)?.iter().enumerate() {
        let object = root
            .join("objects/sha256")
            .join(&doc.digest[..2])
            .join(&doc.digest[2..]);
        let body = read_confined(root, &object)?;
        if sha256(&body) != doc.digest {
            return Err(CorpusStatus::Corrupt);
        }
        if doc_index > 0 {
            projection.push(',')
        }
        projection.push_str(&format!(
            "{{\"digest\":\"{}\",\"documentId\":\"{}\",\"sourceUrl\":\"{}\",\"text\":\"{}\",\"version\":\"{}\"}}",
            doc.digest,
            doc.id,
            doc.source_url,
            json_escape(
                std::str::from_utf8(&body)
                    .map_err(|_| CorpusStatus::Corrupt)?
                    .trim_end()
            ),
            doc.version
        ));
    }
    projection.push_str(&format!(
        "],\"snapshotId\":\"{id}\",\"snapshotVersion\":\"{version}\"}}\n"
    ));
    Ok(projection)
}
fn rebuild(root: &Path) -> Result<(), CorpusStatus> {
    let _guard = lock(root)?;
    initialize(root)?;
    let (id, version) = identity(root)?;
    rebuild_inner(root, &id, &version)
}
fn json_escape(value: &str) -> String {
    value
        .chars()
        .flat_map(|c| match c {
            '"' => "\\\"".chars().collect::<Vec<_>>(),
            '\\' => "\\\\".chars().collect(),
            '\n' => "\\n".chars().collect(),
            '\r' => "\\r".chars().collect(),
            '\t' => "\\t".chars().collect(),
            c if c.is_control() => Vec::new(),
            c => vec![c],
        })
        .collect()
}

fn lexical_query(
    root: &Path,
    capability: &[u8],
    query: &str,
    maximum: usize,
) -> Result<String, CorpusStatus> {
    authorize(root, "query", capability)?;
    initialize_read(root)?;
    let visible_path = root.join("refs/visible.json");
    let visible =
        String::from_utf8(read_confined(root, &visible_path).map_err(|_| CorpusStatus::Absent)?)
            .map_err(|_| CorpusStatus::Corrupt)?;
    let (id, version) = (
        json_string(&visible, "id")?,
        json_string(&visible, "version")?,
    );
    let tombstone = root
        .join("tombstones/snapshots")
        .join(format!("{id}-{version}.json"));
    if exists_confined(root, &tombstone)? {
        return Err(CorpusStatus::Absent);
    }
    let commit_number = json_u64(&visible, "commit")?;
    let commit_path = root
        .join("commits")
        .join(format!("{commit_number:020}.json"));
    let expected_commit = format!(
        "{{\"commit\":{commit_number},\"id\":\"{id}\",\"operation\":\"activate\",\"version\":\"{version}\"}}\n"
    );
    if read_confined(root, &commit_path)? != expected_commit.as_bytes() {
        return Err(CorpusStatus::Corrupt);
    }
    let record_path = root
        .join("records/snapshots")
        .join(&id)
        .join(format!("{version}.json"));
    let record =
        String::from_utf8(read_confined(root, &record_path)?).map_err(|_| CorpusStatus::Corrupt)?;
    let expected_projection = projection_text(root, &id, &version)?;
    let projection_path = root.join("projections/lexical/current.json");
    let actual_projection = String::from_utf8(
        read_confined(root, &projection_path).map_err(|_| CorpusStatus::ProjectionCorrupt)?,
    )
    .map_err(|_| CorpusStatus::ProjectionCorrupt)?;
    if actual_projection != expected_projection {
        return Err(CorpusStatus::ProjectionCorrupt);
    }
    let terms: Vec<String> = query
        .split(|c: char| !c.is_alphanumeric())
        .filter(|v| !v.is_empty())
        .map(str::to_lowercase)
        .collect();
    let mut hits = Vec::new();
    for doc in documents(&record)? {
        let object = root
            .join("objects/sha256")
            .join(&doc.digest[..2])
            .join(&doc.digest[2..]);
        let body = read_confined(root, &object)?;
        if sha256(&body) != doc.digest {
            return Err(CorpusStatus::Corrupt);
        }
        let text = std::str::from_utf8(&body)
            .map_err(|_| CorpusStatus::Corrupt)?
            .trim_end();
        let lower = text.to_lowercase();
        let score = terms
            .iter()
            .filter(|term| lower.contains(term.as_str()))
            .count();
        if score > 0 {
            hits.push((score, doc, text.to_owned()));
        }
    }
    hits.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| a.1.id.cmp(&b.1.id)));
    hits.truncate(maximum.min(10));
    let mut out = String::from("{\"results\":[");
    for (i, (score, doc, text)) in hits.iter().enumerate() {
        if i > 0 {
            out.push(',')
        }
        let passage: String = text.chars().take(512).collect();
        out.push_str(&format!("{{\"analyzerVersion\":\"lexical-v1\",\"documentId\":\"{}\",\"passage\":\"{}\",\"score\":{},\"snapshotId\":\"{}\",\"snapshotVersion\":\"{}\",\"sourceUrl\":\"{}\",\"version\":\"{}\"}}",doc.id,json_escape(&passage),score,id,version,doc.source_url,doc.version));
    }
    out.push_str("]}");
    if out.len() > MAX_OUTPUT {
        return Err(CorpusStatus::Failure);
    }
    Ok(out)
}
fn initialize_read(root: &Path) -> Result<(), CorpusStatus> {
    let metadata = fs::symlink_metadata(root).map_err(|_| CorpusStatus::Absent)?;
    if metadata.file_type().is_symlink() || !metadata.is_dir() {
        return Err(CorpusStatus::Corrupt);
    }
    if read_confined(root, &root.join("format.json"))? != b"{\"format\":\"curiosity.corpus/v1\"}\n"
    {
        return Err(CorpusStatus::Corrupt);
    }
    Ok(())
}

fn run_admin(action: i32, root: &str, capability: &[u8], fixture: Option<&str>) -> CorpusStatus {
    let root = match checked_absolute(root) {
        Ok(v) => v,
        Err(v) => return v,
    };
    if let Err(status) = authorize(&root, "admin", capability) {
        return status;
    }
    match action {
        0 => match lock(&root).and_then(|_guard| initialize(&root)) {
            Ok(()) => CorpusStatus::Ok,
            Err(v) => v,
        },
        1 => match fixture
            .and_then(|v| checked_absolute(v).ok())
            .ok_or(CorpusStatus::Invalid)
            .and_then(|v| import(&root, &v))
        {
            Ok(()) => CorpusStatus::Ok,
            Err(v) => v,
        },
        2 => transition(&root, "activate")
            .err()
            .unwrap_or(CorpusStatus::Ok),
        3 => transition(&root, "withdraw")
            .err()
            .unwrap_or(CorpusStatus::Ok),
        4 => transition(&root, "delete")
            .err()
            .unwrap_or(CorpusStatus::Ok),
        5 => rebuild(&root).err().unwrap_or(CorpusStatus::Ok),
        _ => CorpusStatus::Invalid,
    }
}

#[cfg(feature = "admin")]
#[unsafe(no_mangle)]
/// Administrative M2 ABI. Action: 0 init, 1 import, 2 activate, 3 withdraw, 4 delete, 5 rebuild.
/// # Safety
/// Caller retains readable input buffers for the call; no pointer is retained.
pub unsafe extern "C" fn curiosity_runtime_v1_corpus_admin(
    action: i32,
    root_pointer: *const u8,
    root_length: u64,
    capability_pointer: *const u8,
    capability_length: u64,
    fixture_pointer: *const u8,
    fixture_length: u64,
) -> i32 {
    let root = match text(root_pointer, root_length, 4096) {
        Ok(v) => v,
        Err(v) => return v as i32,
    };
    let capability = match bytes(capability_pointer, capability_length, 256) {
        Ok(v) => v,
        Err(_) => return CorpusStatus::Denied as i32,
    };
    let fixture = if fixture_length == 0 {
        None
    } else {
        match text(fixture_pointer, fixture_length, 4096) {
            Ok(v) => Some(v),
            Err(v) => return v as i32,
        }
    };
    run_admin(action, &root, &capability, fixture.as_deref()) as i32
}

#[unsafe(no_mangle)]
/// Query M2 ABI writes UTF-8 JSON only into the caller-owned bounded output buffer.
/// # Safety
/// Caller retains readable inputs and writable output for the call; no pointer is retained.
pub unsafe extern "C" fn curiosity_runtime_v1_corpus_query(
    root_pointer: *const u8,
    root_length: u64,
    capability_pointer: *const u8,
    capability_length: u64,
    query_pointer: *const u8,
    query_length: u64,
    maximum: i32,
    output_pointer: *mut u8,
    output_capacity: u64,
) -> i32 {
    let root = match text(root_pointer, root_length, 4096) {
        Ok(v) => v,
        Err(v) => return -(v as i32) - 1,
    };
    let capability = match bytes(capability_pointer, capability_length, 256) {
        Ok(v) => v,
        Err(v) => return -(v as i32) - 1,
    };
    let query = match text(query_pointer, query_length, 2000) {
        Ok(v) => v,
        Err(v) => return -(v as i32) - 1,
    };
    if !(1..=10).contains(&maximum) || output_pointer.is_null() {
        return -(CorpusStatus::Invalid as i32) - 1;
    }
    let root = match checked_absolute(&root) {
        Ok(v) => v,
        Err(v) => return -(v as i32) - 1,
    };
    let output = match lexical_query(&root, &capability, &query, maximum as usize) {
        Ok(v) => v,
        Err(v) => return -(v as i32) - 1,
    };
    if output.len() > output_capacity as usize {
        return -(CorpusStatus::OutputTooSmall as i32) - 1;
    } // SAFETY: caller promises writable capacity; length was checked.
    unsafe { std::ptr::copy_nonoverlapping(output.as_ptr(), output_pointer, output.len()) };
    output.len() as i32
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn sha_vectors() {
        assert_eq!(
            sha256(b"abc"),
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );
    }
    #[test]
    fn rejects_relative_and_traversal() {
        assert_eq!(checked_absolute("relative"), Err(CorpusStatus::Invalid));
        assert!(!safe_relative("../escape"));
        assert!(!safe_relative("a\\b"));
    }

    #[test]
    fn rejects_the_wrong_query_capability_as_denied() {
        let root = std::env::temp_dir().join(format!(
            "curiosity-native-authority-{}-{}",
            std::process::id(),
            std::thread::current().name().unwrap_or("test")
        ));
        let authority = root.join("authority");
        fs::create_dir_all(&authority).expect("create authority fixture");
        fs::write(
            authority.join("query.sha256"),
            format!("{}\n", sha256(b"accepted-query-capability")),
        )
        .expect("write authority fixture");

        assert_eq!(
            authorize(&root, "query", b"wrong-query-capability"),
            Err(CorpusStatus::Denied)
        );
        fs::remove_dir_all(root).expect("remove authority fixture");
    }
}
