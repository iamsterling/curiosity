use std::cmp::Ordering;
use std::collections::{BTreeMap, BTreeSet};

use super::analyzer::analyze;
use super::model::{
    Code, Counters, EqFieldV1, ExpressionV1, FilterV1, Hit, MatchFieldV1, MatchModeV1, Passage,
    QueryV1, Reader, Result, Telemetry, TimeFieldV1, TombstoneInputV1, fail,
};

type Key = (u8, Vec<u8>);
#[derive(Clone)]
enum Compiled {
    Match {
        mode: MatchModeV1,
        groups: Vec<Vec<Key>>,
    },
    All(Vec<Compiled>),
    Any(Vec<Compiled>),
    Not(Box<Compiled>),
}
#[derive(Debug)]
pub(super) struct QueryOutput {
    pub hits: Vec<Hit>,
    pub counters: Counters,
    pub telemetry: Telemetry,
}

impl Reader {
    pub fn query(&self, query: &QueryV1, tombstones: &TombstoneInputV1) -> Result<QueryOutput> {
        let mut counters = self.counters.clone();
        let mut telemetry = self.telemetry.clone();
        let tombstone_bytes = validate_tombstones(tombstones, self, &counters)?;
        if query.generation_id != self.manifest.generation_id
            || query.cell_id != self.manifest.cell_id
        {
            return Err(fail(Code::QueryBindingMismatch, None, None, &counters));
        }
        if query.limit == 0 {
            return Err(fail(Code::QueryUnsupported, None, None, &counters));
        }
        if query.limit > self.limits.max_limit
            || query.filters.len() as u64 > self.limits.max_filters
        {
            return Err(fail(Code::ResourceLimit, None, None, &counters));
        }
        let mut strings = query
            .generation_id
            .len()
            .checked_add(query.cell_id.len())
            .ok_or_else(|| fail(Code::ResourceLimit, None, None, &counters))?
            as u64;
        for filter in &query.filters {
            match filter {
                FilterV1::Eq { value, .. } => {
                    strings = strings
                        .checked_add(value.len() as u64)
                        .ok_or_else(|| fail(Code::ResourceLimit, None, None, &counters))?
                }
                FilterV1::TimeRange { gte, lt, .. } => {
                    if gte.is_none() && lt.is_none() || matches!((gte,lt),(Some(a),Some(b)) if a>=b)
                    {
                        return Err(fail(Code::QueryUnsupported, None, None, &counters));
                    }
                }
            }
        }
        strings = strings
            .checked_add(expression_string_bytes(&query.expression)?)
            .ok_or_else(|| fail(Code::ResourceLimit, None, None, &counters))?;
        if strings > self.limits.max_query_string_bytes {
            return Err(fail(Code::ResourceLimit, None, None, &counters));
        }
        let mut unique = Vec::new();
        let mut positive = false;
        let compiled = compile(
            &query.expression,
            1,
            false,
            &mut unique,
            &mut positive,
            &mut counters,
            self,
        )?;
        if !positive {
            return Err(fail(Code::QueryUnsupported, None, None, &counters));
        }
        unique.sort();
        unique.dedup();
        for _ in &unique {
            counters.unique_posting_terms = admit(
                counters.unique_posting_terms,
                self.limits.max_unique_terms,
                &counters,
            )?;
        }
        let query_bytes = strings;
        query_charge(query_bytes, &self.limits, &mut telemetry, &counters)?;
        query_charge(tombstone_bytes, &self.limits, &mut telemetry, &counters)?;
        let mut postings: BTreeMap<Key, BTreeMap<u32, u32>> = BTreeMap::new();
        for key in unique {
            if let Some(term) = self
                .terms
                .iter()
                .find(|t| t.field == key.0 && t.bytes == key.1)
            {
                let mut admitted = BTreeMap::new();
                for pair in &term.postings {
                    counters.posting_pairs_evaluated = admit(
                        counters.posting_pairs_evaluated,
                        self.limits.max_evaluated_pairs,
                        &counters,
                    )?;
                    admitted.insert(pair.0, pair.1);
                }
                postings.insert(key, admitted);
            } else {
                postings.insert(key, BTreeMap::new());
            }
        }
        let tomb: BTreeSet<&str> = tombstones.passage_ids.iter().map(String::as_str).collect();
        let averages = field_averages(&self.passages);
        let mut hits = Vec::new();
        for (ordinal, passage) in self.passages.iter().enumerate() {
            let Some(contributions) = evaluate(&compiled, ordinal as u32, &postings) else {
                continue;
            };
            counters.candidate_documents += 1;
            if tomb.contains(passage.passage_id.as_str())
                || !query.filters.iter().all(|f| filter_matches(f, passage))
            {
                continue;
            }
            let mut score = 0.0;
            for key in contributions {
                counters.scored_document_term_pairs = admit(
                    counters.scored_document_term_pairs,
                    self.limits.max_scored_pairs,
                    &counters,
                )?;
                let tf = postings[&key][&(ordinal as u32)];
                let term = self
                    .terms
                    .iter()
                    .find(|t| t.field == key.0 && t.bytes == key.1)
                    .ok_or_else(|| fail(Code::RecordInvalid, None, None, &counters))?;
                #[allow(clippy::assign_op_pattern)] // COLR/1 prescribes this exact rounded step.
                {
                    score = score
                        + bm25(
                            self.manifest.passage_count,
                            term.df,
                            tf,
                            passage,
                            key.0,
                            averages,
                        )?;
                }
            }
            let rank =
                quantize(score).ok_or_else(|| fail(Code::RecordInvalid, None, None, &counters))?;
            hits.push(hit(passage, score, rank));
        }
        hits.sort_by(|a, b| {
            b.rank_score
                .cmp(&a.rank_score)
                .then_with(|| a.passage_id.as_bytes().cmp(b.passage_id.as_bytes()))
        });
        hits.truncate(query.limit as usize);
        telemetry.current_allocated_bytes = telemetry
            .current_allocated_bytes
            .saturating_sub(query_bytes + tombstone_bytes);
        Ok(QueryOutput {
            hits,
            counters,
            telemetry,
        })
    }
}

#[allow(clippy::too_many_arguments)] // Mirrors the closed semantic-budget state.
fn compile(
    e: &ExpressionV1,
    depth: u64,
    negated: bool,
    unique: &mut Vec<Key>,
    positive: &mut bool,
    c: &mut Counters,
    r: &Reader,
) -> Result<Compiled> {
    if depth > r.limits.max_depth || c.ast_nodes >= r.limits.max_ast_nodes {
        return Err(fail(Code::ResourceLimit, None, None, c));
    }
    c.ast_nodes += 1;
    match e {
        ExpressionV1::Match { field, mode, text } => {
            let tokens = analyze(text).map_err(|_| fail(Code::QueryUnsupported, None, None, c))?;
            if tokens.is_empty() {
                return Err(fail(Code::QueryUnsupported, None, None, c));
            }
            for _ in &tokens {
                c.analyzed_term_occurrences =
                    admit(c.analyzed_term_occurrences, r.limits.max_analyzed_terms, c)?;
            }
            if !negated {
                *positive = true;
            }
            let dedup: BTreeSet<_> = tokens.into_iter().collect();
            let groups = dedup
                .into_iter()
                .map(|term| {
                    let keys = match field {
                        MatchFieldV1::Title => vec![(1, term)],
                        MatchFieldV1::Text => vec![(2, term)],
                        MatchFieldV1::All => vec![(1, term.clone()), (2, term)],
                    };
                    for key in &keys {
                        unique.push(key.clone());
                    }
                    keys
                })
                .collect();
            Ok(Compiled::Match {
                mode: *mode,
                groups,
            })
        }
        ExpressionV1::All(children) | ExpressionV1::Any(children) => {
            if children.is_empty() {
                return Err(fail(Code::QueryUnsupported, None, None, c));
            }
            let mut out = Vec::new();
            for child in children {
                out.push(compile(child, depth + 1, negated, unique, positive, c, r)?);
            }
            if matches!(e, ExpressionV1::All(_)) {
                Ok(Compiled::All(out))
            } else {
                Ok(Compiled::Any(out))
            }
        }
        ExpressionV1::Not(child) => Ok(Compiled::Not(Box::new(compile(
            child,
            depth + 1,
            true,
            unique,
            positive,
            c,
            r,
        )?))),
    }
}

fn expression_string_bytes(expression: &ExpressionV1) -> Result<u64> {
    match expression {
        ExpressionV1::Match { text, .. } => Ok(text.len() as u64),
        ExpressionV1::All(children) | ExpressionV1::Any(children) => {
            children.iter().try_fold(0u64, |sum, child| {
                sum.checked_add(expression_string_bytes(child)?)
                    .ok_or_else(|| fail(Code::ResourceLimit, None, None, &Counters::default()))
            })
        }
        ExpressionV1::Not(child) => expression_string_bytes(child),
    }
}

fn evaluate(
    e: &Compiled,
    doc: u32,
    p: &BTreeMap<Key, BTreeMap<u32, u32>>,
) -> Option<BTreeSet<Key>> {
    match e {
        Compiled::Match { mode, groups } => {
            let mut result = BTreeSet::new();
            let mut matched = 0;
            for group in groups {
                let found: Vec<_> = group
                    .iter()
                    .filter(|k| p.get(*k).is_some_and(|v| v.contains_key(&doc)))
                    .cloned()
                    .collect();
                if !found.is_empty() {
                    matched += 1;
                    result.extend(found);
                }
            }
            let ok = match mode {
                MatchModeV1::Any => matched > 0,
                MatchModeV1::All => matched == groups.len(),
            };
            ok.then_some(result)
        }
        Compiled::All(children) => {
            let mut result = BTreeSet::new();
            for child in children {
                result.extend(evaluate(child, doc, p)?);
            }
            Some(result)
        }
        Compiled::Any(children) => {
            let mut result = BTreeSet::new();
            let mut any = false;
            for child in children {
                if let Some(found) = evaluate(child, doc, p) {
                    any = true;
                    result.extend(found);
                }
            }
            any.then_some(result)
        }
        Compiled::Not(child) => {
            if evaluate(child, doc, p).is_some() {
                None
            } else {
                Some(BTreeSet::new())
            }
        }
    }
}

fn validate_tombstones(t: &TombstoneInputV1, r: &Reader, c: &Counters) -> Result<u64> {
    if t.watermark < r.manifest.tombstone_watermark
        || t.passage_ids.len() as u64 > r.limits.max_tombstones
    {
        return Err(fail(Code::TombstoneInvalid, None, None, c));
    }
    let mut bytes = 0u64;
    let mut previous: Option<&str> = None;
    for id in &t.passage_ids {
        bytes = bytes
            .checked_add(id.len() as u64)
            .ok_or_else(|| fail(Code::TombstoneInvalid, None, None, c))?;
        if bytes > r.limits.max_tombstone_bytes
            || id.is_empty()
            || id.len() > 128
            || !id
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"._:-".contains(&b))
            || previous.is_some_and(|p| p.as_bytes() >= id.as_bytes())
        {
            return Err(fail(Code::TombstoneInvalid, None, None, c));
        }
        previous = Some(id);
    }
    Ok(bytes)
}

fn admit(value: u64, maximum: u64, counters: &Counters) -> Result<u64> {
    if value >= maximum {
        return Err(fail(Code::ResourceLimit, None, None, counters));
    }
    value
        .checked_add(1)
        .ok_or_else(|| fail(Code::ResourceLimit, None, None, counters))
}

fn query_charge(
    bytes: u64,
    limits: &super::model::Limits,
    telemetry: &mut Telemetry,
    counters: &Counters,
) -> Result<()> {
    if bytes > limits.max_allocation {
        return Err(fail(Code::ResourceLimit, None, None, counters));
    }
    let current = telemetry
        .current_allocated_bytes
        .checked_add(bytes)
        .ok_or_else(|| fail(Code::ResourceLimit, None, None, counters))?;
    if current > limits.max_retained {
        return Err(fail(Code::ResourceLimit, None, None, counters));
    }
    telemetry.current_allocated_bytes = current;
    telemetry.allocated_bytes_high_water = telemetry.allocated_bytes_high_water.max(current);
    Ok(())
}
fn filter_matches(f: &FilterV1, p: &Passage) -> bool {
    match f {
        FilterV1::Eq { field, value } => {
            let actual = match field {
                EqFieldV1::PassageId => &p.passage_id,
                EqFieldV1::SourceObjectId => &p.source_object_id,
                EqFieldV1::RevisionId => &p.revision_id,
                EqFieldV1::CaptureId => &p.capture_id,
                EqFieldV1::RepresentationId => &p.representation_id,
                EqFieldV1::Language => &p.language,
                EqFieldV1::MediaType => &p.media_type,
                EqFieldV1::SourceClass => &p.source_class,
            };
            actual.as_bytes() == value.as_bytes()
        }
        FilterV1::TimeRange { field, gte, lt } => {
            let value = match field {
                TimeFieldV1::ObservedAt => p.observed_at,
                TimeFieldV1::PublishedAt => p.published_at,
            };
            if matches!(field, TimeFieldV1::PublishedAt) && value == i64::MIN {
                return false;
            }
            gte.is_none_or(|x| value >= x) && lt.is_none_or(|x| value < x)
        }
    }
}
fn field_averages(passages: &[Passage]) -> (f64, f64) {
    if passages.is_empty() {
        return (0.0, 0.0);
    }
    let title: u64 = passages
        .iter()
        .map(|p| u64::from(p.title_token_count))
        .sum();
    let text: u64 = passages.iter().map(|p| u64::from(p.text_token_count)).sum();
    (
        title as f64 / passages.len() as f64,
        text as f64 / passages.len() as f64,
    )
}
fn bm25(n: u32, df: u32, tf: u32, p: &Passage, field: u8, avgs: (f64, f64)) -> Result<f64> {
    let average = if field == 1 { avgs.0 } else { avgs.1 };
    if average == 0.0 {
        return Ok(0.0);
    }
    let numerator = (n - df) as f64 + 0.5;
    let denominator = df as f64 + 0.5;
    let argument = 1.0 + numerator / denominator;
    let idf = ln_colr_v1(argument)
        .ok_or_else(|| fail(Code::RecordInvalid, None, None, &Counters::default()))?;
    let saturation_numerator = (f64::from_bits(0x3ff3333333333333) + 1.0) * tf as f64;
    let dl = if field == 1 {
        p.title_token_count
    } else {
        p.text_token_count
    };
    let ratio = dl as f64 / average;
    let adjustment =
        (1.0 - f64::from_bits(0x3fe8000000000000)) + f64::from_bits(0x3fe8000000000000) * ratio;
    let saturation_denominator = tf as f64 + f64::from_bits(0x3ff3333333333333) * adjustment;
    let term_score = idf * (saturation_numerator / saturation_denominator);
    Ok((if field == 1 { 2.0 } else { 1.0 }) * term_score)
}
pub(super) fn ln_colr_v1(x: f64) -> Option<f64> {
    if !x.is_normal() || x <= 0.0 {
        return None;
    }
    let bits = x.to_bits();
    if bits >> 63 != 0 {
        return None;
    }
    let exponent = ((bits >> 52) & 0x7ff) as i32;
    let e = exponent - 1023;
    let m = f64::from_bits((1023u64 << 52) | (bits & 0x000f_ffff_ffff_ffff));
    let z = (m - 1.0) / (m + 1.0);
    let z2 = z * z;
    let mut term = z;
    let mut sum = z;
    for n in 1..=31 {
        #[allow(clippy::assign_op_pattern)] // COLR/1 requires separately rounded assignments.
        {
            term = term * z2;
            sum = sum + term / (2 * n + 1) as f64;
        }
    }
    let result = (2.0 * sum) + (e as f64) * f64::from_bits(0x3fe62e42fefa39ef);
    result.is_finite().then_some(result)
}
fn quantize(score: f64) -> Option<i64> {
    let value = score * f64::from_bits(0x41cdcd6500000000);
    if !value.is_finite() || value > i64::MAX as f64 || value < i64::MIN as f64 {
        return None;
    }
    let floor = value.floor();
    let fraction = value - floor;
    let rounded = if fraction < 0.5 {
        floor
    } else if fraction > 0.5 {
        floor + 1.0
    } else if (floor as i64) & 1 == 0 {
        floor
    } else {
        floor + 1.0
    };
    Some(rounded as i64)
}
fn hit(p: &Passage, score: f64, rank_score: i64) -> Hit {
    Hit {
        passage_id: p.passage_id.clone(),
        source_object_id: p.source_object_id.clone(),
        revision_id: p.revision_id.clone(),
        capture_id: p.capture_id.clone(),
        representation_id: p.representation_id.clone(),
        admission_id: p.admission_id.clone(),
        revision_scope_digest: p.revision_scope_digest,
        revision_policy_digest: p.revision_policy_digest,
        authority_scope_digest: p.authority_scope_digest,
        locator_display: p.locator_display.clone(),
        score_bits: score.to_bits(),
        rank_score,
    }
}

#[allow(dead_code)]
fn deterministic_order(a: &Hit, b: &Hit) -> Ordering {
    b.rank_score
        .cmp(&a.rank_score)
        .then_with(|| a.passage_id.cmp(&b.passage_id))
}
