pub(super) type Digest32 = [u8; 32];

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct BuildLimitsV1 {
    pub max_passages: u32,
    pub max_terms: u32,
    pub max_postings: u64,
    pub max_artifact_bytes: u64,
    pub max_total_artifact_bytes: u64,
    pub max_source_bytes: u64,
    pub max_token_emissions: u64,
    pub max_retained_logical_bytes: u64,
}
impl Default for BuildLimitsV1 {
    fn default() -> Self {
        Self {
            max_passages: 10_000,
            max_terms: 100_000,
            max_postings: 1_000_000,
            max_artifact_bytes: 16 * 1024 * 1024,
            max_total_artifact_bytes: 32 * 1024 * 1024,
            max_source_bytes: 32 * 1024 * 1024,
            max_token_emissions: 2_000_000,
            max_retained_logical_bytes: 16 * 1024 * 1024,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct BuildAuthorityV1 {
    pub authority_id: String,
    pub authorization_decision_id: String,
    pub authorization_scope_digest: Digest32,
    pub cell_id: String,
    pub passage_inventory_digest: Digest32,
    pub tombstone_inventory_digest: Digest32,
    pub tombstone_watermark: u64,
    pub limits: BuildLimitsV1,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct BuildPassageV1 {
    pub passage_id: String,
    pub source_object_id: String,
    pub revision_id: String,
    pub capture_id: String,
    pub representation_id: String,
    pub cell_id: String,
    pub admission_id: String,
    pub revision_scope_digest: Digest32,
    pub revision_policy_digest: Digest32,
    pub title: String,
    pub text: String,
    pub locator_display: String,
    pub media_type: String,
    pub language: String,
    pub observed_at: i64,
    pub published_at: Option<i64>,
    pub source_class: String,
    pub authority_scope_digest: Digest32,
    pub tombstone_sequence: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct TombstoneEntryV1 {
    pub passage_id: String,
    pub authority_scope_digest: Digest32,
    pub effective_sequence: u64,
    pub reason_digest: Digest32,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct TombstoneInventoryV1 {
    pub watermark: u64,
    pub entries: Vec<TombstoneEntryV1>,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct BuildInputV1 {
    pub authority: BuildAuthorityV1,
    pub passages: Vec<BuildPassageV1>,
    pub tombstones: TombstoneInventoryV1,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct PreparedPassage {
    pub value: BuildPassageV1,
    pub ordinal: u32,
    pub title_tokens: Vec<Vec<u8>>,
    pub text_tokens: Vec<Vec<u8>>,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct PreparedBuild {
    pub passages: Vec<PreparedPassage>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct BuildOutputV1 {
    pub build_authority: Vec<u8>,
    pub source_manifest: Vec<u8>,
    pub tombstone_inventory: Vec<u8>,
    pub manifest: Vec<u8>,
    pub passages: Vec<u8>,
    pub terms: Vec<u8>,
    pub postings: Vec<u8>,
    pub receipt: Vec<u8>,
    pub build_authority_digest: Digest32,
    pub source_manifest_digest: Digest32,
    pub tombstone_inventory_digest: Digest32,
    pub manifest_digest: Digest32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(super) enum Code {
    BuildInputInvalid,
    BuildResourceLimit,
    BuildEncodingFailed,
    RootInvalid,
    RootResourceLimit,
    LockUnavailable,
    InventoryInvalid,
    IoWriteFailed,
    SyncFailed,
    ReaderValidationFailed,
    DigestMismatch,
    SelectorInvalid,
    SelectorCommitIndeterminate,
    CasMismatch,
    AuthorizationInvalid,
    TombstoneRegression,
    RollbackInvalid,
    RecoveryAmbiguous,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(super) enum Phase {
    Input,
    Sizing,
    Root,
    Lock,
    Recovery,
    Staging,
    Validation,
    Publication,
    SelectorPreCommit,
    SelectorPostCommit,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(super) enum FileKind {
    Source,
    Authority,
    Tombstone,
    Generation,
    Receipt,
    Selector,
    Root,
    Lock,
    Staging,
}
#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct Failure {
    pub code: Code,
    pub phase: Phase,
    pub file: FileKind,
    pub offset_or_count: Option<u64>,
    pub observed_selector_digest: Option<Digest32>,
}
impl Failure {
    pub fn new(code: Code, phase: Phase, file: FileKind) -> Self {
        Self {
            code,
            phase,
            file,
            offset_or_count: None,
            observed_selector_digest: None,
        }
    }
}
pub(super) type Result<T> = std::result::Result<T, Failure>;
