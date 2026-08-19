use std::collections::BTreeMap;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(super) enum Code {
    IoReadFailed,
    ResourceLimit,
    ManifestInvalid,
    FormatUnsupported,
    BoundsInvalid,
    ChecksumMismatch,
    Utf8Invalid,
    RecordInvalid,
    QueryUnsupported,
    QueryBindingMismatch,
    TombstoneInvalid,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(super) struct Failure {
    pub code: Code,
    pub file: Option<&'static str>,
    pub offset: Option<u64>,
    pub counters: Counters,
    pub telemetry: Telemetry,
}

pub(super) type Result<T> = std::result::Result<T, Failure>;

#[derive(Clone, Debug, Default, Eq, PartialEq)]
#[allow(clippy::struct_field_names)]
pub(super) struct Counters {
    pub passages_decoded: u64,
    pub terms_decoded: u64,
    pub postings_decoded: u64,
    pub ast_nodes: u64,
    pub analyzed_term_occurrences: u64,
    pub unique_posting_terms: u64,
    pub posting_pairs_evaluated: u64,
    pub candidate_documents: u64,
    pub scored_document_term_pairs: u64,
}

#[derive(Clone, Debug, Default, Eq, PartialEq)]
pub(super) struct Telemetry {
    pub read_calls: u64,
    pub requested_read_bytes: u64,
    pub allocated_bytes_high_water: u64,
    pub current_allocated_bytes: u64,
}

#[derive(Clone, Debug)]
pub(super) struct Limits {
    pub max_manifest_bytes: u64,
    pub max_artifact_bytes: u64,
    pub max_total_artifact_bytes: u64,
    pub max_passages: u64,
    pub max_terms: u64,
    pub max_postings: u64,
    pub max_allocation: u64,
    pub max_retained: u64,
    pub max_read_bytes: u64,
    pub max_read_calls: u64,
    pub max_evaluated_pairs: u64,
    pub max_scored_pairs: u64,
    pub max_tombstones: u64,
    pub max_tombstone_bytes: u64,
    pub max_ast_nodes: u64,
    pub max_depth: u64,
    pub max_filters: u64,
    pub max_query_string_bytes: u64,
    pub max_analyzed_terms: u64,
    pub max_unique_terms: u64,
    pub max_limit: u32,
}

impl Default for Limits {
    fn default() -> Self {
        Self {
            max_manifest_bytes: 65_536,
            max_artifact_bytes: 16 * 1_024 * 1_024,
            max_total_artifact_bytes: 32 * 1_024 * 1_024,
            max_passages: 10_000,
            max_terms: 100_000,
            max_postings: 1_000_000,
            max_allocation: 1_024 * 1_024,
            max_retained: 16 * 1_024 * 1_024,
            max_read_bytes: 64 * 1_024 * 1_024,
            max_read_calls: 1_000_000,
            max_evaluated_pairs: 1_000_000,
            max_scored_pairs: 1_000_000,
            max_tombstones: 10_000,
            max_tombstone_bytes: 1_024 * 1_024,
            max_ast_nodes: 64,
            max_depth: 8,
            max_filters: 16,
            max_query_string_bytes: 4_096,
            max_analyzed_terms: 64,
            max_unique_terms: 128,
            max_limit: 100,
        }
    }
}

#[derive(Clone, Debug)]
pub(super) struct Manifest {
    pub generation_id: String,
    pub cell_id: String,
    pub passage_count: u32,
    pub tombstone_watermark: u64,
    pub source_manifest_digest: [u8; 32],
    pub artifacts: BTreeMap<&'static str, (u64, [u8; 32])>,
}

#[derive(Clone, Debug)]
pub(super) struct Passage {
    pub passage_id: String,
    pub source_object_id: String,
    pub revision_id: String,
    pub capture_id: String,
    pub representation_id: String,
    pub cell_id: String,
    pub admission_id: String,
    pub revision_scope_digest: [u8; 32],
    pub revision_policy_digest: [u8; 32],
    pub title: String,
    pub text: String,
    pub locator_display: String,
    pub media_type: String,
    pub language: String,
    pub observed_at: i64,
    pub published_at: i64,
    pub source_class: String,
    pub authority_scope_digest: [u8; 32],
    pub tombstone_sequence: u64,
    pub title_token_count: u32,
    pub text_token_count: u32,
}

#[derive(Clone, Debug)]
pub(super) struct Term {
    pub field: u8,
    pub bytes: Vec<u8>,
    pub df: u32,
    pub total_tf: u64,
    pub offset: u64,
    pub length: u64,
    pub postings: Vec<(u32, u32)>,
}

#[derive(Clone, Debug)]
pub(super) struct Reader {
    pub manifest: Manifest,
    pub passages: Vec<Passage>,
    pub terms: Vec<Term>,
    pub counters: Counters,
    pub telemetry: Telemetry,
    pub limits: Limits,
}

#[derive(Clone, Copy, Debug)]
pub(super) enum MatchFieldV1 {
    Title,
    Text,
    All,
}
#[derive(Clone, Copy, Debug)]
pub(super) enum MatchModeV1 {
    Any,
    All,
}
#[derive(Clone, Debug)]
pub(super) enum ExpressionV1 {
    Match {
        field: MatchFieldV1,
        mode: MatchModeV1,
        text: String,
    },
    All(Vec<ExpressionV1>),
    Any(Vec<ExpressionV1>),
    Not(Box<ExpressionV1>),
}
#[derive(Clone, Copy, Debug)]
pub(super) enum EqFieldV1 {
    PassageId,
    SourceObjectId,
    RevisionId,
    CaptureId,
    RepresentationId,
    Language,
    MediaType,
    SourceClass,
}
#[derive(Clone, Copy, Debug)]
pub(super) enum TimeFieldV1 {
    ObservedAt,
    PublishedAt,
}
#[derive(Clone, Debug)]
pub(super) enum FilterV1 {
    Eq {
        field: EqFieldV1,
        value: String,
    },
    TimeRange {
        field: TimeFieldV1,
        gte: Option<i64>,
        lt: Option<i64>,
    },
}
#[derive(Clone, Debug)]
pub(super) struct QueryV1 {
    pub version: QueryVersionV1,
    pub generation_id: String,
    pub cell_id: String,
    pub expression: ExpressionV1,
    pub filters: Vec<FilterV1>,
    pub limit: u32,
}
#[derive(Clone, Copy, Debug)]
pub(super) enum QueryVersionV1 {
    V1,
}
#[derive(Clone, Debug)]
pub(super) struct TombstoneInputV1 {
    pub watermark: u64,
    pub passage_ids: Vec<String>,
}

#[derive(Clone, Debug)]
pub(super) struct Hit {
    pub passage_id: String,
    pub source_object_id: String,
    pub revision_id: String,
    pub capture_id: String,
    pub representation_id: String,
    pub admission_id: String,
    pub revision_scope_digest: [u8; 32],
    pub revision_policy_digest: [u8; 32],
    pub authority_scope_digest: [u8; 32],
    pub locator_display: String,
    pub score_bits: u64,
    pub rank_score: i64,
}

pub(super) fn fail(
    code: Code,
    file: Option<&'static str>,
    offset: Option<u64>,
    counters: &Counters,
) -> Failure {
    Failure {
        code,
        file,
        offset,
        counters: counters.clone(),
        telemetry: Telemetry::default(),
    }
}

pub(super) fn fail_with_telemetry(
    code: Code,
    file: Option<&'static str>,
    offset: Option<u64>,
    counters: &Counters,
    telemetry: &Telemetry,
) -> Failure {
    Failure {
        code,
        file,
        offset,
        counters: counters.clone(),
        telemetry: telemetry.clone(),
    }
}
