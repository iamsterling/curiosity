use std::fs;
use std::os::unix::fs::{MetadataExt, PermissionsExt};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

use super::admission::{AdmittedFixture, admit_fixture};
use super::database::QualificationStore;
use super::extraction::extract;
use super::root::{SecuredRoot, validate_operator_root};
use super::sha256::digest;

static NEXT: AtomicU64 = AtomicU64::new(0);
struct TestRoot(PathBuf);
impl TestRoot {
    fn new() -> Self {
        let path = std::env::temp_dir().join(format!(
            "curiosity-owned-web-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&path).expect("root");
        fs::set_permissions(&path, fs::Permissions::from_mode(0o700)).expect("root mode");
        Self(path.canonicalize().expect("canonical root"))
    }
}
impl Drop for TestRoot {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
fn secured(root: &TestRoot) -> SecuredRoot {
    SecuredRoot::open(root.0.to_str().expect("utf8")).expect("secure root")
}
fn work(root: &TestRoot) -> PathBuf {
    root.0.join(".owned-web-qualification-v1")
}
fn fixture(name: &str) -> AdmittedFixture {
    let base = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("runtime")
        .join("fixtures/owned-web-qualification/v1");
    admit_fixture(
        &base.join(name),
        &base.join(name.replace(".html", ".proof").replace(".txt", ".proof")),
    )
    .expect("admit")
}

#[test]
fn root_and_every_child_reject_symlinks_non_directories_and_identity_swaps() {
    assert_eq!(
        SecuredRoot::open("relative").err().unwrap(),
        "CONTROL_ROOT_NOT_ABSOLUTE"
    );
    let root = TestRoot::new();
    fs::create_dir(work(&root)).unwrap();
    fs::set_permissions(work(&root), fs::Permissions::from_mode(0o700)).unwrap();
    fs::write(work(&root).join("objects"), b"not-directory").expect("file");
    assert_eq!(
        SecuredRoot::open(root.0.to_str().unwrap()).err().unwrap(),
        "CONTROL_CHILD_TYPE_INVALID"
    );
    fs::remove_file(work(&root).join("objects")).unwrap();
    let outside = TestRoot::new();
    std::os::unix::fs::symlink(&outside.0, work(&root).join("records")).unwrap();
    assert_eq!(
        SecuredRoot::open(root.0.to_str().unwrap()).err().unwrap(),
        "CONTROL_CHILD_TYPE_INVALID"
    );
    fs::remove_file(work(&root).join("records")).unwrap();
    let secured_root = secured(&root);
    fs::rename(work(&root).join("objects"), work(&root).join("objects-old")).unwrap();
    fs::create_dir(work(&root).join("objects")).unwrap();
    assert_eq!(
        secured_root.verify().unwrap_err(),
        "CONTROL_CHILD_IDENTITY_CHANGED"
    );
    let database_root = TestRoot::new();
    let database_outside = TestRoot::new();
    let target = database_outside.0.join("outside");
    fs::write(&target, b"outside").unwrap();
    fs::create_dir(work(&database_root)).unwrap();
    fs::set_permissions(work(&database_root), fs::Permissions::from_mode(0o700)).unwrap();
    std::os::unix::fs::symlink(&target, work(&database_root).join("control.sqlite3")).unwrap();
    assert_eq!(
        SecuredRoot::open(database_root.0.to_str().unwrap())
            .err()
            .unwrap(),
        "CONTROL_CHILD_TYPE_INVALID"
    );
    let artifact_root = TestRoot::new();
    let admitted = fixture("plain.txt");
    let mut store = QualificationStore::open(secured(&artifact_root)).unwrap();
    let artifact_outside = TestRoot::new();
    let outside_file = artifact_outside.0.join("outside-file");
    fs::write(&outside_file, b"outside").unwrap();
    std::os::unix::fs::symlink(
        &outside_file,
        work(&artifact_root)
            .join("objects")
            .join(&admitted.proof.capture_digest),
    )
    .unwrap();
    assert_eq!(
        store.qualify_fixture(&admitted).unwrap_err(),
        "RECOVERY_OBJECT_TYPE_INVALID"
    );
    assert_eq!(fs::read(outside_file).unwrap(), b"outside");
}

#[test]
fn existing_private_subtree_must_remain_mode_0700() {
    let root = TestRoot::new();
    drop(secured(&root));
    fs::set_permissions(work(&root), fs::Permissions::from_mode(0o755)).unwrap();

    assert_eq!(
        SecuredRoot::open(root.0.to_str().unwrap()).err().unwrap(),
        "CONTROL_PRIVATE_MODE_INVALID"
    );
}

#[test]
fn operator_root_preconditions_fail_closed() {
    let absent = TestRoot::new();
    fs::remove_dir(&absent.0).unwrap();
    assert_eq!(
        SecuredRoot::open(absent.0.to_str().unwrap()).err().unwrap(),
        "CONTROL_ROOT_NOT_FOUND"
    );

    let permissive = TestRoot::new();
    fs::set_permissions(&permissive.0, fs::Permissions::from_mode(0o755)).unwrap();
    assert_eq!(
        SecuredRoot::open(permissive.0.to_str().unwrap())
            .err()
            .unwrap(),
        "CONTROL_ROOT_MODE_INVALID"
    );

    let owned = TestRoot::new();
    let metadata = fs::metadata(&owned.0).unwrap();
    assert_eq!(
        validate_operator_root(&metadata, metadata.uid().wrapping_add(1)).unwrap_err(),
        "CONTROL_ROOT_OWNER_INVALID"
    );

    let source = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(Path::parent)
        .and_then(Path::parent)
        .unwrap();
    assert_eq!(
        SecuredRoot::open(source.to_str().unwrap()).err().unwrap(),
        "CONTROL_ROOT_IN_SOURCE_TREE"
    );

    let file_parent = TestRoot::new();
    let file = file_parent.0.join("not-a-directory");
    fs::write(&file, b"file").unwrap();
    assert_eq!(
        SecuredRoot::open(file.to_str().unwrap()).err().unwrap(),
        "CONTROL_ROOT_TYPE_INVALID"
    );

    let symlink_parent = TestRoot::new();
    let symlink = symlink_parent.0.join("linked-root");
    std::os::unix::fs::symlink(&owned.0, &symlink).unwrap();
    assert_eq!(
        SecuredRoot::open(symlink.to_str().unwrap()).err().unwrap(),
        "CONTROL_PATH_SYMLINK"
    );

    let traversal = owned.0.join("..").join(owned.0.file_name().unwrap());
    assert_eq!(
        SecuredRoot::open(traversal.to_str().unwrap())
            .err()
            .unwrap(),
        "CONTROL_PATH_TRAVERSAL"
    );
}

#[test]
fn excluded_namespace_mutations_are_detected_without_recovery_claims() {
    for target in [
        "private",
        "objects",
        "records",
        "control.sqlite3",
        "control.sqlite3-wal",
        "control.sqlite3-shm",
    ] {
        let root = TestRoot::new();
        let store = QualificationStore::open(secured(&root)).unwrap();
        let source = if target == "private" {
            work(&root)
        } else {
            work(&root).join(target)
        };
        let moved = root.0.join(format!("mutated-{target}"));
        fs::rename(source, moved).unwrap();
        assert!(
            store.reconcile().is_err(),
            "mutation was not detected: {target}"
        );
    }
}

#[test]
fn stable_namespace_failed_invocation_removes_only_its_created_state() {
    let root = TestRoot::new();
    let admitted = fixture("plain.txt");
    let mut forged = admitted;
    forged.proof.proof_digest = "0".repeat(64);
    let mut store = QualificationStore::open(secured(&root)).unwrap();
    assert_eq!(
        store.qualify_fixture(&forged).unwrap_err(),
        "CAPTURE_PROOF_INVALID"
    );
    store.abort_invocation().unwrap();
    assert!(!work(&root).exists());
    assert!(root.0.is_dir());
}

#[test]
fn failed_invocation_preserves_every_preexisting_valid_artifact() {
    let root = TestRoot::new();
    let admitted = fixture("plain.txt");
    let object = work(&root)
        .join("objects")
        .join(&admitted.proof.capture_digest);
    let record = work(&root)
        .join("records")
        .join(format!("capture-{}.warc", admitted.proof.capture_digest));

    let mut first = QualificationStore::open(secured(&root)).unwrap();
    first.qualify_fixture(&admitted).unwrap();
    first.commit_invocation();
    drop(first);
    let object_before = fs::read(&object).unwrap();
    let record_before = fs::read(&record).unwrap();

    let mut forged = admitted;
    forged.proof.proof_digest = "0".repeat(64);
    let mut second = QualificationStore::open(secured(&root)).unwrap();
    assert_eq!(
        second.qualify_fixture(&forged).unwrap_err(),
        "CAPTURE_PROOF_INVALID"
    );
    second.abort_invocation().unwrap();

    assert_eq!(fs::read(object).unwrap(), object_before);
    assert_eq!(fs::read(record).unwrap(), record_before);
    assert!(work(&root).join("control.sqlite3").is_file());
}

#[test]
fn manifest_and_explicit_simulated_proof_are_exact_and_capture_bound() {
    let admitted = fixture("static.html");
    assert_eq!(digest(&admitted.body), admitted.proof.capture_digest);
    let base = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("fixtures/owned-web-qualification/v1");
    assert_eq!(
        admit_fixture(&base.join("README.md"), &base.join("static.proof"))
            .err()
            .unwrap(),
        "CAPTURE_FIXTURE_NOT_MANIFESTED"
    );
    assert_eq!(
        admit_fixture(&base.join("static.html"), &base.join("plain.proof"))
            .err()
            .unwrap(),
        "CAPTURE_FIXTURE_MANIFEST_INVALID"
    );
    let root = TestRoot::new();
    let mut store = QualificationStore::open(secured(&root)).unwrap();
    let mut forged = admitted;
    forged.proof.proof_digest = "0".repeat(64);
    assert_eq!(
        store.qualify_fixture(&forged).unwrap_err(),
        "CAPTURE_PROOF_INVALID"
    );
    assert_eq!(store.test_count("captures"), 0);
}

#[test]
fn bundled_sqlite_warc_reconciliation_and_exact_replay_validate_all_digests() {
    let root = TestRoot::new();
    let mut store = QualificationStore::open(secured(&root)).unwrap();
    let admitted = fixture("static.html");
    store.qualify_fixture(&admitted).unwrap();
    store.qualify_fixture(&admitted).unwrap();
    assert_eq!(store.test_count("events"), 1);
    let passage = format!(
        "passage-{}",
        digest(
            extract(&admitted.media_type, &admitted.body)
                .unwrap()
                .text
                .as_bytes()
        )
    );
    let (text, start, end, _) = store.passage(&passage).unwrap().unwrap();
    assert_eq!(
        &text.as_bytes()[start as usize..end as usize],
        text.as_bytes()
    );
    drop(store);
    let object = work(&root)
        .join("objects")
        .join(&admitted.proof.capture_digest);
    fs::write(&object, b"corrupt").unwrap();
    assert_eq!(
        QualificationStore::open(secured(&root)).err().unwrap(),
        "RECOVERY_CAS_DIGEST_MISMATCH"
    );
}

#[test]
fn injected_materialization_failure_rolls_back_event_views_artifacts_and_receipt() {
    let root = TestRoot::new();
    let admitted = fixture("plain.txt");
    let object = work(&root)
        .join("objects")
        .join(&admitted.proof.capture_digest);
    let record = work(&root)
        .join("records")
        .join(format!("capture-{}.warc", admitted.proof.capture_digest));
    let mut setup = QualificationStore::open(secured(&root)).unwrap();
    setup.commit_invocation();
    drop(setup);

    let mut store = QualificationStore::open(secured(&root)).unwrap();
    store.test_fail_after_event_insert();

    assert_eq!(
        store.qualify_fixture(&admitted).unwrap_err(),
        "TEST_CAPTURE_MATERIALIZATION_FAULT"
    );
    for table in ["events", "captures", "representations", "passages"] {
        assert_eq!(store.test_count(table), 0, "rollback retained {table}");
    }
    assert_eq!(store.test_receipt_count(&admitted.proof.receipt_id), 0);
    assert!(!object.exists());
    assert!(!record.exists());
    store.abort_invocation().unwrap();

    let mut retry = QualificationStore::open(secured(&root)).unwrap();
    retry.qualify_fixture(&admitted).unwrap();
    retry.reconcile().unwrap();
    for table in ["events", "captures", "representations", "passages"] {
        assert_eq!(retry.test_count(table), 1, "clean retry missed {table}");
    }
    assert_eq!(retry.test_receipt_count(&admitted.proof.receipt_id), 1);
    assert!(object.is_file());
    assert!(record.is_file());
    retry.commit_invocation();
}

#[test]
fn warc_and_representation_corruption_fail_before_replay() {
    let root = TestRoot::new();
    let admitted = fixture("plain.txt");
    let mut store = QualificationStore::open(secured(&root)).unwrap();
    store.qualify_fixture(&admitted).unwrap();
    drop(store);
    let warc = work(&root)
        .join("records")
        .join(format!("capture-{}.warc", admitted.proof.capture_digest));
    let mut bytes = fs::read(&warc).unwrap();
    bytes.push(b'x');
    fs::write(&warc, bytes).unwrap();
    assert_eq!(
        QualificationStore::open(secured(&root)).err().unwrap(),
        "RECOVERY_WARC_INVALID"
    );
}

#[test]
fn representation_passage_and_receipt_corruption_fail_reconciliation() {
    let representation_root = TestRoot::new();
    let admitted = fixture("plain.txt");
    let mut store = QualificationStore::open(secured(&representation_root)).unwrap();
    store.qualify_fixture(&admitted).unwrap();
    store
        .test_execute("UPDATE representations SET text='tampered';")
        .unwrap();
    assert_eq!(
        store.reconcile().unwrap_err(),
        "RECOVERY_REPRESENTATION_INVALID"
    );
    let passage_root = TestRoot::new();
    let mut store = QualificationStore::open(secured(&passage_root)).unwrap();
    store.qualify_fixture(&admitted).unwrap();
    store
        .test_execute("UPDATE passages SET end_byte=end_byte+1;")
        .unwrap();
    assert_eq!(store.reconcile().unwrap_err(), "RECOVERY_PASSAGE_INVALID");
    let receipt_root = TestRoot::new();
    let mut store = QualificationStore::open(secured(&receipt_root)).unwrap();
    store.qualify_fixture(&admitted).unwrap();
    store
        .test_execute("UPDATE captures SET receipt_id='tampered-receipt';")
        .unwrap();
    assert_eq!(store.reconcile().unwrap_err(), "CAPTURE_PROOF_INVALID");
}

#[test]
fn bidirectional_reconciliation_rejects_surplus_and_missing_rows() {
    let admitted = fixture("plain.txt");
    let surplus = TestRoot::new();
    let mut store = QualificationStore::open(secured(&surplus)).unwrap();
    store.qualify_fixture(&admitted).unwrap();
    let capture = format!("capture-{}", admitted.proof.capture_digest);
    store.test_execute(&format!("INSERT INTO representations VALUES('surplus-representation','{capture}','{}','surplus');",digest(b"surplus"))).unwrap();
    assert_eq!(
        store.reconcile().unwrap_err(),
        "RECOVERY_CARDINALITY_INVALID"
    );
    let missing = TestRoot::new();
    let mut store = QualificationStore::open(secured(&missing)).unwrap();
    store.qualify_fixture(&admitted).unwrap();
    store.test_execute("DELETE FROM passages;").unwrap();
    assert_eq!(store.reconcile().unwrap_err(), "RECOVERY_PASSAGE_INVALID");
    let event = TestRoot::new();
    let store = QualificationStore::open(secured(&event)).unwrap();
    let payload = "URL_DISCOVERED|orphan-url|DISCOVERED";
    store.test_execute(&format!("INSERT INTO events VALUES('orphan-event','URL_DISCOVERED','orphan-url',1,'{payload}','{}');",digest(payload.as_bytes()))).unwrap();
    assert_eq!(
        store.reconcile().unwrap_err(),
        "RECOVERY_CARDINALITY_INVALID"
    );
}

#[test]
fn migration_rejects_unknown_version_and_schema_tampering() {
    let root = TestRoot::new();
    let store = QualificationStore::open(secured(&root)).unwrap();
    store.test_execute("PRAGMA user_version=99;").unwrap();
    drop(store);
    assert_eq!(
        QualificationStore::open(secured(&root)).err().unwrap(),
        "CONTROL_SCHEMA_VERSION_UNSUPPORTED"
    );
    let other = TestRoot::new();
    let store = QualificationStore::open(secured(&other)).unwrap();
    store.test_execute("DROP VIEW eligible_passages; CREATE VIEW eligible_passages AS SELECT passage_id,representation_id,start_byte,end_byte,selector,'' AS text FROM passages;").unwrap();
    store.test_accept_live_schema_digest().unwrap();
    drop(store);
    assert_eq!(
        QualificationStore::open(secured(&other)).err().unwrap(),
        "CONTROL_SCHEMA_DEFINITION_INVALID"
    );
}

#[test]
fn tombstone_join_prevents_resurrection_and_frontier_is_closed_and_replay_safe() {
    let root = TestRoot::new();
    let admitted = fixture("plain.txt");
    let mut store = QualificationStore::open(secured(&root)).unwrap();
    store.tombstone(&admitted.relative_path).unwrap();
    assert_eq!(
        store.qualify_fixture(&admitted).unwrap_err(),
        "CAPTURE_TOMBSTONED"
    );
    assert_eq!(store.test_count("captures"), 0);
    let live_root = TestRoot::new();
    let mut live = QualificationStore::open(secured(&live_root)).unwrap();
    live.qualify_fixture(&admitted).unwrap();
    let passage = format!("passage-{}", digest(&admitted.body));
    assert!(live.passage(&passage).unwrap().is_some());
    live.tombstone(&admitted.relative_path).unwrap();
    assert!(live.passage(&passage).unwrap().is_none());
    live.tombstone(&admitted.relative_path).unwrap();
    assert_eq!(
        live.test_execute("DELETE FROM tombstones;").unwrap_err(),
        "TEST_SQL_FAILED"
    );
    assert_eq!(
        live.test_execute("UPDATE tombstones SET head_ref='changed';")
            .unwrap_err(),
        "TEST_SQL_FAILED"
    );
    assert_eq!(
        live.test_execute("INSERT INTO tombstones VALUES('surplus','id','head');")
            .unwrap_err(),
        "TEST_SQL_FAILED"
    );
    assert!(live.passage(&passage).unwrap().is_none());
    assert_eq!(
        live.qualify_fixture(&admitted).unwrap_err(),
        "CAPTURE_TOMBSTONED"
    );
    store.discover("url-1").unwrap();
    store.discover("url-1").unwrap();
    assert_eq!(
        store.claim("url-1", "lease").unwrap_err(),
        "CONTROL_ILLEGAL_TRANSITION"
    );
    store.eligible("url-1").unwrap();
    store.eligible("url-1").unwrap();
    let fence = store.claim("url-1", "lease").unwrap();
    assert_eq!(store.claim("url-1", "lease").unwrap(), fence);
    assert_eq!(
        store.settle("url-1", fence).unwrap_err(),
        "CONTROL_ILLEGAL_TRANSITION"
    );
    store.start("url-1", fence).unwrap();
    store.settle("url-1", fence).unwrap();
    store.discover("url-2").unwrap();
    store.eligible("url-2").unwrap();
    let second = store.claim("url-2", "reused-lease").unwrap();
    store.expire("url-2", second).unwrap();
    assert_eq!(
        store.claim("url-2", "reused-lease").unwrap_err(),
        "CONTROL_EVENT_COLLISION"
    );
}

#[test]
fn two_immediate_claim_transactions_cannot_overlap() {
    use std::sync::{Arc, Barrier};
    let root = TestRoot::new();
    {
        let mut store = QualificationStore::open(secured(&root)).unwrap();
        for index in 0..8 {
            let url = format!("race-url-{index}");
            store.discover(&url).unwrap();
            store.eligible(&url).unwrap();
        }
    }
    for index in 0..8 {
        let barrier = Arc::new(Barrier::new(2));
        let mut handles = Vec::new();
        for suffix in ["a", "b"] {
            let path = root.0.clone();
            let barrier = barrier.clone();
            handles.push(std::thread::spawn(move || {
                let secured = SecuredRoot::open(path.to_str().unwrap()).unwrap();
                let mut store = QualificationStore::open(secured).unwrap();
                barrier.wait();
                store.claim(
                    &format!("race-url-{index}"),
                    &format!("lease-{index}-{suffix}"),
                )
            }));
        }
        let results: Vec<_> = handles
            .into_iter()
            .map(|handle| handle.join().unwrap())
            .collect();
        assert_eq!(results.iter().filter(|result| result.is_ok()).count(), 1);
        assert_eq!(
            results
                .iter()
                .filter(|result| matches!(result, Err("CONTROL_ILLEGAL_TRANSITION")))
                .count(),
            1
        );
    }
    let store = QualificationStore::open(secured(&root)).unwrap();
    assert_eq!(store.test_count("leases"), 8);
}

#[test]
fn proof_nonce_or_receipt_reuse_for_another_capture_fails() {
    let root = TestRoot::new();
    let mut store = QualificationStore::open(secured(&root)).unwrap();
    let first = fixture("plain.txt");
    store.qualify_fixture(&first).unwrap();
    let mut second = fixture("static.html");
    second.proof.nonce = first.proof.nonce.clone();
    second.proof.receipt_id = first.proof.receipt_id.clone();
    let canonical = format!(
        "{}|{}|{}|{}|{}",
        second.proof.capture_digest,
        second.proof.receipt_id,
        second.proof.anchor_ref,
        second.proof.authority_ref,
        second.proof.nonce
    );
    second.proof.proof_digest = digest(canonical.as_bytes());
    assert_eq!(
        store.qualify_fixture(&second).unwrap_err(),
        "CAPTURE_PROOF_REUSED"
    );
}

#[test]
fn static_extraction_remains_networkless_utf8_and_active_content_closed() {
    assert_eq!(
        extract("text/html", b"<body>x<script>fetch('/x')</script></body>").unwrap_err(),
        "EXTRACT_ACTIVE_CONTENT_REJECTED"
    );
    assert_eq!(
        extract("text/plain", &[0xff]).unwrap_err(),
        "EXTRACT_UTF8_REQUIRED"
    );
    assert_eq!(
        extract("application/xml", b"<x/>").unwrap_err(),
        "MIME_UNSUPPORTED"
    );
}

#[test]
fn sha256_vector() {
    assert_eq!(
        digest(b"abc"),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
}
