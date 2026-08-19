use std::cell::RefCell;
#[cfg(test)]
use std::collections::HashMap;
use std::ffi::c_int;
use std::fs::File;
use std::os::unix::fs::MetadataExt;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use super::canonical_records::{
    AuthorityRecord, SelectorRecord, TombstoneRecord, parse_authority, parse_receipt,
    parse_selector, parse_source, parse_tombstone,
};
use super::publication_fs::Directory;
use super::publication_inventory;
use super::*;

const TREE: &str = ".owned-lexical-publication-v1";
const DIR_MODE: u32 = 0o700;
const FILE_MODE: u32 = 0o600;

#[derive(Clone)]
struct ManagedRoot {
    tree_path: PathBuf,
    tree_directory: Arc<Directory>,
    operator_path: PathBuf,
    operator_directory: Arc<Directory>,
}

thread_local! {
    static MANAGED_ROOT: RefCell<Option<ManagedRoot>> = const { RefCell::new(None) };
}

struct ManagedRootGuard;

impl Drop for ManagedRootGuard {
    fn drop(&mut self) {
        MANAGED_ROOT.with(|root| *root.borrow_mut() = None);
    }
}

fn install_managed_root(
    tree_path: &Path,
    tree_directory: Arc<Directory>,
    operator_path: &Path,
    operator_directory: Arc<Directory>,
) -> ManagedRootGuard {
    MANAGED_ROOT.with(|root| {
        *root.borrow_mut() = Some(ManagedRoot {
            tree_path: tree_path.to_path_buf(),
            tree_directory,
            operator_path: operator_path.to_path_buf(),
            operator_directory,
        });
    });
    ManagedRootGuard
}

fn managed_directory(path: &Path) -> std::io::Result<Directory> {
    MANAGED_ROOT.with(|root| {
        let root = root.borrow();
        let managed = root
            .as_ref()
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?;
        validate_managed_root(managed)?;
        let relative = path
            .strip_prefix(&managed.tree_path)
            .map_err(|_| std::io::Error::from_raw_os_error(22))?;
        let mut current = managed.tree_directory.duplicate()?;
        for component in relative.components() {
            let std::path::Component::Normal(name) = component else {
                return Err(std::io::Error::from_raw_os_error(22));
            };
            current = current.open_dir(
                name.to_str()
                    .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
            )?;
            let identity = current.identity();
            if identity.device != managed.tree_directory.identity().device
                || identity.owner != managed.tree_directory.identity().owner
                || identity.mode & 0o7777 != DIR_MODE
            {
                return Err(std::io::Error::from_raw_os_error(22));
            }
        }
        current.verify_namespace_identity()?;
        Ok(current)
    })
}

fn validate_managed_root(managed: &ManagedRoot) -> std::io::Result<()> {
    let visible = Directory::open_absolute(&managed.operator_path)?;
    let expected = managed.operator_directory.identity();
    let observed = visible.identity();
    if expected.device != observed.device
        || expected.inode != observed.inode
        || expected.mode != observed.mode
        || expected.owner != observed.owner
    {
        return Err(std::io::Error::from_raw_os_error(22));
    }
    managed.operator_directory.verify_namespace_identity()
}

fn mutation_start(category: &'static str) -> std::io::Result<()> {
    #[cfg(test)]
    ACTIVE_FAULTS.with(|active| {
        let active = active.borrow();
        let Some(plan) = active.as_ref() else { return };
        let occurrence = {
            let mut occurrences = plan.mutation_occurrences.lock().unwrap();
            let value = occurrences.entry(category.to_owned()).or_default();
            let current = *value;
            *value += 1;
            current
        };
        match plan.replacement.lock().unwrap().clone() {
            Some((expected, expected_occurrence, root, displaced))
                if expected == category && expected_occurrence == occurrence =>
            {
                std::fs::rename(&root, &displaced).unwrap();
                std::fs::create_dir(&root).unwrap();
                use std::os::unix::fs::PermissionsExt;
                std::fs::set_permissions(&root, std::fs::Permissions::from_mode(0o700)).unwrap();
            }
            _ => {}
        }
    });
    #[cfg(not(test))]
    let _ = category;
    MANAGED_ROOT.with(|root| {
        let root = root.borrow();
        validate_managed_root(
            root.as_ref()
                .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
        )
    })
}

unsafe extern "C" {
    fn flock(fd: c_int, operation: c_int) -> c_int;
    fn fcntl(fd: c_int, cmd: c_int, ...) -> c_int;
}
#[cfg(target_os = "macos")]
const F_FULLFSYNC: c_int = 51;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(super) enum ActivationModeV1 {
    Forward,
    Rollback,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct PublishResultV1 {
    pub manifest_digest: Digest32,
    pub receipt: Vec<u8>,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct ActivationResultV1 {
    pub selected_manifest_digest: Digest32,
    pub previous_manifest_digest: Option<Digest32>,
}

pub(super) struct PublisherV1 {
    operator_root: PathBuf,
    operator_directory: Arc<Directory>,
    tree: PathBuf,
    tree_directory: Arc<Directory>,
    lock: File,
    operation: Mutex<()>,
    #[cfg(test)]
    faults: Arc<FaultPlan>,
}

#[cfg(test)]
#[derive(Default)]
pub(super) struct FaultPlan {
    next: Mutex<Option<(&'static str, FaultAction)>>,
    transcript: Mutex<Vec<String>>,
    crash_event: Mutex<Option<(String, usize, i32)>>,
    occurrences: Mutex<HashMap<String, usize>>,
    replacement: Mutex<Option<(String, usize, PathBuf, PathBuf)>>,
    mutation_occurrences: Mutex<HashMap<String, usize>>,
}

#[cfg(test)]
#[derive(Clone, Copy)]
enum FaultAction {
    Error(i32),
    Exit(i32),
}

#[cfg(test)]
impl FaultPlan {
    pub fn fail_next(&self, point: &'static str, errno: i32) {
        *self.next.lock().unwrap() = Some((point, FaultAction::Error(errno)));
    }

    pub fn exit_next(&self, point: &'static str, status: i32) {
        *self.next.lock().unwrap() = Some((point, FaultAction::Exit(status)));
    }

    pub fn transcript(&self) -> Vec<String> {
        self.transcript.lock().unwrap().clone()
    }

    pub fn exit_at(&self, event: String, occurrence: usize, status: i32) {
        *self.crash_event.lock().unwrap() = Some((event, occurrence, status));
    }

    pub fn clear_transcript(&self) {
        self.transcript.lock().unwrap().clear();
        self.occurrences.lock().unwrap().clear();
        self.mutation_occurrences.lock().unwrap().clear();
    }

    pub fn replace_root_at(
        &self,
        category: &str,
        occurrence: usize,
        root: PathBuf,
        displaced: PathBuf,
    ) {
        *self.replacement.lock().unwrap() =
            Some((category.to_owned(), occurrence, root, displaced));
    }
}

#[cfg(test)]
thread_local! {
    static ACTIVE_FAULTS: RefCell<Option<Arc<FaultPlan>>> = const { RefCell::new(None) };
}

#[cfg(test)]
struct FaultGuard;

#[cfg(test)]
impl Drop for FaultGuard {
    fn drop(&mut self) {
        ACTIVE_FAULTS.with(|active| *active.borrow_mut() = None);
    }
}
impl PublisherV1 {
    pub fn open(operator_root: &Path) -> Result<Self> {
        #[cfg(test)]
        let result = Self::open_inner(operator_root, Arc::new(FaultPlan::default()));
        #[cfg(not(test))]
        let result = Self::open_inner(operator_root);
        result
    }

    #[cfg(test)]
    pub(super) fn open_with_faults(operator_root: &Path, faults: Arc<FaultPlan>) -> Result<Self> {
        Self::open_inner(operator_root, faults)
    }

    fn open_inner(operator_root: &Path, #[cfg(test)] faults: Arc<FaultPlan>) -> Result<Self> {
        if !operator_root.is_absolute() {
            return Err(fail(Code::RootInvalid, Phase::Root, FileKind::Root));
        }
        let operator_directory = Arc::new(
            Directory::open_absolute(operator_root)
                .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?,
        );
        let operator_identity = operator_directory.identity();
        if operator_identity.owner != uid() || operator_identity.mode & 0o7777 != DIR_MODE {
            return Err(fail(Code::RootInvalid, Phase::Root, FileKind::Root));
        }
        let tree = operator_root.join(TREE);
        let tree_directory = Arc::new(
            Directory::open_absolute(&tree)
                .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?,
        );
        let _managed = install_managed_root(
            &tree,
            Arc::clone(&tree_directory),
            operator_root,
            Arc::clone(&operator_directory),
        );
        let lock_path = tree.join("publication.lock");
        let lock = open_regular(&lock_path, true)?;
        use std::os::fd::AsRawFd;
        // SAFETY: flock receives the live lock descriptor and fixed Darwin/POSIX operation flags.
        if unsafe { flock(lock.as_raw_fd(), 2 | 4) } != 0 {
            return Err(fail(Code::LockUnavailable, Phase::Lock, FileKind::Lock));
        }
        validate_bootstrap(&tree)?;
        validate_inventory(&tree)?;
        recover_staging(&tree)?;
        validate_inventory(&tree)?;
        Ok(Self {
            operator_root: operator_root.to_path_buf(),
            operator_directory,
            tree,
            tree_directory,
            lock,
            operation: Mutex::new(()),
            #[cfg(test)]
            faults,
        })
    }
    pub fn publish(&self, attempt: &str, output: &BuildOutputV1) -> Result<PublishResultV1> {
        let _operation = self
            .operation
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        #[cfg(test)]
        let _fault_guard = self.install_faults();
        let _managed = install_managed_root(
            &self.tree,
            Arc::clone(&self.tree_directory),
            &self.operator_root,
            Arc::clone(&self.operator_directory),
        );
        let _ = &self.lock;
        self.validate_visible_root()?;
        self.tree_directory
            .verify_namespace_identity()
            .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?;
        if !attempt_id(attempt) {
            return Err(fail(
                Code::BuildInputInvalid,
                Phase::Input,
                FileKind::Staging,
            ));
        }
        validate_inventory(&self.tree)?;
        validate_prospective_publication_counts(&self.tree, output)?;
        let staged_bytes = [
            output.passages.len(),
            output.terms.len(),
            output.postings.len(),
            output.manifest.len(),
            output.tombstone_inventory.len(),
            output.build_authority.len(),
            output.source_manifest.len(),
            output.receipt.len(),
            256,
        ]
        .into_iter()
        .try_fold(0u64, |total, length| total.checked_add(length as u64))
        .ok_or_else(|| fail(Code::RootResourceLimit, Phase::Sizing, FileKind::Root))?;
        publication_inventory::inspect(&self.tree_directory)?.prospective(11, staged_bytes)?;
        let stage = self.tree.join("staging").join(attempt);
        create_dir(&stage)?;
        write_stage_state(&stage, attempt)?;
        let generation = stage.join("generation");
        create_dir(&generation)?;
        let outcome = (|| {
            for (name, bytes) in [
                ("passages.colr", output.passages.as_slice()),
                ("terms.colr", &output.terms),
                ("postings.colr", &output.postings),
                ("manifest.json", &output.manifest),
                ("tombstone-inventory.json", &output.tombstone_inventory),
                ("build-authority.json", &output.build_authority),
                ("source-manifest.json", &output.source_manifest),
            ] {
                let path = if name.ends_with(".colr") || name == "manifest.json" {
                    generation.join(name)
                } else {
                    stage.join(name)
                };
                write_synced(&path, bytes)?;
            }
            sync_dir(&generation)?;
            sync_dir(&stage)?;
            validate_generation_dir(&generation, output.manifest_digest)?;
            write_synced(&stage.join("receipt.json"), &output.receipt)?;
            sync_dir(&stage)?;
            publish_file(
                &stage.join("tombstone-inventory.json"),
                &self
                    .tree
                    .join("authorities/tombstones")
                    .join(format!("{}.json", hex(output.tombstone_inventory_digest))),
            )?;
            injected("after-tombstone-rename")?;
            publish_file(
                &stage.join("build-authority.json"),
                &self
                    .tree
                    .join("authorities/build")
                    .join(format!("{}.json", hex(output.build_authority_digest))),
            )?;
            injected("after-build-authority-rename")?;
            publish_file(
                &stage.join("source-manifest.json"),
                &self
                    .tree
                    .join("authorities/source")
                    .join(format!("{}.json", hex(output.source_manifest_digest))),
            )?;
            injected("after-source-manifest-rename")?;
            publish_generation(
                &generation,
                &self
                    .tree
                    .join("generations")
                    .join(hex(output.manifest_digest)),
                output.manifest_digest,
            )?;
            injected("after-generation-rename")?;
            publish_file(
                &stage.join("receipt.json"),
                &self
                    .tree
                    .join("receipts")
                    .join(format!("{}.json", hex(output.manifest_digest))),
            )?;
            injected("after-receipt-rename")?;
            if injected("cleanup").is_err() {
                return Err(fail(
                    Code::IoWriteFailed,
                    Phase::Publication,
                    FileKind::Staging,
                ));
            }
            unlink_file(&stage.join("STATE.json"))
                .map_err(|_| fail(Code::IoWriteFailed, Phase::Publication, FileKind::Staging))?;
            sync_dir(&stage)?;
            unlink_dir(&stage)
                .map_err(|_| fail(Code::IoWriteFailed, Phase::Publication, FileKind::Staging))?;
            sync_dir(&self.tree.join("staging"))?;
            Ok(PublishResultV1 {
                manifest_digest: output.manifest_digest,
                receipt: output.receipt.clone(),
            })
        })();
        if outcome.is_err() {
            let _ = remove_owned_stage(&stage);
        }
        outcome
    }
    pub fn activate(
        &self,
        attempt: &str,
        expected: Option<Digest32>,
        candidate: Digest32,
        current_authority: Digest32,
        mode: ActivationModeV1,
    ) -> Result<ActivationResultV1> {
        let _operation = self
            .operation
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        #[cfg(test)]
        let _fault_guard = self.install_faults();
        let _managed = install_managed_root(
            &self.tree,
            Arc::clone(&self.tree_directory),
            &self.operator_root,
            Arc::clone(&self.operator_directory),
        );
        let _ = &self.lock;
        self.validate_visible_root()?;
        self.tree_directory
            .verify_namespace_identity()
            .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?;
        if !attempt_id(attempt) {
            return Err(fail(
                Code::BuildInputInvalid,
                Phase::Input,
                FileKind::Staging,
            ));
        }
        validate_inventory(&self.tree)?;
        publication_inventory::inspect(&self.tree_directory)?.prospective(3, 1_280)?;
        let observed = read_selector(&self.tree)?;
        if observed.as_ref().map(|s| s.manifest) != expected {
            return Err(fail(
                Code::CasMismatch,
                Phase::SelectorPreCommit,
                FileKind::Selector,
            ));
        }
        let chain = validate_chain(&self.tree, candidate)?;
        if chain.authority != current_authority {
            return Err(fail(
                Code::AuthorizationInvalid,
                Phase::SelectorPreCommit,
                FileKind::Authority,
            ));
        }
        if let Some(old) = &observed {
            let old_chain = validate_chain(&self.tree, old.manifest)?;
            if candidate == old.manifest {
                return Ok(ActivationResultV1 {
                    selected_manifest_digest: candidate,
                    previous_manifest_digest: old.previous,
                });
            }
            if chain.watermark < old.watermark
                || (chain.watermark == old.watermark && chain.tombstone != old.tombstone)
            {
                return Err(fail(
                    Code::TombstoneRegression,
                    Phase::SelectorPreCommit,
                    FileKind::Tombstone,
                ));
            }
            if chain.watermark > old.watermark
                && !tombstone_superset(&old_chain.tombstone_record, &chain.tombstone_record)
            {
                return Err(fail(
                    Code::TombstoneRegression,
                    Phase::SelectorPreCommit,
                    FileKind::Tombstone,
                ));
            }
            match mode {
                ActivationModeV1::Rollback if old.previous != Some(candidate) => {
                    return Err(fail(
                        Code::RollbackInvalid,
                        Phase::SelectorPreCommit,
                        FileKind::Selector,
                    ));
                }
                ActivationModeV1::Forward if old.previous == Some(candidate) => {
                    return Err(fail(
                        Code::RollbackInvalid,
                        Phase::SelectorPreCommit,
                        FileKind::Selector,
                    ));
                }
                _ => {}
            }
        } else if mode == ActivationModeV1::Rollback {
            return Err(fail(
                Code::RollbackInvalid,
                Phase::SelectorPreCommit,
                FileKind::Selector,
            ));
        }
        let previous = observed.as_ref().map(|s| s.manifest);
        let bytes = selector_bytes(&chain, previous);
        let stage = self.tree.join("staging").join(attempt);
        create_dir(&stage)?;
        write_stage_state(&stage, attempt)?;
        let next = stage.join("ACTIVE.next");
        let pre = (|| {
            write_synced(&next, &bytes)?;
            let check = read_regular(&next, 1_024).map_err(|_| {
                fail(
                    Code::SelectorInvalid,
                    Phase::SelectorPreCommit,
                    FileKind::Selector,
                )
            })?;
            if check != bytes {
                return Err(fail(
                    Code::SelectorInvalid,
                    Phase::SelectorPreCommit,
                    FileKind::Selector,
                ));
            }
            sync_dir(&stage)?;
            if injected("selector-rename").is_err() {
                return Err(fail(
                    Code::IoWriteFailed,
                    Phase::SelectorPreCommit,
                    FileKind::Selector,
                ));
            }
            rename_replace(&next, &self.tree.join("ACTIVE.json")).map_err(|_| {
                fail(
                    Code::IoWriteFailed,
                    Phase::SelectorPreCommit,
                    FileKind::Selector,
                )
            })?;
            crash_only("selector-after-rename-crash");
            Ok(())
        })();
        if let Err(e) = pre {
            let _ = remove_owned_stage(&stage);
            return Err(e);
        }
        let post = (|| {
            injected("selector-post-fullsync")?;
            full_sync(&open_regular(&self.tree.join("ACTIVE.json"), false)?)?;
            persistence_event("full-sync:ACTIVE.json".into());
            injected("selector-post-attempt-sync")?;
            sync_dir(&stage)?;
            injected("selector-post-root-sync")?;
            sync_dir(&self.tree)?;
            injected("selector-post-state-cleanup")?;
            unlink_file(&stage.join("STATE.json")).map_err(|_| {
                fail(
                    Code::SelectorCommitIndeterminate,
                    Phase::SelectorPostCommit,
                    FileKind::Selector,
                )
            })?;
            sync_dir(&stage)?;
            injected("selector-post-attempt-cleanup")?;
            unlink_dir(&stage).map_err(|_| {
                fail(
                    Code::SelectorCommitIndeterminate,
                    Phase::SelectorPostCommit,
                    FileKind::Selector,
                )
            })?;
            injected("selector-post-staging-sync")?;
            sync_dir(&self.tree.join("staging"))
        })();
        if post.is_err() {
            return Err(Failure {
                code: Code::SelectorCommitIndeterminate,
                phase: Phase::SelectorPostCommit,
                file: FileKind::Selector,
                offset_or_count: None,
                observed_selector_digest: Some(candidate),
            });
        }
        Ok(ActivationResultV1 {
            selected_manifest_digest: candidate,
            previous_manifest_digest: previous,
        })
    }

    #[cfg(test)]
    fn install_faults(&self) -> FaultGuard {
        ACTIVE_FAULTS.with(|active| *active.borrow_mut() = Some(Arc::clone(&self.faults)));
        FaultGuard
    }

    fn validate_visible_root(&self) -> Result<()> {
        let visible = Directory::open_absolute(&self.operator_root)
            .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?;
        let expected = self.operator_directory.identity();
        let observed = visible.identity();
        if expected.device != observed.device
            || expected.inode != observed.inode
            || expected.mode != observed.mode
            || expected.owner != observed.owner
        {
            return Err(fail(Code::RootInvalid, Phase::Root, FileKind::Root));
        }
        self.operator_directory
            .verify_namespace_identity()
            .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))
    }
}

fn injected(point: &'static str) -> Result<()> {
    #[cfg(test)]
    {
        let failure = ACTIVE_FAULTS.with(|active| {
            let active = active.borrow();
            let plan = active.as_ref()?;
            let mut next = plan.next.lock().ok()?;
            let (expected, action) = *next.as_ref()?;
            if expected != point {
                return None;
            }
            *next = None;
            Some(action)
        });
        match failure {
            Some(FaultAction::Exit(status)) => std::process::exit(status),
            Some(FaultAction::Error(errno)) => {
                let _ = errno;
                return Err(fail(
                    Code::SyncFailed,
                    Phase::SelectorPostCommit,
                    FileKind::Selector,
                ));
            }
            None => {}
        }
    }
    let _ = point;
    Ok(())
}

#[cfg(test)]
fn crash_only(point: &'static str) {
    ACTIVE_FAULTS.with(|active| {
        let active = active.borrow();
        let Some(plan) = active.as_ref() else { return };
        let Ok(mut next) = plan.next.lock() else {
            return;
        };
        let Some((expected, FaultAction::Exit(status))) = *next else {
            return;
        };
        if expected == point {
            *next = None;
            std::process::exit(status);
        }
    });
}

#[cfg(not(test))]
fn crash_only(_point: &'static str) {}

#[cfg(test)]
fn persistence_event(event: String) {
    ACTIVE_FAULTS.with(|active| {
        let active = active.borrow();
        let Some(plan) = active.as_ref() else { return };
        plan.transcript.lock().unwrap().push(event.clone());
        let occurrence = {
            let mut occurrences = plan.occurrences.lock().unwrap();
            let value = occurrences.entry(event.clone()).or_default();
            let current = *value;
            *value += 1;
            current
        };
        match plan.crash_event.lock().unwrap().clone() {
            Some((expected, expected_occurrence, status))
                if expected == event && expected_occurrence == occurrence =>
            {
                std::process::exit(status);
            }
            _ => {}
        }
    });
}

#[cfg(not(test))]
fn persistence_event(_event: String) {}

fn fail(c: Code, p: Phase, f: FileKind) -> Failure {
    Failure::new(c, p, f)
}
fn uid() -> u32 {
    unsafe extern "C" {
        fn geteuid() -> u32;
    }
    unsafe { geteuid() }
}
fn validate_dir(p: &Path) -> Result<()> {
    let directory =
        managed_directory(p).map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?;
    let identity = directory.identity();
    if identity.owner != uid() || identity.mode & 0o7777 != DIR_MODE {
        return Err(fail(Code::RootInvalid, Phase::Root, FileKind::Root));
    }
    Ok(())
}
fn validate_bootstrap(t: &Path) -> Result<()> {
    validate_dir(t)?;
    for d in [
        "authorities",
        "authorities/build",
        "authorities/source",
        "authorities/tombstones",
        "generations",
        "receipts",
        "staging",
    ] {
        validate_dir(&t.join(d))?
    }
    let lock = open_regular(&t.join("publication.lock"), false)
        .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Lock))?;
    let m = lock
        .metadata()
        .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Lock))?;
    if m.nlink() != 1 || m.uid() != uid() || m.mode() & 0o7777 != FILE_MODE || m.len() != 0 {
        return Err(fail(Code::RootInvalid, Phase::Root, FileKind::Lock));
    }
    Ok(())
}
fn names(p: &Path) -> Result<Vec<String>> {
    managed_directory(p)
        .and_then(|directory| directory.names())
        .map_err(|_| fail(Code::InventoryInvalid, Phase::Root, FileKind::Root))
}
fn validate_inventory(t: &Path) -> Result<()> {
    let retained_tree =
        managed_directory(t).map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?;
    publication_inventory::inspect(&retained_tree)?;
    let mut root = names(t)?;
    let active = root.iter().any(|x| x == "ACTIVE.json");
    root.retain(|x| x != "ACTIVE.json");
    if root
        != [
            "authorities",
            "generations",
            "publication.lock",
            "receipts",
            "staging",
        ]
    {
        return Err(fail(Code::InventoryInvalid, Phase::Root, FileKind::Root));
    }
    if names(&t.join("authorities"))? != ["build", "source", "tombstones"] {
        return Err(fail(
            Code::InventoryInvalid,
            Phase::Root,
            FileKind::Authority,
        ));
    }
    if active {
        open_regular(&t.join("ACTIVE.json"), false)?;
    }
    for (d, suffix, is_dir) in [
        ("authorities/build", ".json", false),
        ("authorities/source", ".json", false),
        ("authorities/tombstones", ".json", false),
        ("receipts", ".json", false),
        ("generations", "", true),
    ] {
        let entries = names(&t.join(d))?;
        if entries.len() > 64 {
            return Err(fail(Code::RootResourceLimit, Phase::Root, FileKind::Root));
        }
        for n in entries {
            let stem = if suffix.is_empty() {
                &n
            } else {
                n.strip_suffix(suffix)
                    .ok_or_else(|| fail(Code::InventoryInvalid, Phase::Root, FileKind::Root))?
            };
            if !hex_name(stem) {
                return Err(fail(Code::InventoryInvalid, Phase::Root, FileKind::Root));
            }
            if is_dir {
                let digest = parse_hex_name(stem)?;
                validate_dir(&t.join(d).join(&n))?;
                validate_generation_dir(&t.join(d).join(n), digest)?;
            } else {
                let expected = parse_hex_name(stem)?;
                let path = t.join(d).join(n);
                open_regular(&path, false)?;
                let bytes = read_regular(&path, 32 * 1024 * 1024)
                    .map_err(|_| fail(Code::InventoryInvalid, Phase::Root, FileKind::Root))?;
                if d == "receipts" {
                    let receipt = parse_receipt(&bytes).map_err(|_| {
                        fail(Code::InventoryInvalid, Phase::Root, FileKind::Receipt)
                    })?;
                    if receipt.manifest_digest != expected {
                        return Err(fail(Code::DigestMismatch, Phase::Root, FileKind::Receipt));
                    }
                } else {
                    if digest(&bytes) != expected {
                        return Err(fail(Code::DigestMismatch, Phase::Root, FileKind::Authority));
                    }
                    let parsed = match d {
                        "authorities/build" => parse_authority(&bytes).map(|_| ()),
                        "authorities/source" => parse_source(&bytes).map(|_| ()),
                        "authorities/tombstones" => parse_tombstone(&bytes).map(|_| ()),
                        _ => Err(()),
                    };
                    parsed.map_err(|_| {
                        fail(Code::InventoryInvalid, Phase::Root, FileKind::Authority)
                    })?;
                }
            }
        }
    }
    if names(&t.join("staging"))?.len() > 8 {
        return Err(fail(
            Code::RootResourceLimit,
            Phase::Root,
            FileKind::Staging,
        ));
    }
    Ok(())
}

fn validate_prospective_publication_counts(t: &Path, output: &BuildOutputV1) -> Result<()> {
    for (directory, name) in [
        (
            "authorities/build",
            format!("{}.json", hex(output.build_authority_digest)),
        ),
        (
            "authorities/source",
            format!("{}.json", hex(output.source_manifest_digest)),
        ),
        (
            "authorities/tombstones",
            format!("{}.json", hex(output.tombstone_inventory_digest)),
        ),
        ("generations", hex(output.manifest_digest)),
        ("receipts", format!("{}.json", hex(output.manifest_digest))),
    ] {
        let retained = names(&t.join(directory))?;
        if !prospective_count_allows(
            retained.len(),
            retained.iter().any(|entry| entry == &name),
            64,
        ) {
            return Err(fail(Code::RootResourceLimit, Phase::Sizing, FileKind::Root));
        }
    }
    Ok(())
}

pub(super) fn prospective_count_allows(
    retained: usize,
    address_exists: bool,
    maximum: usize,
) -> bool {
    retained < maximum || address_exists
}
fn recover_staging(t: &Path) -> Result<()> {
    for n in names(&t.join("staging"))? {
        if !attempt_id(&n) {
            return Err(fail(
                Code::InventoryInvalid,
                Phase::Recovery,
                FileKind::Staging,
            ));
        }
        remove_owned_stage(&t.join("staging").join(n))?;
    }
    sync_dir(&t.join("staging"))
}
fn remove_owned_stage(p: &Path) -> Result<()> {
    let stage_directory = match managed_directory(p) {
        Ok(directory) => directory,
        Err(error) if error.raw_os_error() == Some(2) => return Ok(()),
        Err(_) => {
            return Err(fail(
                Code::RecoveryAmbiguous,
                Phase::Recovery,
                FileKind::Staging,
            ));
        }
    };
    let metadata = stage_directory.identity();
    if metadata.mode & 0o7777 != DIR_MODE || metadata.owner != uid() {
        return Err(fail(
            Code::RecoveryAmbiguous,
            Phase::Recovery,
            FileKind::Staging,
        ));
    }
    let entries = names(p)?;
    if entries.is_empty() {
        return unlink_dir(p)
            .map_err(|_| fail(Code::RecoveryAmbiguous, Phase::Recovery, FileKind::Staging));
    }
    if entries == ["STATE.json"]
        && read_regular(&p.join("STATE.json"), 256).is_ok_and(|bytes| bytes.is_empty())
    {
        unlink_file(&p.join("STATE.json"))
            .map_err(|_| fail(Code::RecoveryAmbiguous, Phase::Recovery, FileKind::Staging))?;
        return unlink_dir(p)
            .map_err(|_| fail(Code::RecoveryAmbiguous, Phase::Recovery, FileKind::Staging));
    }
    if entries.iter().any(|name| {
        !matches!(
            name.as_str(),
            "STATE.json"
                | "generation"
                | "build-authority.json"
                | "source-manifest.json"
                | "tombstone-inventory.json"
                | "receipt.json"
                | "ACTIVE.next"
        )
    }) {
        return Err(fail(
            Code::RecoveryAmbiguous,
            Phase::Recovery,
            FileKind::Staging,
        ));
    }
    validate_stage_state(p, metadata.device, metadata.inode)?;
    if entries.iter().any(|name| name == "generation") {
        let generation = p.join("generation");
        let children = names(&generation)?;
        if children.iter().any(|name| {
            !matches!(
                name.as_str(),
                "manifest.json" | "passages.colr" | "postings.colr" | "terms.colr"
            )
        }) {
            return Err(fail(
                Code::RecoveryAmbiguous,
                Phase::Recovery,
                FileKind::Staging,
            ));
        }
        for child in children {
            open_regular(&generation.join(&child), false)?;
            unlink_file(&generation.join(child))
                .map_err(|_| fail(Code::RecoveryAmbiguous, Phase::Recovery, FileKind::Staging))?;
        }
        unlink_dir(&generation)
            .map_err(|_| fail(Code::RecoveryAmbiguous, Phase::Recovery, FileKind::Staging))?;
    }
    for name in entries {
        if name == "generation" {
            continue;
        }
        open_regular(&p.join(&name), false)?;
        unlink_file(&p.join(name))
            .map_err(|_| fail(Code::RecoveryAmbiguous, Phase::Recovery, FileKind::Staging))?;
    }
    unlink_dir(p).map_err(|_| fail(Code::RecoveryAmbiguous, Phase::Recovery, FileKind::Staging))
}

fn write_stage_state(stage: &Path, attempt: &str) -> Result<()> {
    let metadata = managed_directory(stage)
        .map_err(|_| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Staging))?
        .identity();
    let bytes = format!(
        "{{\"attemptId\":\"{attempt}\",\"device\":{},\"inode\":{},\"version\":1}}",
        metadata.device, metadata.inode
    );
    if bytes.len() > 256 {
        return Err(fail(Code::IoWriteFailed, Phase::Staging, FileKind::Staging));
    }
    write_synced(&stage.join("STATE.json"), bytes.as_bytes())?;
    sync_dir(stage)
}

fn validate_stage_state(stage: &Path, device: u64, inode: u64) -> Result<()> {
    let attempt = stage
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| fail(Code::RecoveryAmbiguous, Phase::Recovery, FileKind::Staging))?;
    let bytes = read_regular(&stage.join("STATE.json"), 256)
        .map_err(|_| fail(Code::RecoveryAmbiguous, Phase::Recovery, FileKind::Staging))?;
    let expected = format!(
        "{{\"attemptId\":\"{attempt}\",\"device\":{device},\"inode\":{inode},\"version\":1}}"
    );
    if bytes != expected.as_bytes() {
        return Err(fail(
            Code::RecoveryAmbiguous,
            Phase::Recovery,
            FileKind::Staging,
        ));
    }
    Ok(())
}
fn create_dir(p: &Path) -> Result<()> {
    mutation_start("create-dir")
        .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?;
    let parent = managed_directory(
        p.parent()
            .ok_or_else(|| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Staging))?,
    )
    .map_err(|_| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Staging))?;
    let created = parent
        .create_dir(
            p.file_name()
                .and_then(|name| name.to_str())
                .ok_or_else(|| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Staging))?,
        )
        .map_err(|_| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Staging))?;
    if created.identity().device != parent.identity().device
        || created.identity().owner != uid()
        || created.identity().mode & 0o7777 != DIR_MODE
    {
        return Err(fail(Code::IoWriteFailed, Phase::Staging, FileKind::Staging));
    }
    Ok(())
}
fn open_regular(p: &Path, lock: bool) -> Result<File> {
    let parent = managed_directory(
        p.parent()
            .ok_or_else(|| fail(Code::InventoryInvalid, Phase::Root, FileKind::Root))?,
    )
    .map_err(|_| fail(Code::InventoryInvalid, Phase::Root, FileKind::Root))?;
    let opened = parent
        .open_file(
            p.file_name()
                .and_then(|name| name.to_str())
                .ok_or_else(|| fail(Code::InventoryInvalid, Phase::Root, FileKind::Root))?,
            lock,
        )
        .map_err(|_| {
            fail(
                Code::InventoryInvalid,
                Phase::Root,
                if lock { FileKind::Lock } else { FileKind::Root },
            )
        })?;
    let identity = opened.identity();
    if identity.links != 1
        || identity.owner != uid()
        || identity.mode & 0o7777 != FILE_MODE
        || identity.device != parent.identity().device
    {
        return Err(fail(
            if lock {
                Code::RootInvalid
            } else {
                Code::InventoryInvalid
            },
            Phase::Root,
            if lock { FileKind::Lock } else { FileKind::Root },
        ));
    }
    let file = opened
        .file()
        .try_clone()
        .map_err(|_| fail(Code::InventoryInvalid, Phase::Root, FileKind::Root))?;
    drop(opened);
    Ok(file)
}
fn write_synced(p: &Path, b: &[u8]) -> Result<()> {
    let recovery_state = p.file_name().is_some_and(|name| name == "STATE.json");
    if !recovery_state && injected("create").is_err() {
        return Err(fail(
            Code::IoWriteFailed,
            Phase::Staging,
            FileKind::Generation,
        ));
    }
    mutation_start("create-file")
        .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?;
    let parent = managed_directory(
        p.parent()
            .ok_or_else(|| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Generation))?,
    )
    .map_err(|_| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Generation))?;
    let mut opened = parent
        .create_file(
            p.file_name()
                .and_then(|name| name.to_str())
                .ok_or_else(|| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Generation))?,
        )
        .map_err(|_| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Generation))?;
    persistence_event(format!(
        "create:{}",
        p.file_name().unwrap().to_string_lossy()
    ));
    if opened.identity().device != parent.identity().device
        || opened.identity().owner != uid()
        || opened.identity().mode & 0o7777 != FILE_MODE
        || opened.identity().links != 1
    {
        return Err(fail(
            Code::IoWriteFailed,
            Phase::Staging,
            FileKind::Generation,
        ));
    }
    if !recovery_state && injected("short-write").is_err() {
        let prefix = b.len().saturating_sub(1).min(b.len() / 2);
        opened
            .write_all_checked(&b[..prefix])
            .map_err(|_| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Generation))?;
        return Err(fail(
            Code::IoWriteFailed,
            Phase::Staging,
            FileKind::Generation,
        ));
    }
    if !recovery_state && injected("write-enospc").is_err() {
        return Err(fail(
            Code::IoWriteFailed,
            Phase::Staging,
            FileKind::Generation,
        ));
    }
    mutation_start("write").map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?;
    opened
        .write_all_checked(b)
        .map_err(|_| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Generation))?;
    persistence_event(format!(
        "write:{}",
        p.file_name().unwrap().to_string_lossy()
    ));
    if !recovery_state && injected("file-sync").is_err() {
        return Err(fail(Code::SyncFailed, Phase::Staging, FileKind::Generation));
    }
    mutation_start("file-sync")
        .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?;
    opened
        .sync()
        .map_err(|_| fail(Code::SyncFailed, Phase::Staging, FileKind::Generation))?;
    persistence_event(format!(
        "file-sync:{}",
        p.file_name().unwrap().to_string_lossy()
    ));
    if !recovery_state && injected("full-sync").is_err() {
        return Err(fail(Code::SyncFailed, Phase::Staging, FileKind::Generation));
    }
    mutation_start("full-sync")
        .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?;
    full_sync(opened.file())?;
    persistence_event(format!(
        "full-sync:{}",
        p.file_name().unwrap().to_string_lossy()
    ));
    opened
        .verify_final(b.len() as u64)
        .map_err(|_| fail(Code::IoWriteFailed, Phase::Staging, FileKind::Generation))?;
    persistence_event(format!(
        "validate:{}",
        p.file_name().unwrap().to_string_lossy()
    ));
    Ok(())
}

fn read_regular(path: &Path, maximum: u64) -> std::io::Result<Vec<u8>> {
    let parent = managed_directory(
        path.parent()
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
    )?;
    let opened = parent.open_file(
        path.file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
        false,
    )?;
    let identity = opened.identity();
    if identity.device != parent.identity().device
        || identity.owner != uid()
        || identity.mode & 0o7777 != FILE_MODE
        || identity.links != 1
    {
        return Err(std::io::Error::from_raw_os_error(22));
    }
    opened.read_exact_bounded(maximum)
}
fn full_sync(f: &File) -> Result<()> {
    #[cfg(target_os = "macos")]
    {
        use std::os::fd::AsRawFd;
        if unsafe { fcntl(f.as_raw_fd(), F_FULLFSYNC) } != 0 {
            return Err(fail(Code::SyncFailed, Phase::Staging, FileKind::Generation));
        }
    }
    Ok(())
}
fn sync_dir(p: &Path) -> Result<()> {
    injected("directory-sync")?;
    mutation_start("directory-sync")
        .map_err(|_| fail(Code::RootInvalid, Phase::Root, FileKind::Root))?;
    managed_directory(p)
        .and_then(|directory| directory.sync())
        .map_err(|_| fail(Code::SyncFailed, Phase::Publication, FileKind::Root))?;
    persistence_event(format!(
        "dir-sync:{}",
        p.file_name().unwrap().to_string_lossy()
    ));
    Ok(())
}
fn publish_file(src: &Path, dst: &Path) -> Result<()> {
    match rename_no_replace(src, dst) {
        Ok(()) => {}
        Err(error) if error.raw_os_error() == Some(17) => {
            let a = read_regular(src, 32 * 1024 * 1024)
                .map_err(|_| fail(Code::IoWriteFailed, Phase::Publication, FileKind::Authority))?;
            let b = read_regular(dst, 32 * 1024 * 1024).map_err(|_| {
                fail(
                    Code::DigestMismatch,
                    Phase::Publication,
                    FileKind::Authority,
                )
            })?;
            if a != b {
                return Err(fail(
                    Code::DigestMismatch,
                    Phase::Publication,
                    FileKind::Authority,
                ));
            }
            unlink_file(src)
                .map_err(|_| fail(Code::IoWriteFailed, Phase::Publication, FileKind::Authority))?;
        }
        Err(_) => {
            return Err(fail(
                Code::IoWriteFailed,
                Phase::Publication,
                FileKind::Authority,
            ));
        }
    }
    sync_dir(src.parent().unwrap())?;
    sync_dir(dst.parent().unwrap())
}
fn publish_generation(src: &Path, dst: &Path, d: Digest32) -> Result<()> {
    match rename_no_replace(src, dst) {
        Ok(()) => {}
        Err(error) if error.raw_os_error() == Some(17) => {
            validate_generation_dir(dst, d)?;
            remove_staged_generation(src)?;
        }
        Err(_) => {
            return Err(fail(
                Code::IoWriteFailed,
                Phase::Publication,
                FileKind::Generation,
            ));
        }
    }
    sync_dir(src.parent().unwrap())?;
    sync_dir(dst.parent().unwrap())
}

fn rename_no_replace(source: &Path, destination: &Path) -> std::io::Result<()> {
    if injected("immutable-rename").is_err() {
        return Err(std::io::Error::from_raw_os_error(28));
    }
    mutation_start("no-replace-rename")?;
    let source_parent = managed_directory(
        source
            .parent()
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
    )?;
    let destination_parent = managed_directory(
        destination
            .parent()
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
    )?;
    if source_parent.identity().device != destination_parent.identity().device {
        return Err(std::io::Error::from_raw_os_error(18));
    }
    source_parent.rename_exclusive(
        source
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
        &destination_parent,
        destination
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
    )?;
    persistence_event(format!(
        "rename-excl:{}",
        destination.file_name().unwrap().to_string_lossy()
    ));
    Ok(())
}

fn rename_replace(source: &Path, destination: &Path) -> std::io::Result<()> {
    mutation_start("selector-rename")?;
    let source_parent = managed_directory(
        source
            .parent()
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
    )?;
    let destination_parent = managed_directory(
        destination
            .parent()
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
    )?;
    if source_parent.identity().device != destination_parent.identity().device {
        return Err(std::io::Error::from_raw_os_error(18));
    }
    source_parent.rename_replace(
        source
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
        &destination_parent,
        destination
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
    )?;
    persistence_event(format!(
        "selector-rename:{}",
        destination.file_name().unwrap().to_string_lossy()
    ));
    Ok(())
}

fn unlink_file(path: &Path) -> std::io::Result<()> {
    mutation_start("unlink-file")?;
    let parent = managed_directory(
        path.parent()
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
    )?;
    parent.unlink_file(
        path.file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
    )?;
    persistence_event(format!(
        "unlink-file:{}",
        path.file_name().unwrap().to_string_lossy()
    ));
    Ok(())
}

fn unlink_dir(path: &Path) -> std::io::Result<()> {
    mutation_start("unlink-dir")?;
    let parent = managed_directory(
        path.parent()
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
    )?;
    parent.unlink_dir(
        path.file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| std::io::Error::from_raw_os_error(22))?,
    )?;
    persistence_event(format!(
        "unlink-dir:{}",
        path.file_name().unwrap().to_string_lossy()
    ));
    Ok(())
}

fn remove_staged_generation(path: &Path) -> Result<()> {
    let entries = names(path)?;
    if entries
        != [
            "manifest.json",
            "passages.colr",
            "postings.colr",
            "terms.colr",
        ]
    {
        return Err(fail(
            Code::RecoveryAmbiguous,
            Phase::Publication,
            FileKind::Generation,
        ));
    }
    for name in entries {
        open_regular(&path.join(&name), false)?;
        unlink_file(&path.join(name)).map_err(|_| {
            fail(
                Code::IoWriteFailed,
                Phase::Publication,
                FileKind::Generation,
            )
        })?;
    }
    unlink_dir(path).map_err(|_| {
        fail(
            Code::IoWriteFailed,
            Phase::Publication,
            FileKind::Generation,
        )
    })
}
fn validate_generation_dir(p: &Path, d: Digest32) -> Result<()> {
    open_generation(p, d).map(|_| ())
}

fn open_generation(p: &Path, d: Digest32) -> Result<Reader> {
    if names(p)?
        != [
            "manifest.json",
            "passages.colr",
            "postings.colr",
            "terms.colr",
        ]
    {
        return Err(fail(
            Code::InventoryInvalid,
            Phase::Validation,
            FileKind::Generation,
        ));
    }
    let m = read_regular(&p.join("manifest.json"), 65_536).map_err(|_| {
        fail(
            Code::ReaderValidationFailed,
            Phase::Validation,
            FileKind::Generation,
        )
    })?;
    if digest(&m) != d {
        return Err(fail(
            Code::DigestMismatch,
            Phase::Validation,
            FileKind::Generation,
        ));
    }
    let pa = read_regular(&p.join("passages.colr"), 16 * 1024 * 1024).map_err(|_| {
        fail(
            Code::ReaderValidationFailed,
            Phase::Validation,
            FileKind::Generation,
        )
    })?;
    let te = read_regular(&p.join("terms.colr"), 16 * 1024 * 1024).map_err(|_| {
        fail(
            Code::ReaderValidationFailed,
            Phase::Validation,
            FileKind::Generation,
        )
    })?;
    let po = read_regular(&p.join("postings.colr"), 16 * 1024 * 1024).map_err(|_| {
        fail(
            Code::ReaderValidationFailed,
            Phase::Validation,
            FileKind::Generation,
        )
    })?;
    let manifest_source = Memory(&m);
    let passages_source = Memory(&pa);
    let terms_source = Memory(&te);
    let postings_source = Memory(&po);
    let sources: Sources<'_> = BTreeMap::from([
        ("manifest.json", &manifest_source as &dyn ReadAtV1),
        ("passages.colr", &passages_source as &dyn ReadAtV1),
        ("terms.colr", &terms_source as &dyn ReadAtV1),
        ("postings.colr", &postings_source as &dyn ReadAtV1),
    ]);
    let reader = Reader::open(&sources, ReaderLimits::default()).map_err(|_| {
        fail(
            Code::ReaderValidationFailed,
            Phase::Validation,
            FileKind::Generation,
        )
    })?;
    persistence_event(format!(
        "validate-generation:{}",
        p.file_name().unwrap().to_string_lossy()
    ));
    Ok(reader)
}
fn attempt_id(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 64
        && s.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
}
fn hex_name(s: &str) -> bool {
    s.len() == 64
        && s.bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn parse_hex_name(value: &str) -> Result<Digest32> {
    if !hex_name(value) {
        return Err(fail(Code::InventoryInvalid, Phase::Root, FileKind::Root));
    }
    let mut digest = [0; 32];
    for (index, byte) in digest.iter_mut().enumerate() {
        *byte = u8::from_str_radix(&value[index * 2..index * 2 + 2], 16)
            .map_err(|_| fail(Code::InventoryInvalid, Phase::Root, FileKind::Root))?;
    }
    Ok(digest)
}
fn hex(d: Digest32) -> String {
    d.iter().map(|b| format!("{b:02x}")).collect()
}

struct Chain {
    manifest: Digest32,
    authority: Digest32,
    source: Digest32,
    tombstone: Digest32,
    watermark: u64,
    decision: String,
    scope: Digest32,
    authority_record: AuthorityRecord,
    tombstone_record: TombstoneRecord,
}
struct Selector {
    manifest: Digest32,
    previous: Option<Digest32>,
    tombstone: Digest32,
    watermark: u64,
}
fn validate_chain(t: &Path, m: Digest32) -> Result<Chain> {
    let reader = open_generation(&t.join("generations").join(hex(m)), m)?;
    let rb = read_regular(&t.join("receipts").join(format!("{}.json", hex(m))), 8_192)
        .map_err(|_| fail(Code::DigestMismatch, Phase::Validation, FileKind::Receipt))?;
    let receipt = parse_receipt(&rb)
        .map_err(|_| fail(Code::DigestMismatch, Phase::Validation, FileKind::Receipt))?;
    if receipt.manifest_digest != m {
        return Err(fail(
            Code::DigestMismatch,
            Phase::Validation,
            FileKind::Receipt,
        ));
    }
    let authority = receipt.build_authority_digest;
    let source = receipt.source_manifest_digest;
    let tombstone = receipt.tombstone_inventory_digest;
    let generation = t.join("generations").join(hex(m));
    for (name, binding) in [
        ("manifest.json", &receipt.manifest),
        ("passages.colr", &receipt.passages),
        ("postings.colr", &receipt.postings),
        ("terms.colr", &receipt.terms),
    ] {
        let bytes = read_regular(&generation.join(name), 16 * 1024 * 1024)
            .map_err(|_| fail(Code::DigestMismatch, Phase::Validation, FileKind::Receipt))?;
        if bytes.len() as u64 != binding.length || digest(&bytes) != binding.sha256 {
            return Err(fail(
                Code::DigestMismatch,
                Phase::Validation,
                FileKind::Receipt,
            ));
        }
    }
    let ab = read_regular(
        t.join("authorities/build")
            .join(format!("{}.json", hex(authority)))
            .as_path(),
        65_536,
    )
    .map_err(|_| fail(Code::DigestMismatch, Phase::Validation, FileKind::Authority))?;
    if digest(&ab) != authority {
        return Err(fail(
            Code::DigestMismatch,
            Phase::Validation,
            FileKind::Authority,
        ));
    }
    let sb = read_regular(
        t.join("authorities/source")
            .join(format!("{}.json", hex(source)))
            .as_path(),
        65_536,
    )
    .map_err(|_| fail(Code::DigestMismatch, Phase::Validation, FileKind::Source))?;
    if digest(&sb) != source {
        return Err(fail(
            Code::DigestMismatch,
            Phase::Validation,
            FileKind::Source,
        ));
    }
    let tb = read_regular(
        t.join("authorities/tombstones")
            .join(format!("{}.json", hex(tombstone)))
            .as_path(),
        1_048_576,
    )
    .map_err(|_| fail(Code::DigestMismatch, Phase::Validation, FileKind::Tombstone))?;
    if digest(&tb) != tombstone {
        return Err(fail(
            Code::DigestMismatch,
            Phase::Validation,
            FileKind::Tombstone,
        ));
    }
    let authority_record = parse_authority(&ab)
        .map_err(|_| fail(Code::DigestMismatch, Phase::Validation, FileKind::Authority))?;
    let source_record = parse_source(&sb)
        .map_err(|_| fail(Code::DigestMismatch, Phase::Validation, FileKind::Source))?;
    let tombstone_record = parse_tombstone(&tb)
        .map_err(|_| fail(Code::DigestMismatch, Phase::Validation, FileKind::Tombstone))?;
    if !canonical::limits_valid(&authority_record.limits)
        || source_record.build_authority_digest != authority
        || authority_record.tombstone_inventory_digest != tombstone
        || source_record.tombstone_inventory_digest != tombstone
        || source_record.passage_inventory_digest != authority_record.passage_inventory_digest
        || source_record.tombstone_watermark != authority_record.tombstone_watermark
        || source_record.tombstone_watermark != tombstone_record.watermark
        || source_record.cell_id != authority_record.cell_id
        || source_record.cell_id != reader.manifest.cell_id
        || source_record.passage_count != reader.manifest.passage_count
        || source_record.tombstone_watermark != reader.manifest.tombstone_watermark
        || source != reader.manifest.source_manifest_digest
    {
        return Err(fail(
            Code::DigestMismatch,
            Phase::Validation,
            FileKind::Authority,
        ));
    }
    let mut inventory = Vec::new();
    for passage in &reader.passages {
        if passage.tombstone_sequence != 0
            || tombstone_record
                .entries
                .iter()
                .any(|entry| entry.passage_id == passage.passage_id)
        {
            return Err(fail(
                Code::TombstoneRegression,
                Phase::Validation,
                FileKind::Tombstone,
            ));
        }
        let value = BuildPassageV1 {
            passage_id: passage.passage_id.clone(),
            source_object_id: passage.source_object_id.clone(),
            revision_id: passage.revision_id.clone(),
            capture_id: passage.capture_id.clone(),
            representation_id: passage.representation_id.clone(),
            cell_id: passage.cell_id.clone(),
            admission_id: passage.admission_id.clone(),
            revision_scope_digest: passage.revision_scope_digest,
            revision_policy_digest: passage.revision_policy_digest,
            title: passage.title.clone(),
            text: passage.text.clone(),
            locator_display: passage.locator_display.clone(),
            media_type: passage.media_type.clone(),
            language: passage.language.clone(),
            observed_at: passage.observed_at,
            published_at: (passage.published_at != i64::MIN).then_some(passage.published_at),
            source_class: passage.source_class.clone(),
            authority_scope_digest: passage.authority_scope_digest,
            tombstone_sequence: passage.tombstone_sequence,
        };
        let object = canonical::passage_json(&value);
        inventory.extend_from_slice(&(object.len() as u64).to_le_bytes());
        inventory.extend_from_slice(object.as_bytes());
    }
    if digest(&inventory) != source_record.passage_inventory_digest {
        return Err(fail(
            Code::DigestMismatch,
            Phase::Validation,
            FileKind::Source,
        ));
    }
    Ok(Chain {
        manifest: m,
        authority,
        source,
        tombstone,
        watermark: authority_record.tombstone_watermark,
        decision: authority_record.authorization_decision_id.clone(),
        scope: authority_record.authorization_scope_digest,
        authority_record,
        tombstone_record,
    })
}
fn tombstone_superset(old: &TombstoneRecord, new: &TombstoneRecord) -> bool {
    old.entries.iter().all(|entry| {
        new.entries
            .binary_search_by(|candidate| {
                candidate
                    .passage_id
                    .as_bytes()
                    .cmp(entry.passage_id.as_bytes())
            })
            .is_ok_and(|index| new.entries[index] == *entry)
    })
}
fn selector_bytes(c: &Chain, p: Option<Digest32>) -> Vec<u8> {
    format!("{{\"authorizationDecisionId\":\"{}\",\"authorizationScopeDigest\":\"{}\",\"buildAuthorityDigest\":\"{}\",\"format\":\"curiosity-owned-lexical-active\",\"manifestDigest\":\"{}\",\"previousManifestDigest\":{},\"tombstoneInventoryDigest\":\"{}\",\"tombstoneWatermark\":{},\"sourceManifestDigest\":\"{}\",\"version\":1}}",c.decision,hex(c.scope),hex(c.authority),hex(c.manifest),p.map(|d|format!("\"{}\"",hex(d))).unwrap_or_else(||"null".into()),hex(c.tombstone),c.watermark,hex(c.source)).into_bytes()
}
fn read_selector(t: &Path) -> Result<Option<Selector>> {
    let p = t.join("ACTIVE.json");
    let b = match read_regular(&p, 1_024) {
        Ok(bytes) => bytes,
        Err(error) if error.raw_os_error() == Some(2) => return Ok(None),
        Err(_) => {
            return Err(fail(
                Code::SelectorInvalid,
                Phase::Recovery,
                FileKind::Selector,
            ));
        }
    };
    if b.len() > 1024 {
        return Err(fail(
            Code::SelectorInvalid,
            Phase::Recovery,
            FileKind::Selector,
        ));
    }
    let parsed: SelectorRecord = parse_selector(&b)
        .map_err(|_| fail(Code::SelectorInvalid, Phase::Recovery, FileKind::Selector))?;
    let c = validate_chain(t, parsed.manifest_digest)?;
    if parsed.build_authority_digest != c.authority
        || parsed.source_manifest_digest != c.source
        || parsed.tombstone_inventory_digest != c.tombstone
        || parsed.tombstone_watermark != c.watermark
        || parsed.authorization_decision_id != c.decision
        || parsed.authorization_scope_digest != c.scope
        || selector_bytes(&c, parsed.previous_manifest_digest) != b
    {
        return Err(fail(
            Code::SelectorInvalid,
            Phase::Recovery,
            FileKind::Selector,
        ));
    }
    if let Some(previous) = parsed.previous_manifest_digest {
        validate_chain(t, previous)
            .map_err(|_| fail(Code::SelectorInvalid, Phase::Recovery, FileKind::Selector))?;
    }
    Ok(Some(Selector {
        manifest: parsed.manifest_digest,
        previous: parsed.previous_manifest_digest,
        tombstone: parsed.tombstone_inventory_digest,
        watermark: parsed.tombstone_watermark,
    }))
}
