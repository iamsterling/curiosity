#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum Code {
    LedgerVersionUnsupported,
    LedgerSchemaInvalid,
    LedgerEntityTypeInvalid,
    LedgerFactAuthorityInvalid,
    LedgerReplayInvalid,
    LedgerCorrupt,
    LedgerSchemaVersionMissing,
    LedgerSchemaVersionInvalid,
    CaptureCorrupt,
    ParityCanonicalizationFailed,
    ParityCanonicalResultUndefined,
    ParityCanonicalDigestFailed,
    ParityCollationUnsupported,
    ParityInputSchemaInvalid,
    ParityLimitExceeded,
    ParityFixtureRootUnavailable,
    ParityPathInvalid,
    ParityLiveRootForbidden,
    ParityRootMissing,
    ParitySymlinkForbidden,
    ParityFilesystemKindInvalid,
    ParityFilesystemReadFailed,
    ParityInternalFailure,
}

impl Code {
    pub(crate) fn text(self) -> &'static str {
        match self {
            Self::LedgerVersionUnsupported => "LEDGER_VERSION_UNSUPPORTED",
            Self::LedgerSchemaInvalid => "LEDGER_SCHEMA_INVALID",
            Self::LedgerEntityTypeInvalid => "LEDGER_ENTITY_TYPE_INVALID",
            Self::LedgerFactAuthorityInvalid => "LEDGER_FACT_AUTHORITY_INVALID",
            Self::LedgerReplayInvalid => "LEDGER_REPLAY_INVALID",
            Self::LedgerCorrupt => "LEDGER_CORRUPT",
            Self::LedgerSchemaVersionMissing => "LEDGER_SCHEMA_VERSION_MISSING",
            Self::LedgerSchemaVersionInvalid => "LEDGER_SCHEMA_VERSION_INVALID",
            Self::CaptureCorrupt => "CAPTURE_CORRUPT",
            Self::ParityCanonicalizationFailed => "PARITY_CANONICALIZATION_FAILED",
            Self::ParityCanonicalResultUndefined => "PARITY_CANONICAL_RESULT_UNDEFINED",
            Self::ParityCanonicalDigestFailed => "PARITY_CANONICAL_DIGEST_FAILED",
            Self::ParityCollationUnsupported => "PARITY_COLLATION_UNSUPPORTED",
            Self::ParityInputSchemaInvalid => "PARITY_INPUT_SCHEMA_INVALID",
            Self::ParityLimitExceeded => "PARITY_LIMIT_EXCEEDED",
            Self::ParityFixtureRootUnavailable => "PARITY_FIXTURE_ROOT_UNAVAILABLE",
            Self::ParityPathInvalid => "PARITY_PATH_INVALID",
            Self::ParityLiveRootForbidden => "PARITY_LIVE_ROOT_FORBIDDEN",
            Self::ParityRootMissing => "PARITY_ROOT_MISSING",
            Self::ParitySymlinkForbidden => "PARITY_SYMLINK_FORBIDDEN",
            Self::ParityFilesystemKindInvalid => "PARITY_FILESYSTEM_KIND_INVALID",
            Self::ParityFilesystemReadFailed => "PARITY_FILESYSTEM_READ_FAILED",
            Self::ParityInternalFailure => "PARITY_INTERNAL_FAILURE",
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct Failure {
    pub(crate) code: Code,
    pub(crate) path: Option<String>,
}

pub(crate) fn fail(code: Code, path: impl Into<Option<String>>) -> Failure {
    Failure {
        code,
        path: path.into(),
    }
}
