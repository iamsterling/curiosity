use std::cell::{Cell, RefCell};
use std::collections::{BTreeMap, BTreeSet};
use std::rc::Rc;

use super::analyzer::{TokenTooLong, analyze};
use super::model::*;
use super::query::ln_colr_v1;
use super::sha256::Sha256;
use super::source::{ReadAtV1, Sources};

const MANIFEST: &[u8] =
    include_bytes!("../../../fixtures/owned-lexical-reader/golden-three-v1/manifest.json");
const PASSAGES: &[u8] =
    include_bytes!("../../../fixtures/owned-lexical-reader/golden-three-v1/passages.colr");
const TERMS: &[u8] =
    include_bytes!("../../../fixtures/owned-lexical-reader/golden-three-v1/terms.colr");
const POSTINGS: &[u8] =
    include_bytes!("../../../fixtures/owned-lexical-reader/golden-three-v1/postings.colr");
const SOURCE_MANIFEST: &[u8] =
    include_bytes!("../../../fixtures/owned-lexical-reader/golden-three-v1/source-manifest.json");
const RECIPE: &[u8] =
    include_bytes!("../../../fixtures/owned-lexical-reader/golden-three-v1.recipe.json");
const SOURCE_MANIFEST_DIGEST: [u8; 32] = [
    0xad, 0xed, 0x5d, 0x41, 0xb2, 0x17, 0x25, 0x74, 0x27, 0x77, 0x55, 0xce, 0x24, 0x0a, 0x0f, 0xeb,
    0xd1, 0x12, 0x4b, 0xf3, 0x8a, 0x0f, 0xc1, 0x80, 0x69, 0x01, 0xb6, 0x25, 0xb0, 0xd3, 0xf6, 0xc2,
];

struct Memory {
    bytes: Vec<u8>,
    calls: Cell<u64>,
    fail: Cell<bool>,
    changed: Cell<bool>,
    change_after_read: Cell<bool>,
}
impl Memory {
    fn new(bytes: &[u8]) -> Self {
        Self {
            bytes: bytes.to_vec(),
            calls: Cell::new(0),
            fail: Cell::new(false),
            changed: Cell::new(false),
            change_after_read: Cell::new(false),
        }
    }
}
impl ReadAtV1 for Memory {
    fn len(&self) -> u64 {
        self.bytes.len() as u64 + u64::from(self.changed.get())
    }
    fn read_at(&self, offset: u64, destination: &mut [u8]) -> std::result::Result<(), ()> {
        self.calls.set(self.calls.get() + 1);
        if self.fail.get() {
            return Err(());
        }
        let start = usize::try_from(offset).map_err(|_| ())?;
        let end = start.checked_add(destination.len()).ok_or(())?;
        destination.copy_from_slice(self.bytes.get(start..end).ok_or(())?);
        if self.change_after_read.get() {
            self.changed.set(true);
        }
        Ok(())
    }
}
struct ChunkedMemory {
    bytes: Vec<u8>,
    chunk: usize,
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct ReadEvent {
    file: &'static str,
    offset: u64,
    length: u64,
}

#[derive(Default)]
struct IndexedReadState {
    calls: Cell<u64>,
    fail_at: Cell<u64>,
    events: RefCell<Vec<ReadEvent>>,
}

struct IndexedMemory {
    file: &'static str,
    bytes: &'static [u8],
    state: Rc<IndexedReadState>,
}

impl ReadAtV1 for IndexedMemory {
    fn len(&self) -> u64 {
        self.bytes.len() as u64
    }

    fn read_at(&self, offset: u64, destination: &mut [u8]) -> std::result::Result<(), ()> {
        let call = self.state.calls.get() + 1;
        self.state.calls.set(call);
        self.state.events.borrow_mut().push(ReadEvent {
            file: self.file,
            offset,
            length: destination.len() as u64,
        });
        if call == self.state.fail_at.get() {
            return Err(());
        }
        let start = usize::try_from(offset).map_err(|_| ())?;
        let end = start.checked_add(destination.len()).ok_or(())?;
        destination.copy_from_slice(self.bytes.get(start..end).ok_or(())?);
        Ok(())
    }
}

struct IndexedFixture {
    state: Rc<IndexedReadState>,
    manifest: IndexedMemory,
    passages: IndexedMemory,
    terms: IndexedMemory,
    postings: IndexedMemory,
}

impl IndexedFixture {
    fn new(fail_at: u64) -> Self {
        let state = Rc::new(IndexedReadState::default());
        state.fail_at.set(fail_at);
        Self {
            manifest: IndexedMemory {
                file: "manifest.json",
                bytes: MANIFEST,
                state: Rc::clone(&state),
            },
            passages: IndexedMemory {
                file: "passages.colr",
                bytes: PASSAGES,
                state: Rc::clone(&state),
            },
            terms: IndexedMemory {
                file: "terms.colr",
                bytes: TERMS,
                state: Rc::clone(&state),
            },
            postings: IndexedMemory {
                file: "postings.colr",
                bytes: POSTINGS,
                state: Rc::clone(&state),
            },
            state,
        }
    }

    fn sources(&self) -> Sources<'_> {
        BTreeMap::from([
            ("manifest.json", &self.manifest as &dyn ReadAtV1),
            ("passages.colr", &self.passages),
            ("terms.colr", &self.terms),
            ("postings.colr", &self.postings),
        ])
    }
}
impl ReadAtV1 for ChunkedMemory {
    fn len(&self) -> u64 {
        self.bytes.len() as u64
    }
    fn read_at(&self, offset: u64, destination: &mut [u8]) -> std::result::Result<(), ()> {
        let start = usize::try_from(offset).map_err(|_| ())?;
        let end = start.checked_add(destination.len()).ok_or(())?;
        let source = self.bytes.get(start..end).ok_or(())?;
        for (output, input) in destination
            .chunks_mut(self.chunk)
            .zip(source.chunks(self.chunk))
        {
            output.copy_from_slice(input);
        }
        Ok(())
    }
}
struct Fixture {
    manifest: Memory,
    passages: Memory,
    terms: Memory,
    postings: Memory,
}
impl Fixture {
    fn golden() -> Self {
        Self {
            manifest: Memory::new(MANIFEST),
            passages: Memory::new(PASSAGES),
            terms: Memory::new(TERMS),
            postings: Memory::new(POSTINGS),
        }
    }
    fn sources(&self) -> Sources<'_> {
        BTreeMap::from([
            ("manifest.json", &self.manifest as &dyn ReadAtV1),
            ("passages.colr", &self.passages),
            ("terms.colr", &self.terms),
            ("postings.colr", &self.postings),
        ])
    }
}
fn reader() -> Reader {
    let f = Fixture::golden();
    Reader::open(&f.sources(), Limits::default()).expect("golden opens")
}
fn reader_with_limits(limits: Limits) -> Reader {
    let f = Fixture::golden();
    Reader::open(&f.sources(), limits).expect("golden opens under query limits")
}
fn match_all(text: &str) -> QueryV1 {
    QueryV1 {
        version: QueryVersionV1::V1,
        generation_id: "golden-three-v1".into(),
        cell_id: "golden-cell".into(),
        expression: ExpressionV1::Match {
            field: MatchFieldV1::All,
            mode: MatchModeV1::Any,
            text: text.into(),
        },
        filters: vec![],
        limit: 3,
    }
}
fn no_tomb() -> TombstoneInputV1 {
    TombstoneInputV1 {
        watermark: 7,
        passage_ids: vec![],
    }
}

#[test]
fn golden_ranking_counters_tombstones_and_repeated_reads_are_exact() {
    for _ in 0..2 {
        let reader = reader();
        assert_eq!(
            (
                reader.counters.passages_decoded,
                reader.counters.terms_decoded,
                reader.counters.postings_decoded
            ),
            (3, 4, 8)
        );
        let output = reader
            .query(
                &match_all("rust search"),
                &TombstoneInputV1 {
                    watermark: 7,
                    passage_ids: vec!["p-tomb".into()],
                },
            )
            .unwrap();
        assert_eq!(
            output
                .hits
                .iter()
                .map(|h| (&h.passage_id, h.score_bits, h.rank_score))
                .collect::<Vec<_>>(),
            vec![
                (&"p-alpha".into(), 0x40061932874db05d, 2_762_303_407),
                (&"p-beta".into(), 0x3ff34edd10abeaf8, 1_206_753_793)
            ]
        );
        assert_eq!(
            (
                output.counters.ast_nodes,
                output.counters.analyzed_term_occurrences,
                output.counters.unique_posting_terms,
                output.counters.posting_pairs_evaluated,
                output.counters.candidate_documents,
                output.counters.scored_document_term_pairs
            ),
            (1, 2, 4, 8, 3, 6)
        );
    }
    let output = reader()
        .query(&match_all("rust search"), &no_tomb())
        .unwrap();
    assert_eq!(
        output
            .hits
            .iter()
            .map(|h| h.passage_id.as_str())
            .collect::<Vec<_>>(),
        vec!["p-alpha", "p-beta", "p-tomb"]
    );
    assert_eq!(output.counters.scored_document_term_pairs, 8);
}

#[test]
fn golden_source_binding_and_independent_recipe_are_pinned_outside_the_receipt() {
    assert_eq!(SOURCE_MANIFEST, b"{\"fixture\":\"golden-three-v1\"}");
    let mut source_hash = Sha256::new();
    source_hash.update(SOURCE_MANIFEST);
    assert_eq!(source_hash.finish(), SOURCE_MANIFEST_DIGEST);
    assert_eq!(
        reader().manifest.source_manifest_digest,
        SOURCE_MANIFEST_DIGEST
    );

    assert_eq!(
        hex(RECIPE),
        "e5b202d0b4f2a156aaac5f6216662b926ef62e8bc82da2c0609d7dfa64e54c6f"
    );
    assert!(
        std::str::from_utf8(RECIPE)
            .unwrap()
            .contains("independent field-by-field")
    );

    let mut mutated = SOURCE_MANIFEST.to_vec();
    let mutation_offset = mutated.len() - 2;
    mutated[mutation_offset] ^= 1;
    let mut mutated_hash = Sha256::new();
    mutated_hash.update(&mutated);
    assert_ne!(
        mutated_hash.finish(),
        reader().manifest.source_manifest_digest
    );
}

#[test]
fn logarithm_vectors_are_bit_exact() {
    for (input, expected) in [
        (0x3ff0000000000000, 0),
        (0x3ff2492492492492, 0x3fc1178e8227e479),
        (0x3ff999999999999a, 0x3fde148a1a2726d1),
        (0x4000000000000000, 0x3fe62e42fefa39ef),
        (0x4005555555555556, 0x3fef62f40794a7b9),
    ] {
        assert_eq!(
            ln_colr_v1(f64::from_bits(input)).unwrap().to_bits(),
            expected
        );
    }
}

fn t(field: MatchFieldV1, term: &str) -> ExpressionV1 {
    ExpressionV1::Match {
        field,
        mode: MatchModeV1::Any,
        text: term.into(),
    }
}
#[test]
fn nested_failed_branches_double_negation_and_filters_follow_closed_semantics() {
    let r = reader();
    let q = |expression| QueryV1 {
        expression,
        ..match_all("unused")
    };
    let first = q(ExpressionV1::Any(vec![
        ExpressionV1::All(vec![
            t(MatchFieldV1::Title, "rust"),
            t(MatchFieldV1::Title, "search"),
        ]),
        t(MatchFieldV1::Text, "rust"),
    ]));
    let out = r.query(&first, &no_tomb()).unwrap();
    assert_eq!(out.hits.len(), 3);
    assert_eq!(out.counters.scored_document_term_pairs, 5);
    let second = q(ExpressionV1::All(vec![
        ExpressionV1::Any(vec![
            t(MatchFieldV1::Title, "rust"),
            t(MatchFieldV1::Title, "search"),
        ]),
        ExpressionV1::Not(Box::new(t(MatchFieldV1::Text, "search"))),
    ]));
    assert_eq!(
        r.query(&second, &no_tomb())
            .unwrap()
            .hits
            .iter()
            .map(|h| h.passage_id.as_str())
            .collect::<Vec<_>>(),
        vec!["p-beta", "p-tomb"]
    );
    let third = q(ExpressionV1::All(vec![
        ExpressionV1::Not(Box::new(ExpressionV1::Not(Box::new(t(
            MatchFieldV1::Title,
            "rust",
        ))))),
        t(MatchFieldV1::Text, "rust"),
    ]));
    let third_output = r.query(&third, &no_tomb()).unwrap();
    let third_ids = third_output
        .hits
        .iter()
        .map(|h| h.passage_id.as_str())
        .collect::<BTreeSet<_>>();
    assert_eq!(third_ids, BTreeSet::from(["p-alpha", "p-tomb"]));
    let mut filtered = match_all("rust");
    filtered.filters = vec![
        FilterV1::Eq {
            field: EqFieldV1::Language,
            value: "en".into(),
        },
        FilterV1::TimeRange {
            field: TimeFieldV1::ObservedAt,
            gte: Some(2),
            lt: Some(3),
        },
    ];
    assert_eq!(
        r.query(&filtered, &no_tomb()).unwrap().hits[0].passage_id,
        "p-beta"
    );
}

type ModelKey = (u8, String);
fn model_tokens(value: &str) -> Vec<String> {
    value
        .split(|c: char| !c.is_ascii_alphanumeric())
        .filter(|token| !token.is_empty())
        .map(str::to_ascii_lowercase)
        .collect()
}
fn model_tf(doc: &Passage, key: &ModelKey) -> u32 {
    let value = if key.0 == 1 { &doc.title } else { &doc.text };
    model_tokens(value)
        .iter()
        .filter(|token| *token == &key.1)
        .count() as u32
}
fn model_expression(expression: &ExpressionV1, doc: &Passage) -> Option<BTreeSet<ModelKey>> {
    match expression {
        ExpressionV1::Match { field, mode, text } => {
            let terms: BTreeSet<_> = model_tokens(text).into_iter().collect();
            let mut contributions = BTreeSet::new();
            let mut matched = 0;
            for term in &terms {
                let fields: &[u8] = match field {
                    MatchFieldV1::Title => &[1],
                    MatchFieldV1::Text => &[2],
                    MatchFieldV1::All => &[1, 2],
                };
                let mut term_matched = false;
                for tag in fields {
                    let key = (*tag, term.clone());
                    if model_tf(doc, &key) > 0 {
                        term_matched = true;
                        contributions.insert(key);
                    }
                }
                matched += usize::from(term_matched);
            }
            let accepted = match mode {
                MatchModeV1::Any => matched > 0,
                MatchModeV1::All => matched == terms.len(),
            };
            accepted.then_some(contributions)
        }
        ExpressionV1::All(children) => {
            let mut contributions = BTreeSet::new();
            for child in children {
                contributions.extend(model_expression(child, doc)?);
            }
            Some(contributions)
        }
        ExpressionV1::Any(children) => {
            let mut contributions = BTreeSet::new();
            let mut matched = false;
            for child in children {
                if let Some(found) = model_expression(child, doc) {
                    matched = true;
                    contributions.extend(found);
                }
            }
            matched.then_some(contributions)
        }
        ExpressionV1::Not(child) => model_expression(child, doc).is_none().then(BTreeSet::new),
    }
}
fn model_ln(x: f64) -> f64 {
    let bits = x.to_bits();
    let e = ((bits >> 52) & 0x7ff) as i32 - 1023;
    let m = f64::from_bits((1023u64 << 52) | (bits & 0x000f_ffff_ffff_ffff));
    let z = (m - 1.0) / (m + 1.0);
    let z2 = z * z;
    let mut term = z;
    let mut sum = z;
    for n in 1..=31 {
        term *= z2;
        sum += term / (2 * n + 1) as f64;
    }
    2.0 * sum + e as f64 * f64::from_bits(0x3fe62e42fefa39ef)
}
fn model_rank(reader: &Reader, doc: &Passage, contributions: &BTreeSet<ModelKey>) -> i64 {
    let mut score = 0.0;
    for key in contributions {
        let df = reader
            .passages
            .iter()
            .filter(|candidate| model_tf(candidate, key) > 0)
            .count() as u32;
        let tf = model_tf(doc, key);
        let total: u32 = reader
            .passages
            .iter()
            .map(|candidate| {
                if key.0 == 1 {
                    candidate.title_token_count
                } else {
                    candidate.text_token_count
                }
            })
            .sum();
        let average = total as f64 / reader.passages.len() as f64;
        let idf =
            model_ln(1.0 + ((reader.passages.len() as u32 - df) as f64 + 0.5) / (df as f64 + 0.5));
        let dl = if key.0 == 1 {
            doc.title_token_count
        } else {
            doc.text_token_count
        };
        let numerator = (f64::from_bits(0x3ff3333333333333) + 1.0) * tf as f64;
        let adjustment = (1.0 - 0.75) + 0.75 * (dl as f64 / average);
        let denominator = tf as f64 + f64::from_bits(0x3ff3333333333333) * adjustment;
        let term_score = idf * (numerator / denominator);
        let contribution = (if key.0 == 1 { 2.0 } else { 1.0 }) * term_score;
        score += contribution;
    }
    (score * 1_000_000_000.0).round_ties_even() as i64
}
fn model_results(
    reader: &Reader,
    query: &QueryV1,
    tombstones: &TombstoneInputV1,
) -> Vec<(String, i64)> {
    let mut output = Vec::new();
    for passage in &reader.passages {
        let Some(contributions) = model_expression(&query.expression, passage) else {
            continue;
        };
        if tombstones
            .passage_ids
            .iter()
            .any(|id| id == &passage.passage_id)
            || !query
                .filters
                .iter()
                .all(|filter| model_filter(filter, passage))
        {
            continue;
        }
        output.push((
            passage.passage_id.clone(),
            model_rank(reader, passage, &contributions),
        ));
    }
    output.sort_by(|a, b| {
        b.1.cmp(&a.1)
            .then_with(|| a.0.as_bytes().cmp(b.0.as_bytes()))
    });
    output.truncate(query.limit as usize);
    output
}
fn model_filter(filter: &FilterV1, passage: &Passage) -> bool {
    match filter {
        FilterV1::Eq { field, value } => {
            let actual = match field {
                EqFieldV1::PassageId => &passage.passage_id,
                EqFieldV1::SourceObjectId => &passage.source_object_id,
                EqFieldV1::RevisionId => &passage.revision_id,
                EqFieldV1::CaptureId => &passage.capture_id,
                EqFieldV1::RepresentationId => &passage.representation_id,
                EqFieldV1::Language => &passage.language,
                EqFieldV1::MediaType => &passage.media_type,
                EqFieldV1::SourceClass => &passage.source_class,
            };
            actual.as_bytes() == value.as_bytes()
        }
        FilterV1::TimeRange { field, gte, lt } => {
            let value = match field {
                TimeFieldV1::ObservedAt => passage.observed_at,
                TimeFieldV1::PublishedAt => passage.published_at,
            };
            !(matches!(field, TimeFieldV1::PublishedAt) && value == i64::MIN)
                && gte.is_none_or(|bound| value >= bound)
                && lt.is_none_or(|bound| value < bound)
        }
    }
}

#[test]
fn independent_exhaustive_typed_query_model_matches_truth_ranking_filters_and_tombstones() {
    let reader = reader();
    let expressions = vec![
        t(MatchFieldV1::Title, "rust"),
        ExpressionV1::Match {
            field: MatchFieldV1::All,
            mode: MatchModeV1::All,
            text: "rust search".into(),
        },
        ExpressionV1::Any(vec![
            ExpressionV1::All(vec![
                t(MatchFieldV1::Title, "rust"),
                t(MatchFieldV1::Title, "search"),
            ]),
            t(MatchFieldV1::Text, "rust"),
        ]),
        ExpressionV1::All(vec![
            ExpressionV1::Any(vec![
                t(MatchFieldV1::Title, "rust"),
                t(MatchFieldV1::Title, "search"),
            ]),
            ExpressionV1::Not(Box::new(t(MatchFieldV1::Text, "search"))),
        ]),
        ExpressionV1::All(vec![
            ExpressionV1::Not(Box::new(ExpressionV1::Not(Box::new(t(
                MatchFieldV1::Title,
                "rust",
            ))))),
            t(MatchFieldV1::Text, "rust"),
        ]),
    ];
    for (index, expression) in expressions.into_iter().enumerate() {
        let mut query = match_all("unused");
        query.expression = expression;
        if index == 1 {
            query.filters.push(FilterV1::Eq {
                field: EqFieldV1::MediaType,
                value: "text/plain".into(),
            });
        }
        let tombstones = if index % 2 == 0 {
            TombstoneInputV1 {
                watermark: 7,
                passage_ids: vec!["p-tomb".into()],
            }
        } else {
            no_tomb()
        };
        let expected = model_results(&reader, &query, &tombstones);
        let actual = reader
            .query(&query, &tombstones)
            .unwrap()
            .hits
            .into_iter()
            .map(|hit| (hit.passage_id, hit.rank_score))
            .collect::<Vec<_>>();
        assert_eq!(actual, expected, "model case {index}");
    }
}

#[test]
fn i64_min_is_a_valid_query_bound_but_unknown_published_time_never_matches() {
    let r = reader();
    let mut observed = match_all("rust");
    observed.filters = vec![FilterV1::TimeRange {
        field: TimeFieldV1::ObservedAt,
        gte: Some(i64::MIN),
        lt: Some(2),
    }];
    assert_eq!(
        r.query(&observed, &no_tomb()).unwrap().hits[0].passage_id,
        "p-alpha"
    );

    let mut published = match_all("rust");
    published.filters = vec![FilterV1::TimeRange {
        field: TimeFieldV1::PublishedAt,
        gte: Some(i64::MIN),
        lt: Some(i64::MIN + 1),
    }];
    assert!(r.query(&published, &no_tomb()).unwrap().hits.is_empty());
}

#[test]
fn analyzer_token_byte_limit_is_identical_at_index_and_query_boundaries() {
    let r = reader();
    for length in [63, 64] {
        assert!(analyze(&"a".repeat(length)).is_ok());
        assert!(r.query(&match_all(&"a".repeat(length)), &no_tomb()).is_ok());
    }
    assert_eq!(analyze(&"a".repeat(65)).unwrap_err(), TokenTooLong);
    assert_eq!(
        r.query(&match_all(&"a".repeat(65)), &no_tomb())
            .unwrap_err()
            .code,
        Code::QueryUnsupported
    );
    assert!(r.query(&match_all(&"é".repeat(32)), &no_tomb()).is_ok());
    assert!(analyze(&"𐀀".repeat(16)).is_ok());
    for length in [63, 64] {
        let fixture = independent_single_passage_recipe(&"a".repeat(length), "rust");
        assert!(Reader::open(&fixture.sources(), Limits::default()).is_ok());
    }
    let fixture = independent_single_passage_recipe(&"a".repeat(65), "rust");
    assert_eq!(
        Reader::open(&fixture.sources(), Limits::default())
            .unwrap_err()
            .code,
        Code::RecordInvalid
    );
}

#[test]
fn semantic_budgets_admit_units_one_at_a_time_with_exact_failure_counters() {
    let query = match_all("rust search");
    for maximum in [0, 1, 2] {
        let limits = Limits {
            max_ast_nodes: maximum,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&query, &no_tomb());
        if maximum == 0 {
            let failure = result.unwrap_err();
            assert_eq!(failure.code, Code::ResourceLimit);
            assert_eq!(failure.counters.ast_nodes, 0);
        } else {
            assert_eq!(result.unwrap().counters.ast_nodes, 1);
        }
    }
    for maximum in [1, 2, 3] {
        let limits = Limits {
            max_analyzed_terms: maximum,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&query, &no_tomb());
        if maximum == 1 {
            let failure = result.unwrap_err();
            assert_eq!(failure.counters.analyzed_term_occurrences, 1);
        } else {
            assert_eq!(result.unwrap().counters.analyzed_term_occurrences, 2);
        }
    }
    for maximum in [3, 4, 5] {
        let limits = Limits {
            max_unique_terms: maximum,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&query, &no_tomb());
        if maximum == 3 {
            let failure = result.unwrap_err();
            assert_eq!(failure.counters.unique_posting_terms, 3);
        } else {
            assert_eq!(result.unwrap().counters.unique_posting_terms, 4);
        }
    }
    for maximum in [7, 8, 9] {
        let limits = Limits {
            max_evaluated_pairs: maximum,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&query, &no_tomb());
        if maximum == 7 {
            let failure = result.unwrap_err();
            assert_eq!(failure.counters.posting_pairs_evaluated, 7);
        } else {
            assert_eq!(result.unwrap().counters.posting_pairs_evaluated, 8);
        }
    }
    for maximum in [7, 8, 9] {
        let limits = Limits {
            max_scored_pairs: maximum,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&query, &no_tomb());
        if maximum == 7 {
            let failure = result.unwrap_err();
            assert_eq!(failure.counters.scored_document_term_pairs, 7);
        } else {
            assert_eq!(result.unwrap().counters.scored_document_term_pairs, 8);
        }
    }
    for maximum in [0, 1, 2] {
        let limits = Limits {
            max_depth: maximum,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&match_all("rust"), &no_tomb());
        if maximum == 0 {
            assert_eq!(result.unwrap_err().counters.ast_nodes, 0);
        } else {
            assert_eq!(result.unwrap().counters.ast_nodes, 1);
        }
    }
}

#[test]
fn non_counter_query_limits_are_exact_at_both_boundaries() {
    let mut filters = match_all("rust");
    filters.filters = (0..16)
        .map(|_| FilterV1::Eq {
            field: EqFieldV1::Language,
            value: "en".into(),
        })
        .collect();
    for maximum in [15, 16, 17] {
        let limits = Limits {
            max_filters: maximum,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&filters, &no_tomb());
        assert_eq!(result.is_ok(), maximum >= 16);
    }

    let fixed = "golden-three-v1".len() + "golden-cell".len();
    let text = format!("rust{}", " ".repeat(128));
    let bytes = (fixed + text.len()) as u64;
    for maximum in [bytes - 1, bytes, bytes + 1] {
        let limits = Limits {
            max_query_string_bytes: maximum,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&match_all(&text), &no_tomb());
        assert_eq!(result.is_ok(), maximum >= bytes);
    }
}

#[test]
fn generation_allocation_and_read_limits_hold_at_minus_exact_and_plus_one() {
    let baseline = reader();
    let cases = [
        ("manifest", MANIFEST.len() as u64),
        ("artifact", PASSAGES.len() as u64),
        (
            "total",
            (PASSAGES.len() + TERMS.len() + POSTINGS.len()) as u64,
        ),
        ("passages", 3),
        ("terms", 4),
        ("postings", 8),
        ("allocation", MANIFEST.len() as u64),
        ("retained", baseline.telemetry.allocated_bytes_high_water),
        ("read-bytes", baseline.telemetry.requested_read_bytes),
        ("read-calls", baseline.telemetry.read_calls),
    ];
    for (kind, exact) in cases {
        for maximum in [exact - 1, exact, exact + 1] {
            let mut limits = Limits::default();
            match kind {
                "manifest" => limits.max_manifest_bytes = maximum,
                "artifact" => limits.max_artifact_bytes = maximum,
                "total" => limits.max_total_artifact_bytes = maximum,
                "passages" => limits.max_passages = maximum,
                "terms" => limits.max_terms = maximum,
                "postings" => limits.max_postings = maximum,
                "allocation" => limits.max_allocation = maximum,
                "retained" => limits.max_retained = maximum,
                "read-bytes" => limits.max_read_bytes = maximum,
                "read-calls" => limits.max_read_calls = maximum,
                _ => unreachable!(),
            }
            let result = Reader::open(&Fixture::golden().sources(), limits);
            assert_eq!(result.is_ok(), maximum >= exact, "{kind} at {maximum}");
        }
    }
}

#[test]
fn query_tombstone_and_simultaneous_high_water_limits_are_exact() {
    let tombstones = TombstoneInputV1 {
        watermark: 7,
        passage_ids: vec!["a".into(), "b".into(), "c".into()],
    };
    for maximum in [2, 3, 4] {
        let limits = Limits {
            max_tombstones: maximum,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&match_all("rust"), &tombstones);
        assert_eq!(result.is_ok(), maximum >= 3);
    }
    for maximum in [2, 3, 4] {
        let limits = Limits {
            max_tombstone_bytes: maximum,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&match_all("rust"), &tombstones);
        assert_eq!(result.is_ok(), maximum >= 3);
    }
    for maximum in [2, 3, 4] {
        let limits = Limits {
            max_limit: maximum as u32,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&match_all("rust"), &no_tomb());
        assert_eq!(result.is_ok(), maximum >= 3);
    }

    let baseline = reader();
    let retained_query = format!("rust{}", " ".repeat(1_024));
    let output = baseline
        .query(&match_all(&retained_query), &tombstones)
        .unwrap();
    assert!(
        output.telemetry.allocated_bytes_high_water > baseline.telemetry.allocated_bytes_high_water
    );
    assert_eq!(
        output.telemetry.current_allocated_bytes,
        baseline.telemetry.current_allocated_bytes
    );
    let exact = output.telemetry.allocated_bytes_high_water;
    for maximum in [exact - 1, exact, exact + 1] {
        let limits = Limits {
            max_retained: maximum,
            ..Limits::default()
        };
        let result = reader_with_limits(limits).query(&match_all(&retained_query), &tombstones);
        assert_eq!(result.is_ok(), maximum >= exact);
    }
}

#[test]
fn hostile_payload_length_is_range_rejected_before_large_allocation() {
    let mut f = Fixture::golden();
    f.passages.bytes[32..36].copy_from_slice(&u32::MAX.to_le_bytes());
    rebind(&mut f.manifest.bytes, PASSAGES, &f.passages.bytes);
    let failure = Reader::open(&f.sources(), Limits::default()).unwrap_err();
    assert_eq!(failure.code, Code::BoundsInvalid);
    assert_eq!(failure.file, Some("passages.colr"));
    assert_eq!(failure.offset, Some(36));
}

#[test]
fn max_body_late_corruption_hits_retained_preflight_before_decoded_ownership() {
    let body = "a ".repeat(32_768);
    let mut fixture = independent_single_passage_recipe("rust", &body);
    let payload = u32::from_le_bytes(fixture.passages.bytes[32..36].try_into().unwrap()) as u64;
    let record_end = 36 + payload as usize;
    fixture.passages.bytes[record_end - 4..record_end].copy_from_slice(&0u32.to_le_bytes());
    let original = independent_single_passage_recipe("rust", &body);
    rebind(
        &mut fixture.manifest.bytes,
        &original.passages.bytes,
        &fixture.passages.bytes,
    );
    let retained_manifest = fixture.manifest.bytes.len() as u64;
    let exact_before_transition = retained_manifest + payload;
    let limits = Limits {
        max_retained: exact_before_transition,
        ..Limits::default()
    };
    let failure = Reader::open(&fixture.sources(), limits).unwrap_err();
    assert_eq!(failure.code, Code::ResourceLimit);
    assert_eq!(failure.telemetry.current_allocated_bytes, retained_manifest);
    assert_eq!(
        failure.telemetry.allocated_bytes_high_water,
        exact_before_transition
    );
    assert_eq!(failure.counters.passages_decoded, 0);

    let late_failure = Reader::open(&fixture.sources(), Limits::default()).unwrap_err();
    assert_eq!(late_failure.code, Code::RecordInvalid);
    assert_eq!(
        late_failure.telemetry.current_allocated_bytes,
        retained_manifest
    );
    assert_eq!(
        late_failure.telemetry.allocated_bytes_high_water,
        retained_manifest + payload.saturating_mul(2)
    );
}

#[test]
fn every_late_passage_validation_path_releases_temporary_and_uncommitted_retained_bytes() {
    let retained_manifest = MANIFEST.len() as u64;
    let mut fixtures = Vec::new();
    let mut ordinal = Fixture::golden();
    ordinal.passages.bytes[36] = 1;
    refresh_passages(&mut ordinal);
    fixtures.push(ordinal);
    let mut cell = Fixture::golden();
    let at = cell
        .passages
        .bytes
        .windows(11)
        .position(|w| w == b"golden-cell")
        .unwrap();
    cell.passages.bytes[at] = b'X';
    refresh_passages(&mut cell);
    fixtures.push(cell);
    let mut observed = Fixture::golden();
    let needle = 1i64.to_le_bytes();
    let at = observed
        .passages
        .bytes
        .windows(8)
        .position(|w| w == needle)
        .unwrap();
    observed.passages.bytes[at..at + 8].copy_from_slice(&i64::MIN.to_le_bytes());
    refresh_passages(&mut observed);
    fixtures.push(observed);
    let mut token_count = Fixture::golden();
    let length =
        u32::from_le_bytes(token_count.passages.bytes[32..36].try_into().unwrap()) as usize;
    token_count.passages.bytes[36 + length - 4] ^= 1;
    refresh_passages(&mut token_count);
    fixtures.push(token_count);
    for fixture in fixtures {
        let payload = u32::from_le_bytes(fixture.passages.bytes[32..36].try_into().unwrap()) as u64;
        let failure = Reader::open(&fixture.sources(), Limits::default()).unwrap_err();
        assert_eq!(failure.code, Code::RecordInvalid);
        assert_eq!(failure.telemetry.current_allocated_bytes, retained_manifest);
        assert_eq!(
            failure.telemetry.allocated_bytes_high_water,
            (MANIFEST.len() as u64 + retained_manifest).max(retained_manifest + payload * 2)
        );
    }
}

#[test]
fn inventory_truncation_checksum_and_read_failures_fail_closed_without_out_of_range_reads() {
    let f = Fixture::golden();
    let mut missing = f.sources();
    missing.remove("terms.colr");
    assert_eq!(
        Reader::open(&missing, Limits::default()).unwrap_err().code,
        Code::ManifestInvalid
    );
    for (name, bytes) in [
        ("passages", PASSAGES),
        ("terms", TERMS),
        ("postings", POSTINGS),
    ] {
        for end in 0..bytes.len() {
            let mut f = Fixture::golden();
            match name {
                "passages" => f.passages.bytes.truncate(end),
                "terms" => f.terms.bytes.truncate(end),
                _ => f.postings.bytes.truncate(end),
            }
            let failure = Reader::open(&f.sources(), Limits::default()).unwrap_err();
            assert_eq!(failure.code, Code::BoundsInvalid);
            assert_eq!(
                failure.file,
                Some(match name {
                    "passages" => "passages.colr",
                    "terms" => "terms.colr",
                    _ => "postings.colr",
                })
            );
            assert_eq!(failure.offset, None);
            assert!(failure.telemetry.allocated_bytes_high_water <= Limits::default().max_retained);
            assert!(failure.telemetry.current_allocated_bytes <= Limits::default().max_retained);
        }
    }
    for end in 0..MANIFEST.len() {
        let mut first = Fixture::golden();
        first.manifest.bytes.truncate(end);
        let expected = Reader::open(&first.sources(), Limits::default()).unwrap_err();
        let mut second = Fixture::golden();
        second.manifest.bytes.truncate(end);
        let repeated = Reader::open(&second.sources(), Limits::default()).unwrap_err();
        assert_eq!(
            (repeated.code, repeated.file, repeated.offset),
            (expected.code, expected.file, expected.offset)
        );
    }
    let mut f = Fixture::golden();
    f.passages.bytes[100] ^= 1;
    assert_eq!(
        Reader::open(&f.sources(), Limits::default())
            .unwrap_err()
            .code,
        Code::ChecksumMismatch
    );
    let f = Fixture::golden();
    f.terms.fail.set(true);
    assert_eq!(
        Reader::open(&f.sources(), Limits::default())
            .unwrap_err()
            .code,
        Code::IoReadFailed
    );
}

fn read_phase(event: &ReadEvent) -> &'static str {
    match (event.file, event.offset, event.length) {
        ("manifest.json", _, _) => "manifest",
        ("passages.colr", 0, 32) => "passage-header",
        ("passages.colr", 0, _) => "digest",
        ("passages.colr", _, 4) => "passage-header",
        ("passages.colr", _, _) => "passage-payload",
        ("terms.colr", 0, 32) => "term-header",
        ("terms.colr", 0, _) => "digest",
        ("terms.colr", _, 8) => "term-header",
        ("terms.colr", _, _) => "term-payload",
        ("postings.colr", 0, 32) => "posting-header",
        ("postings.colr", 0, _) => "digest",
        ("postings.colr", _, 8) => "posting-payload",
        _ => unreachable!("unclassified read event: {event:?}"),
    }
}

#[test]
fn every_admitted_read_failure_releases_only_its_scoped_temporary_allocation() {
    let baseline = IndexedFixture::new(0);
    let reader = Reader::open(&baseline.sources(), Limits::default()).unwrap();
    let events = baseline.state.events.borrow().clone();
    assert_eq!(events.len() as u64, reader.telemetry.read_calls);

    let mut retained = 0u64;
    let mut high_water = 0u64;
    let mut requested = 0u64;
    let mut counters = Counters::default();
    let mut phases = BTreeSet::new();
    for (index, event) in events.iter().enumerate() {
        let call = index as u64 + 1;
        let phase = read_phase(event);
        phases.insert(phase);
        requested += event.length;
        let temporary = matches!(phase, "manifest" | "passage-payload" | "term-payload");
        let failed_high_water = if temporary {
            high_water.max(retained + event.length)
        } else {
            high_water
        };

        let fixture = IndexedFixture::new(call);
        let attempt = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            Reader::open(&fixture.sources(), Limits::default())
        }));
        let failure = attempt.expect("read failure must not panic").unwrap_err();
        assert_eq!(
            failure.code,
            Code::IoReadFailed,
            "call={call} phase={phase}"
        );
        assert_eq!(failure.file, Some(event.file), "call={call} phase={phase}");
        assert_eq!(
            failure.offset,
            Some(event.offset),
            "call={call} phase={phase}"
        );
        assert_eq!(
            failure.telemetry.read_calls, call,
            "call={call} phase={phase}"
        );
        assert_eq!(
            failure.telemetry.requested_read_bytes, requested,
            "call={call} phase={phase}"
        );
        assert_eq!(
            failure.telemetry.current_allocated_bytes, retained,
            "call={call} phase={phase}"
        );
        assert_eq!(
            failure.telemetry.allocated_bytes_high_water, failed_high_water,
            "call={call} phase={phase}"
        );
        assert_eq!(failure.counters, counters, "call={call} phase={phase}");
        assert!(failed_high_water <= Limits::default().max_retained);

        match phase {
            "manifest" => {
                high_water = high_water.max(event.length * 2);
                retained += event.length;
            }
            "passage-payload" | "term-payload" => {
                high_water = high_water.max(retained + event.length * 2);
                retained += event.length;
                if phase == "passage-payload" {
                    counters.passages_decoded += 1;
                } else {
                    counters.terms_decoded += 1;
                }
            }
            "posting-payload" => {
                retained += 8;
                high_water = high_water.max(retained);
                counters.postings_decoded += 1;
            }
            _ => {}
        }
    }
    assert_eq!(
        phases,
        BTreeSet::from([
            "digest",
            "manifest",
            "passage-header",
            "passage-payload",
            "posting-header",
            "posting-payload",
            "term-header",
            "term-payload",
        ])
    );
}

#[test]
fn failed_manifest_retained_transition_releases_the_temporary_body_charge() {
    let limits = Limits {
        max_retained: MANIFEST.len() as u64,
        ..Limits::default()
    };
    let failure = Reader::open(&Fixture::golden().sources(), limits).unwrap_err();
    assert_eq!(failure.code, Code::ResourceLimit);
    assert_eq!(failure.telemetry.current_allocated_bytes, 0);
    assert_eq!(
        failure.telemetry.allocated_bytes_high_water,
        MANIFEST.len() as u64
    );
}

#[test]
fn deterministic_mutation_and_read_failure_steps_reach_every_parser_state() {
    let baseline = IndexedFixture::new(0);
    Reader::open(&baseline.sources(), Limits::default()).unwrap();
    let events = baseline.state.events.borrow().clone();
    let phases = [
        "manifest",
        "passage-header",
        "term-header",
        "posting-header",
        "digest",
        "passage-payload",
        "term-payload",
        "posting-payload",
    ];
    let expected_codes = [
        Code::ManifestInvalid,
        Code::FormatUnsupported,
        Code::FormatUnsupported,
        Code::FormatUnsupported,
        Code::ChecksumMismatch,
        Code::RecordInvalid,
        Code::RecordInvalid,
        Code::RecordInvalid,
    ];
    let mut prior_call = 0u64;
    for (step, (phase, expected_code)) in phases.into_iter().zip(expected_codes).enumerate() {
        let mut mutation = Fixture::golden();
        match phase {
            "manifest" => mutation.manifest.bytes[0] ^= 1,
            "passage-header" => mutation.passages.bytes[0] ^= 1,
            "term-header" => mutation.terms.bytes[0] ^= 1,
            "posting-header" => mutation.postings.bytes[0] ^= 1,
            "digest" => mutation.passages.bytes[100] ^= 1,
            "passage-payload" => {
                mutation.passages.bytes[36] = 1;
                refresh_passages(&mut mutation);
            }
            "term-payload" => {
                mutation.terms.bytes[44..48].copy_from_slice(&0u32.to_le_bytes());
                refresh_terms(&mut mutation);
            }
            "posting-payload" => {
                mutation.postings.bytes[32..36].copy_from_slice(&0u32.to_le_bytes());
                refresh_postings(&mut mutation);
            }
            _ => unreachable!(),
        }
        let mutation_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            Reader::open(&mutation.sources(), Limits::default())
        }));
        let mutation_failure = mutation_result
            .expect("mutation step must not panic")
            .unwrap_err();
        assert_eq!(
            mutation_failure.code, expected_code,
            "step={step} phase={phase}"
        );
        assert!(
            mutation_failure.telemetry.allocated_bytes_high_water <= Limits::default().max_retained
        );

        let call = events
            .iter()
            .position(|event| read_phase(event) == phase)
            .map(|index| index as u64 + 1)
            .unwrap();
        assert!(call > prior_call, "step={step} phase={phase}");
        prior_call = call;
        let failed_source = IndexedFixture::new(call);
        let read_result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            Reader::open(&failed_source.sources(), Limits::default())
        }));
        let read_failure = read_result
            .expect("read failure step must not panic")
            .unwrap_err();
        assert_eq!(
            read_failure.code,
            Code::IoReadFailed,
            "step={step} phase={phase}"
        );
        assert_eq!(read_failure.telemetry.read_calls, call);
        assert!(
            read_failure.telemetry.current_allocated_bytes
                <= read_failure.telemetry.allocated_bytes_high_water
        );
        assert!(
            read_failure.telemetry.allocated_bytes_high_water <= Limits::default().max_retained
        );
    }
}

#[test]
fn every_truncation_boundary_has_a_pinned_code_file_and_offset_transcript() {
    let mut transcript = Vec::new();
    for end in 0..MANIFEST.len() {
        let mut fixture = Fixture::golden();
        fixture.manifest.bytes.truncate(end);
        let failure = Reader::open(&fixture.sources(), Limits::default()).unwrap_err();
        transcript.extend_from_slice(
            format!(
                "manifest:{end}:{:?}:{:?}:{:?}\n",
                failure.code, failure.file, failure.offset
            )
            .as_bytes(),
        );
    }
    for (name, bytes) in [
        ("passages", PASSAGES),
        ("terms", TERMS),
        ("postings", POSTINGS),
    ] {
        for end in 0..bytes.len() {
            let mut fixture = Fixture::golden();
            match name {
                "passages" => fixture.passages.bytes.truncate(end),
                "terms" => fixture.terms.bytes.truncate(end),
                _ => fixture.postings.bytes.truncate(end),
            }
            let failure = Reader::open(&fixture.sources(), Limits::default()).unwrap_err();
            transcript.extend_from_slice(
                format!(
                    "{name}:{end}:{:?}:{:?}:{:?}\n",
                    failure.code, failure.file, failure.offset
                )
                .as_bytes(),
            );
        }
    }
    assert_eq!(
        hex(&transcript),
        "d071aca62480efbffb4565e3bfc6348058b2728a2d509d16c9088d1887f4899a"
    );
}

fn open_code(f: &Fixture) -> Failure {
    Reader::open(&f.sources(), Limits::default()).unwrap_err()
}

fn refresh_passages(f: &mut Fixture) {
    rebind(&mut f.manifest.bytes, PASSAGES, &f.passages.bytes);
}
fn refresh_terms(f: &mut Fixture) {
    rebind(&mut f.manifest.bytes, TERMS, &f.terms.bytes);
}
fn refresh_postings(f: &mut Fixture) {
    rebind(&mut f.manifest.bytes, POSTINGS, &f.postings.bytes);
}

#[test]
fn every_payload_byte_mutation_is_checksum_bound() {
    for (kind, bytes) in [(0, PASSAGES), (1, TERMS), (2, POSTINGS)] {
        for offset in 32..bytes.len() {
            let mut f = Fixture::golden();
            match kind {
                0 => f.passages.bytes[offset] ^= 1,
                1 => f.terms.bytes[offset] ^= 1,
                _ => f.postings.bytes[offset] ^= 1,
            }
            let failure = open_code(&f);
            assert_eq!(
                failure.code,
                Code::ChecksumMismatch,
                "kind={kind} offset={offset}"
            );
            assert!(failure.telemetry.allocated_bytes_high_water <= Limits::default().max_retained);
        }
    }
}

#[test]
fn header_version_endian_length_count_and_reserved_fail_in_normative_order() {
    for kind in 0..3 {
        for (offset, replacement, code, reported) in [
            (0, 0xff, Code::FormatUnsupported, 0),
            (8, 2, Code::FormatUnsupported, 0),
            (10, 1, Code::FormatUnsupported, 0),
            (12, 5, Code::FormatUnsupported, 0),
            (16, 31, Code::FormatUnsupported, 0),
            (28, 1, Code::RecordInvalid, 28),
        ] {
            let mut f = Fixture::golden();
            let target = match kind {
                0 => &mut f.passages.bytes,
                1 => &mut f.terms.bytes,
                _ => &mut f.postings.bytes,
            };
            target[offset] = replacement;
            let failure = open_code(&f);
            assert_eq!(failure.code, code);
            assert_eq!(failure.offset, Some(reported));
        }
    }
    let mut f = Fixture::golden();
    f.passages.bytes[20..28].copy_from_slice(&4u64.to_le_bytes());
    refresh_passages(&mut f);
    let failure = open_code(&f);
    assert_eq!(failure.code, Code::RecordInvalid);
    assert_eq!(failure.offset, None);
}

#[test]
fn manifest_format_analyzer_ranking_and_schema_versions_are_unsupported_not_malformed() {
    for (from, to) in [
        ("curiosity_scalar_v1", "curiosity_scalar_v2"),
        ("bm25-colr-v1", "bm25-colr-v2"),
        ("\"formatVersion\":1", "\"formatVersion\":2"),
        ("\"schemaVersion\":1", "\"schemaVersion\":2"),
        ("\"byteOrder\":\"little\"", "\"byteOrder\":\"middle\""),
    ] {
        let mut f = Fixture::golden();
        f.manifest.bytes = String::from_utf8(f.manifest.bytes)
            .unwrap()
            .replace(from, to)
            .into_bytes();
        assert_eq!(open_code(&f).code, Code::FormatUnsupported);
    }
}

#[test]
fn recomputed_integrity_exposes_record_order_frequency_delta_and_provenance_errors() {
    let mut cases: Vec<(Fixture, Code)> = Vec::new();

    let mut ordinal = Fixture::golden();
    ordinal.passages.bytes[36] = 1;
    refresh_passages(&mut ordinal);
    cases.push((ordinal, Code::RecordInvalid));

    let mut passage_order = Fixture::golden();
    let passage_id = passage_order
        .passages
        .bytes
        .windows(b"p-alpha".len())
        .position(|w| w == b"p-alpha")
        .unwrap();
    passage_order.passages.bytes[passage_id + 2] = b'z';
    refresh_passages(&mut passage_order);
    cases.push((passage_order, Code::RecordInvalid));

    let mut cell = Fixture::golden();
    let cell_offset = cell
        .passages
        .bytes
        .windows(b"golden-cell".len())
        .position(|w| w == b"golden-cell")
        .unwrap();
    cell.passages.bytes[cell_offset] = b'X';
    refresh_passages(&mut cell);
    cases.push((cell, Code::RecordInvalid));

    let mut token_count = Fixture::golden();
    let first_record_length =
        u32::from_le_bytes(token_count.passages.bytes[32..36].try_into().unwrap()) as usize;
    token_count.passages.bytes[36 + first_record_length - 8] = 9;
    refresh_passages(&mut token_count);
    cases.push((token_count, Code::RecordInvalid));

    let mut term_order = Fixture::golden();
    term_order.terms.bytes[80..86].copy_from_slice(b"aaaaaa");
    refresh_terms(&mut term_order);
    cases.push((term_order, Code::RecordInvalid));

    let mut duplicate_term = Fixture::golden();
    duplicate_term.terms.bytes[76..80].copy_from_slice(&4u32.to_le_bytes());
    duplicate_term.terms.bytes[80..84].copy_from_slice(b"rust");
    duplicate_term.terms.bytes.drain(84..86);
    let old = format!("\"length\":{}", TERMS.len());
    let new = format!("\"length\":{}", TERMS.len() - 2);
    duplicate_term.manifest.bytes = String::from_utf8(duplicate_term.manifest.bytes)
        .unwrap()
        .replace(&old, &new)
        .into_bytes();
    refresh_terms(&mut duplicate_term);
    cases.push((duplicate_term, Code::RecordInvalid));

    let mut df = Fixture::golden();
    df.terms.bytes[44..48].copy_from_slice(&0u32.to_le_bytes());
    refresh_terms(&mut df);
    cases.push((df, Code::RecordInvalid));

    let mut total_tf = Fixture::golden();
    total_tf.terms.bytes[48..56].copy_from_slice(&1u64.to_le_bytes());
    refresh_terms(&mut total_tf);
    cases.push((total_tf, Code::RecordInvalid));

    let mut delta = Fixture::golden();
    delta.postings.bytes[32..36].copy_from_slice(&0u32.to_le_bytes());
    refresh_postings(&mut delta);
    cases.push((delta, Code::RecordInvalid));

    let mut frequency = Fixture::golden();
    frequency.postings.bytes[36..40].copy_from_slice(&0u32.to_le_bytes());
    refresh_postings(&mut frequency);
    cases.push((frequency, Code::RecordInvalid));

    for (fixture, code) in cases {
        assert_eq!(open_code(&fixture).code, code);
    }
}

#[test]
fn posting_ranges_reject_gap_overlap_alias_out_of_range_and_trailing_bytes() {
    for offset in [31u64, 33, 40, u64::MAX] {
        let mut f = Fixture::golden();
        f.terms.bytes[56..64].copy_from_slice(&offset.to_le_bytes());
        refresh_terms(&mut f);
        let failure = open_code(&f);
        assert_eq!(failure.code, Code::BoundsInvalid);
        assert_eq!(failure.file, Some("postings.colr"));
        assert_eq!(failure.offset, Some(offset));
    }
    let mut trailing = Fixture::golden();
    trailing.terms.bytes.push(0);
    let old = format!("\"length\":{}", TERMS.len());
    let new = format!("\"length\":{}", TERMS.len() + 1);
    trailing.manifest.bytes = String::from_utf8(trailing.manifest.bytes)
        .unwrap()
        .replace(&old, &new)
        .into_bytes();
    refresh_terms(&mut trailing);
    assert_eq!(open_code(&trailing).code, Code::BoundsInvalid);
}

fn hex(bytes: &[u8]) -> String {
    let mut s = Sha256::new();
    s.update(bytes);
    s.finish().iter().map(|b| format!("{b:02x}")).collect()
}

#[test]
fn sha256_fixed_boundary_references_match_external_fips_vectors() {
    for (length, expected) in [
        (
            0,
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        ),
        (
            1,
            "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
        ),
        (
            54,
            "675f28acc0b90a72d1c3a570fe83ac565555db358cf01826dc8eefb2bf7ca0f3",
        ),
        (
            55,
            "463eb28e72f82e0a96c0a4cc53690c571281131f672aa229e0d45ae59b598b59",
        ),
        (
            56,
            "da2ae4d6b36748f2a318f23e7ab1dfdf45acdc9d049bd80e59de82a60895f562",
        ),
        (
            57,
            "2fe741af801cc238602ac0ec6a7b0c3a8a87c7fc7d7f02a3fe03d1c12eac4d8f",
        ),
        (
            63,
            "29af2686fd53374a36b0846694cc342177e428d1647515f078784d69cdb9e488",
        ),
        (
            64,
            "fdeab9acf3710362bd2658cdc9a29e8f9c757fcf9811603a8c447cd1d9151108",
        ),
        (
            65,
            "4bfd2c8b6f1eec7a2afeb48b934ee4b2694182027e6d0fc075074f2fabb31781",
        ),
        (
            119,
            "da18797ed7c3a777f0847f429724a2d8cd5138e6ed2895c3fa1a6d39d18f7ec6",
        ),
        (
            120,
            "f52b23db1fbb6ded89ef42a23ce0c8922c45f25c50b568a93bf1c075420bbb7c",
        ),
        (
            121,
            "335a461692b30bba1d647cc71604e88e676c90e4c22455d0b8c83f4bd7c8ac9b",
        ),
        (
            127,
            "92ca0fa6651ee2f97b884b7246a562fa71250fedefe5ebf270d31c546bfea976",
        ),
        (
            128,
            "471fb943aa23c511f6f72f8d1652d9c880cfa392ad80503120547703e56a2be5",
        ),
        (
            129,
            "5099c6a56203f9687f7d33f4bfdf576d31dc91f6b695ecea38b2770c87631135",
        ),
        (
            1024,
            "785b0751fc2c53dc14a4ce3d800e69ef9ce1009eb327ccf458afe09c242c26c9",
        ),
    ] {
        let input: Vec<u8> = (0..length).map(|index| index as u8).collect();
        assert_eq!(hex(&input), expected, "length {length}");
    }
}
fn rebind(manifest: &mut Vec<u8>, old: &[u8], new: &[u8]) {
    let old = hex(old);
    let new = hex(new);
    let text = String::from_utf8(manifest.clone())
        .unwrap()
        .replace(&old, &new);
    *manifest = text.into_bytes();
}
#[test]
fn every_stable_failure_family_is_reachable() {
    let mut f = Fixture::golden();
    f.manifest.bytes.push(b' ');
    assert_eq!(
        Reader::open(&f.sources(), Limits::default())
            .unwrap_err()
            .code,
        Code::ManifestInvalid
    );
    let mut f = Fixture::golden();
    f.passages.bytes[0] = b'X';
    rebind(&mut f.manifest.bytes, PASSAGES, &f.passages.bytes);
    assert_eq!(
        Reader::open(&f.sources(), Limits::default())
            .unwrap_err()
            .code,
        Code::FormatUnsupported
    );
    let limits = Limits {
        max_passages: 2,
        ..Limits::default()
    };
    assert_eq!(
        Reader::open(&Fixture::golden().sources(), limits)
            .unwrap_err()
            .code,
        Code::ResourceLimit
    );
    let mut f = Fixture::golden();
    let title = f
        .passages
        .bytes
        .windows(b"Rust Search".len())
        .position(|window| window == b"Rust Search")
        .unwrap();
    f.passages.bytes[title] = 0xff;
    rebind(&mut f.manifest.bytes, PASSAGES, &f.passages.bytes);
    assert_eq!(
        Reader::open(&f.sources(), Limits::default())
            .unwrap_err()
            .code,
        Code::Utf8Invalid
    );
    let mut f = Fixture::golden();
    f.passages.bytes[32 + 4] = 9;
    rebind(&mut f.manifest.bytes, PASSAGES, &f.passages.bytes);
    assert_eq!(
        Reader::open(&f.sources(), Limits::default())
            .unwrap_err()
            .code,
        Code::RecordInvalid
    );
    let r = reader();
    let mut bad = match_all("");
    assert_eq!(
        r.query(&bad, &no_tomb()).unwrap_err().code,
        Code::QueryUnsupported
    );
    bad.generation_id = "other".into();
    assert_eq!(
        r.query(&bad, &no_tomb()).unwrap_err().code,
        Code::QueryBindingMismatch
    );
    assert_eq!(
        r.query(
            &match_all("rust"),
            &TombstoneInputV1 {
                watermark: 6,
                passage_ids: vec![]
            }
        )
        .unwrap_err()
        .code,
        Code::TombstoneInvalid
    );
}

#[test]
fn bounded_deterministic_arbitrary_models_never_panic_or_accept_unvalidated_bytes() {
    let mut state = 0x1234_5678u32;
    for length in 0..256usize {
        let mut bytes = vec![0; length];
        for b in &mut bytes {
            state = state.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
            *b = (state >> 24) as u8;
        }
        let f = Fixture {
            manifest: Memory::new(&bytes),
            passages: Memory::new(&bytes),
            terms: Memory::new(&bytes),
            postings: Memory::new(&bytes),
        };
        let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            Reader::open(&f.sources(), Limits::default())
        }));
        assert!(outcome.is_ok());
        assert!(outcome.unwrap().is_err());
    }
}

fn recipe_header(magic: &[u8; 8], count: u64) -> Vec<u8> {
    let mut bytes = Vec::from(*magic);
    bytes.extend_from_slice(&1u16.to_le_bytes());
    bytes.extend_from_slice(&0u16.to_le_bytes());
    bytes.extend_from_slice(&0x0102_0304u32.to_le_bytes());
    bytes.extend_from_slice(&32u32.to_le_bytes());
    bytes.extend_from_slice(&count.to_le_bytes());
    bytes.extend_from_slice(&0u32.to_le_bytes());
    bytes
}
fn recipe_text(output: &mut Vec<u8>, value: &str) {
    output.extend_from_slice(&(value.len() as u32).to_le_bytes());
    output.extend_from_slice(value.as_bytes());
}
fn independent_single_passage_recipe(title: &str, body: &str) -> Fixture {
    let mut payload = 0u32.to_le_bytes().to_vec();
    for value in [
        "p-model",
        "source-model",
        "revision-model",
        "capture-model",
        "representation-model",
        "model-cell",
        "admission-model",
    ] {
        recipe_text(&mut payload, value);
    }
    payload.extend_from_slice(&[0x11; 32]);
    payload.extend_from_slice(&[0x22; 32]);
    for value in [title, body, "fixture:model", "text/plain", "en"] {
        recipe_text(&mut payload, value);
    }
    payload.extend_from_slice(&1i64.to_le_bytes());
    payload.extend_from_slice(&i64::MIN.to_le_bytes());
    recipe_text(&mut payload, "fixture");
    payload.extend_from_slice(&[0x33; 32]);
    payload.extend_from_slice(&0u64.to_le_bytes());
    payload.extend_from_slice(&(model_tokens(title).len() as u32).to_le_bytes());
    payload.extend_from_slice(&(model_tokens(body).len() as u32).to_le_bytes());
    let mut passages = recipe_header(b"COLRPAS\0", 1);
    passages.extend_from_slice(&(payload.len() as u32).to_le_bytes());
    passages.extend_from_slice(&payload);

    let mut facts = BTreeMap::<ModelKey, u32>::new();
    for (field, value) in [(1, title), (2, body)] {
        for token in model_tokens(value) {
            *facts.entry((field, token)).or_default() += 1;
        }
    }
    let mut postings = recipe_header(b"COLRPST\0", facts.len() as u64);
    let mut terms = recipe_header(b"COLRTRM\0", facts.len() as u64);
    let mut posting_offset = 32u64;
    for ((field, token), tf) in facts {
        terms.push(field);
        terms.extend_from_slice(&[0; 3]);
        terms.extend_from_slice(&(token.len() as u32).to_le_bytes());
        terms.extend_from_slice(token.as_bytes());
        terms.extend_from_slice(&1u32.to_le_bytes());
        terms.extend_from_slice(&(tf as u64).to_le_bytes());
        terms.extend_from_slice(&posting_offset.to_le_bytes());
        terms.extend_from_slice(&8u64.to_le_bytes());
        postings.extend_from_slice(&1u32.to_le_bytes());
        postings.extend_from_slice(&tf.to_le_bytes());
        posting_offset += 8;
    }
    let manifest = format!(
        "{{\"analyzerId\":\"curiosity_scalar_v1\",\"artifactDigests\":{{\"passages.colr\":{{\"length\":{},\"sha256\":\"{}\"}},\"postings.colr\":{{\"length\":{},\"sha256\":\"{}\"}},\"terms.colr\":{{\"length\":{},\"sha256\":\"{}\"}}}},\"byteOrder\":\"little\",\"cellId\":\"model-cell\",\"format\":\"curiosity-owned-lexical-reader\",\"formatVersion\":1,\"generationId\":\"model-v1\",\"passageCount\":1,\"rankingPolicyId\":\"bm25-colr-v1\",\"schemaVersion\":1,\"sourceManifestDigest\":\"aded5d41b2172574277755ce240a0febd1124bf38a0fc1806901b625b0d3f6c2\",\"tombstoneWatermark\":0}}",
        passages.len(),
        hex(&passages),
        postings.len(),
        hex(&postings),
        terms.len(),
        hex(&terms)
    );
    Fixture {
        manifest: Memory::new(manifest.as_bytes()),
        passages: Memory::new(&passages),
        terms: Memory::new(&terms),
        postings: Memory::new(&postings),
    }
}

fn independent_empty_recipe() -> Fixture {
    let passages = recipe_header(b"COLRPAS\0", 0);
    let postings = recipe_header(b"COLRPST\0", 0);
    let terms = recipe_header(b"COLRTRM\0", 0);
    let manifest = format!(
        "{{\"analyzerId\":\"curiosity_scalar_v1\",\"artifactDigests\":{{\"passages.colr\":{{\"length\":32,\"sha256\":\"{}\"}},\"postings.colr\":{{\"length\":32,\"sha256\":\"{}\"}},\"terms.colr\":{{\"length\":32,\"sha256\":\"{}\"}}}},\"byteOrder\":\"little\",\"cellId\":\"model-cell\",\"format\":\"curiosity-owned-lexical-reader\",\"formatVersion\":1,\"generationId\":\"model-empty-v1\",\"passageCount\":0,\"rankingPolicyId\":\"bm25-colr-v1\",\"schemaVersion\":1,\"sourceManifestDigest\":\"aded5d41b2172574277755ce240a0febd1124bf38a0fc1806901b625b0d3f6c2\",\"tombstoneWatermark\":0}}",
        hex(&passages),
        hex(&postings),
        hex(&terms)
    );
    Fixture {
        manifest: Memory::new(manifest.as_bytes()),
        passages: Memory::new(&passages),
        terms: Memory::new(&terms),
        postings: Memory::new(&postings),
    }
}

#[test]
fn deterministic_valid_models_round_trip_only_through_the_test_local_recipe() {
    let empty = independent_empty_recipe();
    let empty_reader = Reader::open(&empty.sources(), Limits::default()).unwrap();
    assert_eq!(empty_reader.passages.len(), 0);
    assert_eq!(reader().passages.len(), 3);
    let models = [
        ("Alpha", "beta alpha"),
        ("Rust 2026", "rust"),
        ("x", "x x x"),
    ];
    for (title, body) in models {
        let fixture = independent_single_passage_recipe(title, body);
        let reader = Reader::open(&fixture.sources(), Limits::default()).unwrap();
        let query = QueryV1 {
            version: QueryVersionV1::V1,
            generation_id: "model-v1".into(),
            cell_id: "model-cell".into(),
            expression: t(MatchFieldV1::All, &model_tokens(body)[0]),
            filters: vec![],
            limit: 1,
        };
        let output = reader
            .query(
                &query,
                &TombstoneInputV1 {
                    watermark: 0,
                    passage_ids: vec![],
                },
            )
            .unwrap();
        assert_eq!(output.hits[0].passage_id, "p-model");
        assert_eq!(output.counters.passages_decoded, 1);
    }
}

#[test]
fn source_lengths_are_sampled_before_and_after() {
    let baseline = reader();
    let f = Fixture::golden();
    f.postings.change_after_read.set(true);
    let failure = Reader::open(&f.sources(), Limits::default()).unwrap_err();
    assert_eq!(failure.code, Code::IoReadFailed);
    assert_eq!(failure.telemetry, baseline.telemetry);
}

#[test]
fn alternative_internal_source_chunking_is_semantically_identical() {
    let expected = reader()
        .query(&match_all("rust search"), &no_tomb())
        .unwrap();
    for chunk in [1, 7, 64] {
        let manifest = ChunkedMemory {
            bytes: MANIFEST.to_vec(),
            chunk,
        };
        let passages = ChunkedMemory {
            bytes: PASSAGES.to_vec(),
            chunk,
        };
        let terms = ChunkedMemory {
            bytes: TERMS.to_vec(),
            chunk,
        };
        let postings = ChunkedMemory {
            bytes: POSTINGS.to_vec(),
            chunk,
        };
        let sources: Sources<'_> = BTreeMap::from([
            ("manifest.json", &manifest as &dyn ReadAtV1),
            ("passages.colr", &passages as &dyn ReadAtV1),
            ("terms.colr", &terms as &dyn ReadAtV1),
            ("postings.colr", &postings as &dyn ReadAtV1),
        ]);
        let output = Reader::open(&sources, Limits::default())
            .unwrap()
            .query(&match_all("rust search"), &no_tomb())
            .unwrap();
        assert_eq!(output.counters, expected.counters);
        assert_eq!(
            output
                .hits
                .iter()
                .map(|hit| (&hit.passage_id, hit.rank_score))
                .collect::<Vec<_>>(),
            expected
                .hits
                .iter()
                .map(|hit| (&hit.passage_id, hit.rank_score))
                .collect::<Vec<_>>()
        );
    }
}
