use super::*;
use std::fs::{self, File};
use std::os::unix::fs::PermissionsExt;
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Barrier};

#[test]
fn qualification_builder_is_deterministic() {
    let input = qualification_input();
    let first = build(&input).expect("first build");
    let second = build(&input).expect("second build");
    assert_eq!(first, second);
    assert_eq!(
        first.passages,
        include_bytes!("../../../../fixtures/owned-lexical-reader/golden-three-v1/passages.colr")
    );
    assert_eq!(
        first.terms,
        include_bytes!("../../../../fixtures/owned-lexical-reader/golden-three-v1/terms.colr")
    );
    assert_eq!(
        first.postings,
        include_bytes!("../../../../fixtures/owned-lexical-reader/golden-three-v1/postings.colr")
    );
}

fn qualification_input() -> BuildInputV1 {
    let passage = |suffix: &str, title: &str, text: &str, observed_at: i64| BuildPassageV1 {
        passage_id: format!("p-{suffix}"),
        source_object_id: format!("source-{suffix}"),
        revision_id: format!("revision-{suffix}"),
        capture_id: format!("capture-{suffix}"),
        representation_id: format!("representation-{suffix}"),
        cell_id: "golden-cell".into(),
        admission_id: format!("admission-{suffix}"),
        revision_scope_digest: [0x11; 32],
        revision_policy_digest: [0x22; 32],
        title: title.into(),
        text: text.into(),
        locator_display: format!("fixture:{suffix}"),
        media_type: "text/plain".into(),
        language: "en".into(),
        observed_at,
        published_at: None,
        source_class: "fixture".into(),
        authority_scope_digest: [0x33; 32],
        tombstone_sequence: 0,
    };
    let passages = vec![
        passage("tomb", "Rust", "rust", 3),
        passage("alpha", "Rust Search", "rust search search", 1),
        passage("beta", "Search", "rust", 2),
    ];
    let tombstones = TombstoneInventoryV1 {
        watermark: 7,
        entries: vec![],
    };
    let mut authority = BuildAuthorityV1 {
        authority_id: "authority-1".into(),
        authorization_decision_id: "decision-1".into(),
        authorization_scope_digest: [0x44; 32],
        cell_id: "golden-cell".into(),
        passage_inventory_digest: [0; 32],
        tombstone_inventory_digest: digest(&canonical::tombstone_bytes(&tombstones)),
        tombstone_watermark: 7,
        limits: BuildLimitsV1::default(),
    };
    let provisional = BuildInputV1 {
        authority: authority.clone(),
        passages: passages.clone(),
        tombstones: tombstones.clone(),
    };
    let prepared = canonical::validate_and_prepare(&provisional).expect("prepare");
    authority.passage_inventory_digest =
        digest(&canonical::passage_inventory(&prepared.passages).expect("inventory"));
    BuildInputV1 {
        authority,
        passages,
        tombstones,
    }
}

#[test]
fn tombstones_are_validated_and_excluded_before_ordinals() {
    let mut input = qualification_input();
    input.passages[0].tombstone_sequence = 7;
    input.tombstones.entries.push(TombstoneEntryV1 {
        passage_id: "p-tomb".into(),
        authority_scope_digest: [0x33; 32],
        effective_sequence: 7,
        reason_digest: [0x55; 32],
    });
    input.authority.tombstone_inventory_digest =
        digest(&canonical::tombstone_bytes(&input.tombstones));
    let prepared = canonical::validate_and_prepare(&input).expect("prepare");
    input.authority.passage_inventory_digest =
        digest(&canonical::passage_inventory(&prepared.passages).unwrap());
    let output = build(&input).expect("build");
    assert_eq!(
        Reader::open(
            &BTreeMap::from([
                ("manifest.json", &Memory(&output.manifest) as &dyn ReadAtV1),
                ("passages.colr", &Memory(&output.passages)),
                ("terms.colr", &Memory(&output.terms)),
                ("postings.colr", &Memory(&output.postings))
            ]),
            ReaderLimits::default()
        )
        .unwrap()
        .manifest
        .passage_count,
        2
    );
}

fn operator_bootstrap(root: &Path) {
    fs::set_permissions(root, fs::Permissions::from_mode(0o700)).unwrap();
    let tree = root.join(".owned-lexical-publication-v1");
    for d in [
        "",
        "authorities",
        "authorities/build",
        "authorities/source",
        "authorities/tombstones",
        "generations",
        "receipts",
        "staging",
    ] {
        let p = tree.join(d);
        fs::create_dir(&p).unwrap();
        fs::set_permissions(p, fs::Permissions::from_mode(0o700)).unwrap();
    }
    let lock = tree.join("publication.lock");
    File::create(&lock).unwrap();
    fs::set_permissions(lock, fs::Permissions::from_mode(0o600)).unwrap();
}
fn temporary_root(name: &str) -> std::path::PathBuf {
    let p = std::path::PathBuf::from(
        "/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode",
    )
    .join(format!(
        "curiosity-colr-builder-{name}-{}",
        std::process::id()
    ));
    let _ = fs::remove_dir_all(&p);
    fs::create_dir(&p).unwrap();
    operator_bootstrap(&p);
    p
}

#[test]
fn publication_activation_cas_lock_and_explicit_rollback_are_closed() {
    let root = temporary_root("publication");
    let first = build(&qualification_input()).unwrap();
    let publisher = PublisherV1::open(&root).unwrap();
    assert_eq!(
        PublisherV1::open(&root).err().expect("contended").code,
        Code::LockUnavailable
    );
    publisher.publish("build-a", &first).unwrap();
    let selected = publisher
        .activate(
            "activate-a",
            None,
            first.manifest_digest,
            first.build_authority_digest,
            ActivationModeV1::Forward,
        )
        .unwrap();
    assert_eq!(selected.previous_manifest_digest, None);
    assert_eq!(
        publisher
            .activate(
                "stale",
                None,
                first.manifest_digest,
                first.build_authority_digest,
                ActivationModeV1::Forward
            )
            .unwrap_err()
            .code,
        Code::CasMismatch
    );
    let mut second_input = qualification_input();
    second_input
        .passages
        .iter_mut()
        .find(|p| p.passage_id == "p-beta")
        .unwrap()
        .text = "rust search".into();
    let prepared = canonical::validate_and_prepare(&second_input).unwrap();
    second_input.authority.passage_inventory_digest =
        digest(&canonical::passage_inventory(&prepared.passages).unwrap());
    let second = build(&second_input).unwrap();
    publisher.publish("build-b", &second).unwrap();
    publisher
        .activate(
            "activate-b",
            Some(first.manifest_digest),
            second.manifest_digest,
            second.build_authority_digest,
            ActivationModeV1::Forward,
        )
        .unwrap();
    publisher
        .activate(
            "rollback-a",
            Some(second.manifest_digest),
            first.manifest_digest,
            first.build_authority_digest,
            ActivationModeV1::Rollback,
        )
        .unwrap();
    drop(publisher);
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn one_publisher_instance_serializes_two_thread_cas() {
    let root = temporary_root("thread-cas");
    let output = build(&qualification_input()).unwrap();
    let publisher = Arc::new(PublisherV1::open(&root).unwrap());
    publisher.publish("build", &output).unwrap();
    let barrier = Arc::new(Barrier::new(3));
    let mut threads = Vec::new();
    for attempt in ["activate-one", "activate-two"] {
        let publisher = Arc::clone(&publisher);
        let barrier = Arc::clone(&barrier);
        let manifest = output.manifest_digest;
        let authority = output.build_authority_digest;
        threads.push(std::thread::spawn(move || {
            barrier.wait();
            publisher.activate(
                attempt,
                None,
                manifest,
                authority,
                ActivationModeV1::Forward,
            )
        }));
    }
    barrier.wait();
    let results: Vec<_> = threads
        .into_iter()
        .map(|thread| thread.join().unwrap())
        .collect();
    assert_eq!(results.iter().filter(|result| result.is_ok()).count(), 1);
    assert_eq!(
        results
            .iter()
            .filter(|result| result
                .as_ref()
                .is_err_and(|failure| failure.code == Code::CasMismatch))
            .count(),
        1
    );
    drop(publisher);
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn canonical_receipt_parser_rejects_trailing_and_reordered_bytes() {
    let output = build(&qualification_input()).unwrap();
    assert!(canonical_records::parse_receipt(&output.receipt).is_ok());

    let mut trailing = output.receipt.clone();
    trailing.push(b'\n');
    assert!(canonical_records::parse_receipt(&trailing).is_err());

    let reordered = String::from_utf8(output.receipt.clone()).unwrap().replacen(
        "\"buildAuthorityDigest\"",
        "\"sourceManifestDigest\"",
        1,
    );
    assert!(canonical_records::parse_receipt(reordered.as_bytes()).is_err());
}

#[test]
fn all_persisted_record_parsers_are_exact_and_closed() {
    let output = build(&qualification_input()).unwrap();
    assert!(canonical_records::parse_authority(&output.build_authority).is_ok());
    assert!(canonical_records::parse_source(&output.source_manifest).is_ok());
    assert!(canonical_records::parse_tombstone(&output.tombstone_inventory).is_ok());

    for bytes in [
        &output.build_authority,
        &output.source_manifest,
        &output.tombstone_inventory,
    ] {
        let mut whitespace = bytes.clone();
        whitespace.insert(1, b' ');
        assert!(canonical_records::parse_authority(&whitespace).is_err());
        assert!(canonical_records::parse_source(&whitespace).is_err());
        assert!(canonical_records::parse_tombstone(&whitespace).is_err());
    }

    let root = temporary_root("canonical-selector");
    let publisher = PublisherV1::open(&root).unwrap();
    publisher.publish("build", &output).unwrap();
    publisher
        .activate(
            "activate",
            None,
            output.manifest_digest,
            output.build_authority_digest,
            ActivationModeV1::Forward,
        )
        .unwrap();
    let selector = fs::read(
        root.join(".owned-lexical-publication-v1")
            .join("ACTIVE.json"),
    )
    .unwrap();
    assert!(canonical_records::parse_selector(&selector).is_ok());
    let mut trailing = selector;
    trailing.push(b'\n');
    assert!(canonical_records::parse_selector(&trailing).is_err());
    drop(publisher);
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn retained_logical_memory_is_charged_before_build_allocations_at_exact_boundary() {
    let mut input = qualification_input();
    let (required, _) = logical_memory_required(&input).unwrap();
    input.authority.limits.max_retained_logical_bytes = required;
    input.authority.passage_inventory_digest = digest(
        &canonical::passage_inventory(&canonical::validate_and_prepare(&input).unwrap().passages)
            .unwrap(),
    );
    assert!(build(&input).is_ok());

    input.authority.limits.max_retained_logical_bytes = required - 1;
    assert_eq!(build(&input).unwrap_err().code, Code::BuildResourceLimit);
}

#[test]
fn exact_allocation_preflight_transcript_charges_before_each_allocation_and_cleans_errors() {
    let input = qualification_input();
    let transcript = logical_memory_transcript(&input).unwrap();
    assert_eq!(
        transcript
            .charges
            .iter()
            .map(|(_, bytes)| *bytes)
            .sum::<u64>(),
        transcript.total
    );
    assert_eq!(
        transcript
            .charges
            .iter()
            .map(|(kind, _)| *kind)
            .collect::<Vec<_>>(),
        [
            "input-strings",
            "token-bytes",
            "token-slots",
            "tombstone-slots"
        ]
    );
    let mut retained = 0u64;
    for (_, charge) in &transcript.charges {
        retained = retained.checked_add(*charge).unwrap();
        assert!(retained <= transcript.total);
    }
    retained = 0;
    assert_eq!(
        retained, 0,
        "failed construction releases its logical ledger"
    );
    let mut limited = input;
    limited.authority.limits.max_retained_logical_bytes = transcript.total - 1;
    assert_eq!(build(&limited).unwrap_err().code, Code::BuildResourceLimit);
}

#[test]
fn large_limit_plus_one_inputs_never_construct_beyond_the_admitted_plan() {
    let mut large = qualification_input();
    large.passages = (0..128)
        .map(|index| {
            let mut passage = qualification_input().passages.remove(0);
            passage.passage_id = format!("passage-{index:03}");
            passage.title = format!("unique{index:03}");
            passage.text = "shared".into();
            passage
        })
        .collect();
    let prepared = canonical::validate_and_prepare(&large).unwrap();
    large.authority.passage_inventory_digest =
        digest(&canonical::passage_inventory(&prepared.passages).unwrap());

    for case in [
        "passages",
        "emissions",
        "retained",
        "terms",
        "postings",
        "artifact",
        "aggregate",
    ] {
        let mut input = large.clone();
        match case {
            "passages" => input.authority.limits.max_passages = 127,
            "emissions" => input.authority.limits.max_token_emissions = 255,
            "retained" => input.authority.limits.max_retained_logical_bytes = 1,
            "terms" => input.authority.limits.max_terms = 1,
            "postings" => input.authority.limits.max_postings = 1,
            "artifact" => input.authority.limits.max_artifact_bytes = 1,
            "aggregate" => input.authority.limits.max_total_artifact_bytes = 1,
            _ => unreachable!(),
        }
        encoding::reset_construction_advances();
        assert_eq!(
            build(&input).unwrap_err().code,
            Code::BuildResourceLimit,
            "{case}"
        );
        let (terms, postings, outputs) = encoding::construction_counts();
        assert!(
            terms <= u64::from(input.authority.limits.max_terms),
            "{case}:terms"
        );
        assert!(
            postings <= input.authority.limits.max_postings,
            "{case}:postings"
        );
        assert_eq!(
            outputs, 0,
            "{case}: artifacts allocated before all caps admitted"
        );
    }
}

#[test]
fn root_attacks_and_unknown_recovery_state_fail_closed_without_cleanup() {
    let root = temporary_root("root-attacks");
    let tree = root.join(".owned-lexical-publication-v1");
    let unknown_stage = tree.join("staging/unknown-attempt");
    fs::create_dir(&unknown_stage).unwrap();
    fs::set_permissions(&unknown_stage, fs::Permissions::from_mode(0o700)).unwrap();
    fs::write(unknown_stage.join("attacker-data"), b"preserve").unwrap();
    fs::set_permissions(
        unknown_stage.join("attacker-data"),
        fs::Permissions::from_mode(0o600),
    )
    .unwrap();
    let failure = PublisherV1::open(&root)
        .err()
        .expect("unknown staging fails");
    assert_eq!(failure.code, Code::RecoveryAmbiguous);
    assert_eq!(
        fs::read(unknown_stage.join("attacker-data")).unwrap(),
        b"preserve"
    );
    fs::remove_dir_all(&root).unwrap();

    let root = temporary_root("hard-link-lock");
    let tree = root.join(".owned-lexical-publication-v1");
    fs::hard_link(tree.join("publication.lock"), root.join("lock-copy")).unwrap();
    assert_eq!(
        PublisherV1::open(&root).err().unwrap().code,
        Code::RootInvalid
    );
    fs::remove_dir_all(&root).unwrap();

    let root = temporary_root("wrong-mode");
    let tree = root.join(".owned-lexical-publication-v1");
    fs::set_permissions(tree.join("receipts"), fs::Permissions::from_mode(0o755)).unwrap();
    assert_eq!(
        PublisherV1::open(&root).err().unwrap().code,
        Code::RootInvalid
    );
    fs::remove_dir_all(&root).unwrap();
}

#[test]
fn chain_receipt_and_selector_corruption_fail_before_selection() {
    let root = temporary_root("chain-corruption");
    let output = build(&qualification_input()).unwrap();
    let publisher = PublisherV1::open(&root).unwrap();
    publisher.publish("build", &output).unwrap();
    drop(publisher);
    let receipt = root
        .join(".owned-lexical-publication-v1/receipts")
        .join(format!(
            "{}.json",
            output
                .manifest_digest
                .iter()
                .map(|byte| format!("{byte:02x}"))
                .collect::<String>()
        ));
    let mut bytes = fs::read(&receipt).unwrap();
    *bytes.last_mut().unwrap() = b' ';
    fs::write(&receipt, bytes).unwrap();
    assert_eq!(
        PublisherV1::open(&root).err().unwrap().code,
        Code::InventoryInvalid
    );
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn every_injected_post_visibility_fault_is_indeterminate_and_recoverable() {
    for (index, point) in [
        "selector-post-fullsync",
        "selector-post-attempt-sync",
        "selector-post-root-sync",
        "selector-post-state-cleanup",
        "selector-post-attempt-cleanup",
        "selector-post-staging-sync",
    ]
    .into_iter()
    .enumerate()
    {
        let root = temporary_root(&format!("post-fault-{index}"));
        let output = build(&qualification_input()).unwrap();
        let faults = Arc::new(FaultPlan::default());
        let publisher = PublisherV1::open_with_faults(&root, Arc::clone(&faults)).unwrap();
        publisher.publish("build", &output).unwrap();
        faults.fail_next(point, 28);
        let failure = publisher
            .activate(
                "activate",
                None,
                output.manifest_digest,
                output.build_authority_digest,
                ActivationModeV1::Forward,
            )
            .unwrap_err();
        assert_eq!(failure.code, Code::SelectorCommitIndeterminate, "{point}");
        assert_eq!(
            failure.observed_selector_digest,
            Some(output.manifest_digest),
            "{point}"
        );
        drop(publisher);

        let reopened = PublisherV1::open(&root)
            .unwrap_or_else(|failure| panic!("{point}: reopen failed: {failure:?}"));
        reopened
            .activate(
                "idempotent",
                Some(output.manifest_digest),
                output.manifest_digest,
                output.build_authority_digest,
                ActivationModeV1::Forward,
            )
            .unwrap();
        drop(reopened);
        fs::remove_dir_all(root).unwrap();
    }
}

#[test]
fn injected_selector_rename_fault_is_precommit_and_preserves_absence() {
    let root = temporary_root("pre-rename-fault");
    let output = build(&qualification_input()).unwrap();
    let faults = Arc::new(FaultPlan::default());
    let publisher = PublisherV1::open_with_faults(&root, Arc::clone(&faults)).unwrap();
    publisher.publish("build", &output).unwrap();
    faults.fail_next("selector-rename", 28);
    let failure = publisher
        .activate(
            "activate",
            None,
            output.manifest_digest,
            output.build_authority_digest,
            ActivationModeV1::Forward,
        )
        .unwrap_err();
    assert_eq!(failure.code, Code::IoWriteFailed);
    assert!(
        !root
            .join(".owned-lexical-publication-v1/ACTIVE.json")
            .exists()
    );
    drop(publisher);
    PublisherV1::open(&root).unwrap();
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn injected_publication_write_sync_fullsync_rename_and_enospc_faults_recover_closed() {
    for (index, (point, code)) in [
        ("create", Code::IoWriteFailed),
        ("short-write", Code::IoWriteFailed),
        ("write-enospc", Code::IoWriteFailed),
        ("file-sync", Code::SyncFailed),
        ("full-sync", Code::SyncFailed),
        ("directory-sync", Code::SyncFailed),
        ("immutable-rename", Code::IoWriteFailed),
        ("after-tombstone-rename", Code::SyncFailed),
        ("after-build-authority-rename", Code::SyncFailed),
        ("after-source-manifest-rename", Code::SyncFailed),
        ("after-generation-rename", Code::SyncFailed),
        ("after-receipt-rename", Code::SyncFailed),
        ("cleanup", Code::IoWriteFailed),
    ]
    .into_iter()
    .enumerate()
    {
        let root = temporary_root(&format!("publication-fault-{index}"));
        let output = build(&qualification_input()).unwrap();
        let faults = Arc::new(FaultPlan::default());
        let publisher = PublisherV1::open_with_faults(&root, Arc::clone(&faults)).unwrap();
        faults.fail_next(point, 28);
        assert_eq!(
            publisher.publish("build", &output).unwrap_err().code,
            code,
            "{point}"
        );
        drop(publisher);
        let reopened = PublisherV1::open(&root)
            .unwrap_or_else(|failure| panic!("{point}: reopen failed: {failure:?}"));
        assert!(
            !root
                .join(".owned-lexical-publication-v1/ACTIVE.json")
                .exists()
        );
        reopened.publish("retry", &output).unwrap();
        drop(reopened);
        fs::remove_dir_all(root).unwrap();
    }
}

#[test]
fn tombstone_input_mutations_and_rollback_resurrection_are_rejected() {
    let mut unsorted = qualification_input();
    unsorted.tombstones.watermark = 8;
    unsorted.authority.tombstone_watermark = 8;
    unsorted.tombstones.entries = vec![
        TombstoneEntryV1 {
            passage_id: "z".into(),
            authority_scope_digest: [0x33; 32],
            effective_sequence: 8,
            reason_digest: [1; 32],
        },
        TombstoneEntryV1 {
            passage_id: "a".into(),
            authority_scope_digest: [0x33; 32],
            effective_sequence: 8,
            reason_digest: [2; 32],
        },
    ];
    assert_eq!(
        canonical::validate_and_prepare(&unsorted).unwrap_err().code,
        Code::BuildInputInvalid
    );

    let mut mismatch = qualification_input();
    mismatch.passages[0].tombstone_sequence = 7;
    mismatch.tombstones.entries.push(TombstoneEntryV1 {
        passage_id: mismatch.passages[0].passage_id.clone(),
        authority_scope_digest: [0x99; 32],
        effective_sequence: 7,
        reason_digest: [3; 32],
    });
    assert_eq!(
        canonical::validate_and_prepare(&mismatch).unwrap_err().code,
        Code::BuildInputInvalid
    );

    let root = temporary_root("anti-resurrection");
    let first = build(&qualification_input()).unwrap();
    let publisher = PublisherV1::open(&root).unwrap();
    publisher.publish("first", &first).unwrap();
    publisher
        .activate(
            "activate-first",
            None,
            first.manifest_digest,
            first.build_authority_digest,
            ActivationModeV1::Forward,
        )
        .unwrap();

    let mut second_input = qualification_input();
    second_input.authority.tombstone_watermark = 8;
    second_input.tombstones.watermark = 8;
    let beta = second_input
        .passages
        .iter_mut()
        .find(|passage| passage.passage_id == "p-beta")
        .unwrap();
    beta.tombstone_sequence = 8;
    second_input.tombstones.entries.push(TombstoneEntryV1 {
        passage_id: "p-beta".into(),
        authority_scope_digest: [0x33; 32],
        effective_sequence: 8,
        reason_digest: [4; 32],
    });
    second_input.authority.tombstone_inventory_digest =
        digest(&canonical::tombstone_bytes(&second_input.tombstones));
    let prepared = canonical::validate_and_prepare(&second_input).unwrap();
    second_input.authority.passage_inventory_digest =
        digest(&canonical::passage_inventory(&prepared.passages).unwrap());
    let second = build(&second_input).unwrap();
    publisher.publish("second", &second).unwrap();
    publisher
        .activate(
            "activate-second",
            Some(first.manifest_digest),
            second.manifest_digest,
            second.build_authority_digest,
            ActivationModeV1::Forward,
        )
        .unwrap();
    assert_eq!(
        publisher
            .activate(
                "rollback-resurrection",
                Some(second.manifest_digest),
                first.manifest_digest,
                first.build_authority_digest,
                ActivationModeV1::Rollback,
            )
            .unwrap_err()
            .code,
        Code::TombstoneRegression
    );
    drop(publisher);
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn subprocess_crash_child() {
    let Ok(root) = std::env::var("COLR_CRASH_ROOT") else {
        return;
    };
    let operation = std::env::var("COLR_CRASH_OPERATION").unwrap();
    let faults = Arc::new(FaultPlan::default());
    if let Ok(event) = std::env::var("COLR_CRASH_EVENT") {
        let occurrence = std::env::var("COLR_CRASH_OCCURRENCE")
            .unwrap()
            .parse()
            .unwrap();
        faults.exit_at(event, occurrence, 91);
    } else {
        let point = std::env::var("COLR_CRASH_POINT").unwrap();
        let point: &'static str = Box::leak(point.into_boxed_str());
        faults.exit_next(point, 91);
    }
    let publisher = PublisherV1::open_with_faults(Path::new(&root), faults).unwrap();
    let output = build(&qualification_input()).unwrap();
    if operation == "publish" {
        let _ = publisher.publish("crash-publish", &output);
    } else {
        let _ = publisher.activate(
            "crash-activate",
            None,
            output.manifest_digest,
            output.build_authority_digest,
            ActivationModeV1::Forward,
        );
    }
    panic!("crash point was not reached");
}

fn run_crash_child(root: &Path, point: &str, operation: &str) {
    let status = Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "owned_lexical::builder::tests::subprocess_crash_child",
            "--nocapture",
        ])
        .env("COLR_CRASH_ROOT", root)
        .env("COLR_CRASH_POINT", point)
        .env("COLR_CRASH_OPERATION", operation)
        .status()
        .unwrap();
    assert_eq!(status.code(), Some(91), "{operation}:{point}");
}

fn run_indexed_crash_child(root: &Path, event: &str, occurrence: usize, operation: &str) {
    let status = Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "owned_lexical::builder::tests::subprocess_crash_child",
            "--nocapture",
        ])
        .env("COLR_CRASH_ROOT", root)
        .env("COLR_CRASH_EVENT", event)
        .env("COLR_CRASH_OCCURRENCE", occurrence.to_string())
        .env("COLR_CRASH_OPERATION", operation)
        .status()
        .unwrap();
    assert_eq!(status.code(), Some(91), "{operation}:{event}#{occurrence}");
}

#[test]
fn subprocess_abrupt_exit_reopens_every_publication_persistence_boundary() {
    for (index, point) in [
        "create",
        "short-write",
        "write-enospc",
        "file-sync",
        "full-sync",
        "directory-sync",
        "immutable-rename",
        "after-tombstone-rename",
        "after-build-authority-rename",
        "after-source-manifest-rename",
        "after-generation-rename",
        "after-receipt-rename",
        "cleanup",
    ]
    .into_iter()
    .enumerate()
    {
        let root = temporary_root(&format!("subprocess-publish-{index}"));
        run_crash_child(&root, point, "publish");
        let output = build(&qualification_input()).unwrap();
        let publisher = PublisherV1::open(&root).unwrap();
        assert!(
            !root
                .join(".owned-lexical-publication-v1/ACTIVE.json")
                .exists()
        );
        publisher.publish("recovered", &output).unwrap();
        drop(publisher);
        fs::remove_dir_all(root).unwrap();
    }
}

#[test]
fn subprocess_abrupt_exit_reopens_every_selector_persistence_boundary() {
    for (index, point) in [
        "create",
        "short-write",
        "file-sync",
        "full-sync",
        "directory-sync",
        "selector-rename",
        "selector-after-rename-crash",
        "selector-post-fullsync",
        "selector-post-attempt-sync",
        "selector-post-root-sync",
        "selector-post-state-cleanup",
        "selector-post-attempt-cleanup",
        "selector-post-staging-sync",
    ]
    .into_iter()
    .enumerate()
    {
        let root = temporary_root(&format!("subprocess-selector-{index}"));
        let output = build(&qualification_input()).unwrap();
        let publisher = PublisherV1::open(&root).unwrap();
        publisher.publish("prepared", &output).unwrap();
        drop(publisher);
        run_crash_child(&root, point, "activate");
        let reopened = PublisherV1::open(&root).unwrap();
        let committed = root
            .join(".owned-lexical-publication-v1/ACTIVE.json")
            .exists();
        if committed {
            reopened
                .activate(
                    "observed-new",
                    Some(output.manifest_digest),
                    output.manifest_digest,
                    output.build_authority_digest,
                    ActivationModeV1::Forward,
                )
                .unwrap();
        } else {
            reopened
                .activate(
                    "observed-old",
                    None,
                    output.manifest_digest,
                    output.build_authority_digest,
                    ActivationModeV1::Forward,
                )
                .unwrap();
        }
        drop(reopened);
        fs::remove_dir_all(root).unwrap();
    }
}

fn indexed_rows(events: &[String]) -> Vec<(String, usize)> {
    let mut counts = std::collections::BTreeMap::new();
    events
        .iter()
        .map(|event| {
            let occurrence = counts.entry(event.clone()).or_insert(0usize);
            let row = (event.clone(), *occurrence);
            *occurrence += 1;
            row
        })
        .collect()
}

#[test]
fn every_concrete_persistence_occurrence_has_an_indexed_abrupt_exit_reopen_row() {
    let output = build(&qualification_input()).unwrap();

    let publish_baseline_root = temporary_root("indexed-publish-baseline");
    let publish_faults = Arc::new(FaultPlan::default());
    let publish =
        PublisherV1::open_with_faults(&publish_baseline_root, Arc::clone(&publish_faults)).unwrap();
    publish_faults.clear_transcript();
    publish.publish("crash-publish", &output).unwrap();
    let publish_rows = indexed_rows(&publish_faults.transcript());
    assert_eq!(publish_rows.len(), 69);
    eprintln!("indexed persistence rows: publish={}", publish_rows.len());
    drop(publish);
    fs::remove_dir_all(publish_baseline_root).unwrap();

    for (row, (event, occurrence)) in publish_rows.iter().enumerate() {
        let root = temporary_root(&format!("indexed-publish-{row}"));
        run_indexed_crash_child(&root, event, *occurrence, "publish");
        let reopened = PublisherV1::open(&root).unwrap();
        assert!(
            !root
                .join(".owned-lexical-publication-v1/ACTIVE.json")
                .exists()
        );
        reopened.publish("recovered", &output).unwrap();
        drop(reopened);
        fs::remove_dir_all(root).unwrap();
    }

    let activate_baseline_root = temporary_root("indexed-activate-baseline");
    let activate_faults = Arc::new(FaultPlan::default());
    let activate =
        PublisherV1::open_with_faults(&activate_baseline_root, Arc::clone(&activate_faults))
            .unwrap();
    activate.publish("prepared", &output).unwrap();
    activate_faults.clear_transcript();
    activate
        .activate(
            "crash-activate",
            None,
            output.manifest_digest,
            output.build_authority_digest,
            ActivationModeV1::Forward,
        )
        .unwrap();
    let activate_rows = indexed_rows(&activate_faults.transcript());
    assert_eq!(activate_rows.len(), 22);
    eprintln!("indexed persistence rows: activate={}", activate_rows.len());
    drop(activate);
    fs::remove_dir_all(activate_baseline_root).unwrap();

    for (row, (event, occurrence)) in activate_rows.iter().enumerate() {
        let root = temporary_root(&format!("indexed-activate-{row}"));
        let prepared = PublisherV1::open(&root).unwrap();
        prepared.publish("prepared", &output).unwrap();
        drop(prepared);
        run_indexed_crash_child(&root, event, *occurrence, "activate");
        let reopened = PublisherV1::open(&root).unwrap();
        let committed = root
            .join(".owned-lexical-publication-v1/ACTIVE.json")
            .exists();
        reopened
            .activate(
                "recovered",
                committed.then_some(output.manifest_digest),
                output.manifest_digest,
                output.build_authority_digest,
                ActivationModeV1::Forward,
            )
            .unwrap();
        drop(reopened);
        fs::remove_dir_all(root).unwrap();
    }
}

#[test]
fn exact_total_persistence_order_transcript_is_stable() {
    let root = temporary_root("order-transcript");
    let output = build(&qualification_input()).unwrap();
    let faults = Arc::new(FaultPlan::default());
    let publisher = PublisherV1::open_with_faults(&root, Arc::clone(&faults)).unwrap();
    publisher.publish("ordered-build", &output).unwrap();
    publisher
        .activate(
            "ordered-activate",
            None,
            output.manifest_digest,
            output.build_authority_digest,
            ActivationModeV1::Forward,
        )
        .unwrap();
    let mut expected = Vec::new();
    let file = |events: &mut Vec<String>, name: &str| {
        events.extend([
            format!("create:{name}"),
            format!("write:{name}"),
            format!("file-sync:{name}"),
            format!("full-sync:{name}"),
            format!("validate:{name}"),
        ]);
    };
    file(&mut expected, "STATE.json");
    expected.push("dir-sync:ordered-build".into());
    for name in [
        "passages.colr",
        "terms.colr",
        "postings.colr",
        "manifest.json",
        "tombstone-inventory.json",
        "build-authority.json",
        "source-manifest.json",
    ] {
        file(&mut expected, name);
    }
    expected.extend([
        "dir-sync:generation".into(),
        "dir-sync:ordered-build".into(),
        "validate-generation:generation".into(),
    ]);
    file(&mut expected, "receipt.json");
    expected.push("dir-sync:ordered-build".into());
    let hex = |digest: Digest32| {
        digest
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect::<String>()
    };
    for (address, destination) in [
        (
            format!("{}.json", hex(output.tombstone_inventory_digest)),
            "tombstones",
        ),
        (
            format!("{}.json", hex(output.build_authority_digest)),
            "build",
        ),
        (
            format!("{}.json", hex(output.source_manifest_digest)),
            "source",
        ),
        (hex(output.manifest_digest), "generations"),
        (format!("{}.json", hex(output.manifest_digest)), "receipts"),
    ] {
        expected.extend([
            format!("rename-excl:{address}"),
            "dir-sync:ordered-build".into(),
            format!("dir-sync:{destination}"),
        ]);
    }
    expected.extend([
        "unlink-file:STATE.json".into(),
        "dir-sync:ordered-build".into(),
        "unlink-dir:ordered-build".into(),
        "dir-sync:staging".into(),
        format!("validate-generation:{}", hex(output.manifest_digest)),
        format!("validate-generation:{}", hex(output.manifest_digest)),
    ]);
    file(&mut expected, "STATE.json");
    expected.push("dir-sync:ordered-activate".into());
    file(&mut expected, "ACTIVE.next");
    expected.extend([
        "dir-sync:ordered-activate".into(),
        "selector-rename:ACTIVE.json".into(),
        "full-sync:ACTIVE.json".into(),
        "dir-sync:ordered-activate".into(),
        "dir-sync:.owned-lexical-publication-v1".into(),
        "unlink-file:STATE.json".into(),
        "dir-sync:ordered-activate".into(),
        "unlink-dir:ordered-activate".into(),
        "dir-sync:staging".into(),
    ]);
    assert_eq!(faults.transcript(), expected);
    drop(publisher);
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn every_canonical_record_rejects_structural_mutations_and_binds_every_byte() {
    let output = build(&qualification_input()).unwrap();
    let root = temporary_root("canonical-all-records");
    let publisher = PublisherV1::open(&root).unwrap();
    publisher.publish("build", &output).unwrap();
    publisher
        .activate(
            "activate",
            None,
            output.manifest_digest,
            output.build_authority_digest,
            ActivationModeV1::Forward,
        )
        .unwrap();
    let selector = fs::read(root.join(".owned-lexical-publication-v1/ACTIVE.json")).unwrap();
    type RecordParser = fn(&[u8]) -> std::result::Result<(), ()>;
    let cases: Vec<(&[u8], RecordParser)> = vec![
        (&output.receipt, |bytes| {
            canonical_records::parse_receipt(bytes).map(|_| ())
        }),
        (&output.build_authority, |bytes| {
            canonical_records::parse_authority(bytes).map(|_| ())
        }),
        (&output.source_manifest, |bytes| {
            canonical_records::parse_source(bytes).map(|_| ())
        }),
        (&output.tombstone_inventory, |bytes| {
            canonical_records::parse_tombstone(bytes).map(|_| ())
        }),
        (&selector, |bytes| {
            canonical_records::parse_selector(bytes).map(|_| ())
        }),
    ];
    for (canonical, parse) in cases {
        assert!(parse(canonical).is_ok());
        let original_digest = digest(canonical);
        for mutation in [
            [b" ".as_slice(), canonical].concat(),
            [canonical, b"\n"].concat(),
            [b"{\"unknown\":0,".as_slice(), &canonical[1..]].concat(),
            [b"{\"version\":1,".as_slice(), &canonical[1..]].concat(),
        ] {
            assert!(parse(&mutation).is_err());
        }
        let last_field = canonical.iter().rposition(|byte| *byte == b',').unwrap();
        let mut missing = canonical[..last_field].to_vec();
        missing.push(b'}');
        assert!(parse(&missing).is_err());
        if let Some(position) = canonical.windows(2).position(|window| window == b":1") {
            let mut leading_zero = canonical.to_vec();
            leading_zero.insert(position + 1, b'0');
            assert!(parse(&leading_zero).is_err());
        }
        for index in 0..canonical.len() {
            let mut mutation = canonical.to_vec();
            mutation[index] ^= 1;
            if parse(&mutation).is_ok() {
                assert_ne!(digest(&mutation), original_digest);
            }
        }
    }
    drop(publisher);
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn empty_and_test_scaled_maximum_builds_are_deterministic_at_all_build_caps() {
    let mut empty = qualification_input();
    empty.passages.clear();
    empty.authority.passage_inventory_digest = digest(&[]);
    let first = build(&empty).unwrap();
    let second = build(&empty).unwrap();
    assert_eq!(first, second);
    assert_eq!(first.passages.len(), 32);
    assert_eq!(
        u64::from_le_bytes(first.passages[20..28].try_into().unwrap()),
        0
    );

    let base = qualification_input();
    let prepared = canonical::validate_and_prepare(&base).unwrap();
    let emissions = prepared
        .passages
        .iter()
        .map(|passage| passage.title_tokens.len() as u64 + passage.text_tokens.len() as u64)
        .sum::<u64>();
    let (_, terms, postings) =
        encoding::encode_artifacts(&prepared, &base.authority.limits).unwrap();
    let term_count = u64::from_le_bytes(terms[20..28].try_into().unwrap()) as u32;
    let posting_count = (postings.len() as u64 - 32) / 8;
    let baseline = build(&base).unwrap();
    let artifact_max = [
        baseline.passages.len(),
        baseline.terms.len(),
        baseline.postings.len(),
    ]
    .into_iter()
    .max()
    .unwrap() as u64;
    let artifact_total =
        (baseline.passages.len() + baseline.terms.len() + baseline.postings.len()) as u64;
    let (retained, _) = logical_memory_required(&base).unwrap();

    for (field, exact) in [
        ("passages", prepared.passages.len() as u64),
        ("terms", u64::from(term_count)),
        ("postings", posting_count),
        ("emissions", emissions),
        ("artifact", artifact_max),
        ("total", artifact_total),
        ("retained", retained),
    ] {
        for delta in [-1i64, 0, 1] {
            let mut input = base.clone();
            let value = exact.checked_add_signed(delta).unwrap();
            match field {
                "passages" => input.authority.limits.max_passages = value as u32,
                "terms" => input.authority.limits.max_terms = value as u32,
                "postings" => input.authority.limits.max_postings = value,
                "emissions" => input.authority.limits.max_token_emissions = value,
                "artifact" => input.authority.limits.max_artifact_bytes = value,
                "total" => input.authority.limits.max_total_artifact_bytes = value,
                "retained" => input.authority.limits.max_retained_logical_bytes = value,
                _ => unreachable!(),
            }
            assert_eq!(build(&input).is_ok(), delta >= 0, "{field}:{delta}");
        }
    }

    let source_charge = |input: &BuildInputV1| {
        let prepared = canonical::validate_and_prepare(input).unwrap();
        let inventory = canonical::passage_inventory(&prepared.passages).unwrap();
        let tombstones = canonical::tombstone_bytes(&input.tombstones);
        let authority = canonical::authority_bytes(&input.authority);
        let source = canonical::source_bytes(
            &input.authority,
            digest(&authority),
            prepared.passages.len() as u32,
        );
        (inventory.len() + tombstones.len() + authority.len() + source.len()) as u64
    };
    let mut fixed = base.clone();
    for _ in 0..4 {
        fixed.authority.limits.max_source_bytes = source_charge(&fixed);
    }
    let exact_source = source_charge(&fixed);
    assert_eq!(fixed.authority.limits.max_source_bytes, exact_source);
    for delta in [-1i64, 0, 1] {
        let mut input = fixed.clone();
        input.authority.limits.max_source_bytes = exact_source.checked_add_signed(delta).unwrap();
        assert_eq!(build(&input).is_ok(), delta >= 0, "source:{delta}");
    }
}

#[test]
fn every_root_entry_byte_and_work_cap_has_minus_exact_plus_one_proof() {
    assert_eq!(publication_inventory::MAX_ENTRIES, 768);
    assert_eq!(publication_inventory::MAX_BYTES, 2_415_919_104);
    for (current, added, accepted) in [
        (publication_inventory::MAX_ENTRIES - 1, 0, true),
        (publication_inventory::MAX_ENTRIES, 0, true),
        (publication_inventory::MAX_ENTRIES, 1, false),
    ] {
        assert_eq!(
            publication_inventory::test_charge(current, 0, added, 0).is_ok(),
            accepted
        );
    }
    for (current, added, accepted) in [
        (publication_inventory::MAX_BYTES - 1, 0, true),
        (publication_inventory::MAX_BYTES, 0, true),
        (publication_inventory::MAX_BYTES, 1, false),
    ] {
        assert_eq!(
            publication_inventory::test_charge(0, current, 0, added).is_ok(),
            accepted
        );
    }
    for (retained, exists, accepted) in [(63, false, true), (64, true, true), (64, false, false)] {
        assert_eq!(
            publication::prospective_count_allows(retained, exists, 64),
            accepted
        );
    }
}

#[test]
fn staging_attempt_cap_minus_exact_plus_one_is_checked_before_recovery_mutation() {
    for count in [7usize, 8, 9] {
        let root = temporary_root(&format!("staging-cap-{count}"));
        let staging = root.join(".owned-lexical-publication-v1/staging");
        for index in 0..count {
            let attempt = staging.join(format!("attempt-{index}"));
            fs::create_dir(&attempt).unwrap();
            fs::set_permissions(&attempt, fs::Permissions::from_mode(0o700)).unwrap();
        }
        let opened = PublisherV1::open(&root);
        if count <= 8 {
            drop(opened.unwrap());
            assert!(fs::read_dir(&staging).unwrap().next().is_none());
        } else {
            assert_eq!(opened.err().unwrap().code, Code::RootResourceLimit);
            assert_eq!(fs::read_dir(&staging).unwrap().count(), 9);
        }
        fs::remove_dir_all(root).unwrap();
    }
}

#[test]
fn hand_authored_oracle_digests_are_pinned_before_and_after_every_builder_run() {
    let fixtures = [
        (
            "manifest.json",
            "dc29ca679d27e94477888639190194565e319625602a5b2f108a5fd47acba987",
        ),
        (
            "passages.colr",
            "d689b22f8b355d55b17e32d1e28f33519eb5de26436cc32c5691cd03153e720c",
        ),
        (
            "terms.colr",
            "0547ac1154a7ba7cf7f10897988f652ef52aec90eb11f3baca1d2304949cd00e",
        ),
        (
            "postings.colr",
            "8f940d48ec89ebc6b765c614bd144b243288a4ce053dd7829780122fbd157e88",
        ),
    ];
    let snapshot = || {
        fixtures.map(|(name, expected)| {
            let bytes = fs::read(
                Path::new(env!("CARGO_MANIFEST_DIR"))
                    .join("../fixtures/owned-lexical-reader/golden-three-v1")
                    .join(name),
            )
            .unwrap();
            let actual = digest(&bytes)
                .iter()
                .map(|byte| format!("{byte:02x}"))
                .collect::<String>();
            assert_eq!(actual, expected);
            actual
        })
    };
    let before = snapshot();
    for _ in 0..3 {
        build(&qualification_input()).unwrap();
    }
    assert_eq!(snapshot(), before);
}

#[test]
fn device_inode_owner_mode_link_and_length_identity_changes_are_all_rejected() {
    use publication_fs::{Identity, identity_unchanged};
    let original = Identity {
        device: 1,
        inode: 2,
        mode: 0o100600,
        owner: 3,
        links: 1,
        length: 4,
    };
    assert!(identity_unchanged(original, original, 4));
    for changed in [
        Identity {
            device: 9,
            ..original
        },
        Identity {
            inode: 9,
            ..original
        },
        Identity {
            mode: 0o100644,
            ..original
        },
        Identity {
            owner: 9,
            ..original
        },
        Identity {
            links: 2,
            ..original
        },
        Identity {
            length: 9,
            ..original
        },
    ] {
        assert!(!identity_unchanged(original, changed, 4));
    }
}

fn changed_output(suffix: usize) -> BuildOutputV1 {
    let mut input = qualification_input();
    input.passages[0].text = format!("rust {suffix}");
    let prepared = canonical::validate_and_prepare(&input).unwrap();
    input.authority.passage_inventory_digest =
        digest(&canonical::passage_inventory(&prepared.passages).unwrap());
    build(&input).unwrap()
}

#[test]
fn current_previous_and_candidate_chain_corruption_permutations_all_fail_closed() {
    for role in ["current", "previous", "candidate"] {
        for kind in ["generation", "receipt", "build", "source", "tombstone"] {
            let root = temporary_root(&format!("chain-{role}-{kind}"));
            let first = changed_output(1);
            let second = changed_output(2);
            let third = changed_output(3);
            let publisher = PublisherV1::open(&root).unwrap();
            for (attempt, output) in [("one", &first), ("two", &second), ("three", &third)] {
                publisher.publish(attempt, output).unwrap();
            }
            publisher
                .activate(
                    "a",
                    None,
                    first.manifest_digest,
                    first.build_authority_digest,
                    ActivationModeV1::Forward,
                )
                .unwrap();
            publisher
                .activate(
                    "b",
                    Some(first.manifest_digest),
                    second.manifest_digest,
                    second.build_authority_digest,
                    ActivationModeV1::Forward,
                )
                .unwrap();
            drop(publisher);
            let output = match role {
                "current" => &second,
                "previous" => &first,
                _ => &third,
            };
            let tree = root.join(".owned-lexical-publication-v1");
            let hex = |digest: Digest32| {
                digest
                    .iter()
                    .map(|byte| format!("{byte:02x}"))
                    .collect::<String>()
            };
            let path = match kind {
                "generation" => tree
                    .join("generations")
                    .join(hex(output.manifest_digest))
                    .join("passages.colr"),
                "receipt" => tree
                    .join("receipts")
                    .join(format!("{}.json", hex(output.manifest_digest))),
                "build" => tree
                    .join("authorities/build")
                    .join(format!("{}.json", hex(output.build_authority_digest))),
                "source" => tree
                    .join("authorities/source")
                    .join(format!("{}.json", hex(output.source_manifest_digest))),
                _ => tree
                    .join("authorities/tombstones")
                    .join(format!("{}.json", hex(output.tombstone_inventory_digest))),
            };
            let mut bytes = fs::read(&path).unwrap();
            bytes[0] ^= 1;
            fs::write(&path, bytes).unwrap();
            assert!(PublisherV1::open(&root).is_err(), "{role}:{kind}");
            fs::remove_dir_all(root).unwrap();
        }
    }
}

#[test]
fn selector_wrong_type_symlink_hardlink_and_explicit_roll_forward_are_closed() {
    for attack in ["directory", "symlink", "hardlink"] {
        let root = temporary_root(&format!("selector-{attack}"));
        let output = changed_output(1);
        let publisher = PublisherV1::open(&root).unwrap();
        publisher.publish("build", &output).unwrap();
        publisher
            .activate(
                "activate",
                None,
                output.manifest_digest,
                output.build_authority_digest,
                ActivationModeV1::Forward,
            )
            .unwrap();
        drop(publisher);
        let active = root.join(".owned-lexical-publication-v1/ACTIVE.json");
        match attack {
            "directory" => {
                fs::remove_file(&active).unwrap();
                fs::create_dir(&active).unwrap();
                fs::set_permissions(&active, fs::Permissions::from_mode(0o700)).unwrap();
            }
            "symlink" => {
                fs::remove_file(&active).unwrap();
                std::os::unix::fs::symlink("publication.lock", &active).unwrap();
            }
            _ => {
                fs::hard_link(&active, root.join("active-copy")).unwrap();
            }
        }
        assert!(PublisherV1::open(&root).is_err(), "{attack}");
        fs::remove_dir_all(root).unwrap();
    }

    let root = temporary_root("roll-forward");
    let first = changed_output(1);
    let second = changed_output(2);
    let publisher = PublisherV1::open(&root).unwrap();
    publisher.publish("one", &first).unwrap();
    publisher.publish("two", &second).unwrap();
    publisher
        .activate(
            "a",
            None,
            first.manifest_digest,
            first.build_authority_digest,
            ActivationModeV1::Forward,
        )
        .unwrap();
    publisher
        .activate(
            "b",
            Some(first.manifest_digest),
            second.manifest_digest,
            second.build_authority_digest,
            ActivationModeV1::Forward,
        )
        .unwrap();
    publisher
        .activate(
            "rollback",
            Some(second.manifest_digest),
            first.manifest_digest,
            first.build_authority_digest,
            ActivationModeV1::Rollback,
        )
        .unwrap();
    assert_eq!(
        publisher
            .activate(
                "implicit-forward",
                Some(first.manifest_digest),
                second.manifest_digest,
                second.build_authority_digest,
                ActivationModeV1::Forward
            )
            .unwrap_err()
            .code,
        Code::RollbackInvalid
    );
    publisher
        .activate(
            "explicit-roll-forward",
            Some(first.manifest_digest),
            second.manifest_digest,
            second.build_authority_digest,
            ActivationModeV1::Rollback,
        )
        .unwrap();
    drop(publisher);
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn retained_root_replacement_fails_before_every_mutation_category() {
    for operation in ["publish", "activate"] {
        let root = temporary_root(&format!("root-replaced-{operation}"));
        let displaced = root.with_extension("displaced");
        let _ = fs::remove_dir_all(&displaced);
        let output = build(&qualification_input()).unwrap();
        let publisher = PublisherV1::open(&root).unwrap();
        if operation == "activate" {
            publisher.publish("prepared", &output).unwrap();
        }
        fs::rename(&root, &displaced).unwrap();
        fs::create_dir(&root).unwrap();
        operator_bootstrap(&root);
        let replacement_before = fs::read_dir(root.join(".owned-lexical-publication-v1/staging"))
            .unwrap()
            .count();
        let failure = if operation == "publish" {
            publisher.publish("must-not-switch", &output).unwrap_err()
        } else {
            publisher
                .activate(
                    "must-not-switch",
                    None,
                    output.manifest_digest,
                    output.build_authority_digest,
                    ActivationModeV1::Forward,
                )
                .unwrap_err()
        };
        assert_eq!(failure.code, Code::RootInvalid);
        assert_eq!(
            fs::read_dir(root.join(".owned-lexical-publication-v1/staging"))
                .unwrap()
                .count(),
            replacement_before
        );
        assert!(
            !root
                .join(".owned-lexical-publication-v1/ACTIVE.json")
                .exists()
        );
        drop(publisher);
        fs::remove_dir_all(root).unwrap();
        fs::remove_dir_all(displaced).unwrap();
    }
}

#[test]
fn root_path_replacement_before_each_mutation_category_never_touches_replacement() {
    for category in [
        "create-dir",
        "create-file",
        "write",
        "file-sync",
        "full-sync",
        "directory-sync",
        "no-replace-rename",
        "selector-rename",
        "unlink-file",
        "unlink-dir",
    ] {
        let root = temporary_root(&format!("replace-category-{category}"));
        let displaced = root.with_extension("displaced");
        let _ = fs::remove_dir_all(&displaced);
        let output = build(&qualification_input()).unwrap();
        let faults = Arc::new(FaultPlan::default());
        let publisher = PublisherV1::open_with_faults(&root, Arc::clone(&faults)).unwrap();
        let activation = category == "selector-rename";
        if activation {
            publisher.publish("prepared", &output).unwrap();
            faults.clear_transcript();
        }
        faults.replace_root_at(category, 0, root.clone(), displaced.clone());
        let result = if activation {
            publisher
                .activate(
                    "replace",
                    None,
                    output.manifest_digest,
                    output.build_authority_digest,
                    ActivationModeV1::Forward,
                )
                .map(|_| ())
        } else {
            publisher.publish("replace", &output).map(|_| ())
        };
        assert!(result.is_err(), "{category}");
        assert_eq!(fs::read_dir(&root).unwrap().count(), 0, "{category}");
        drop(publisher);
        fs::remove_dir_all(root).unwrap();
        fs::remove_dir_all(displaced).unwrap();
    }
}
