//! Internal, fixture-only COLR/1 qualification reader.
//!
//! Clean-room provenance: ADR 0054, the in-repository COLR/1 specification,
//! NIST FIPS 180-4, and Robertson/Walker BM25 literature only. This module is
//! deliberately private and feature-gated; it is not a builder or serving API.

// Stable failure diagnostics carry semantic counters and bounded local
// measurements by value so fail-closed paths perform no diagnostic allocation.
#![allow(clippy::result_large_err)]

mod analyzer;
mod model;
mod parser;
mod query;
mod sha256;
mod source;

#[cfg(feature = "owned-lexical-builder-qualification")]
mod builder;

#[cfg(test)]
mod tests;
