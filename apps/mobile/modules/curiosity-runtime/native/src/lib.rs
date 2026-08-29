use rusqlite::{Connection, OpenFlags, OptionalExtension, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, HashMap};
use std::panic::{AssertUnwindSafe, catch_unwind};
use std::path::Path;

mod agent_journal;
mod attempt_journal;

const ABI_VERSION: u32 = 2;
const MIN_ABI_VERSION: u32 = 1;
const SCHEMA_VERSION: i64 = 15;
const EMPTY_HASH: &str = "0000000000000000000000000000000000000000000000000000000000000000";
const MAX_REQUEST_BYTES: usize = 1_048_576;
const MAX_EVENTS_PER_ADMISSION: usize = 64;
const MAX_EVENT_BODY_BYTES: usize = 262_144;
const MAX_READ_PAGE: u32 = 128;
const SCHEMA: &str = include_str!("schema-v15.sql");

#[derive(Clone, Copy, Debug)]
#[repr(i64)]
enum JournalError {
    RequestInvalid = -1,
    ResponseTooLarge = -2,
    StorageUnavailable = -3,
    AbiUnsupported = -4,
    SchemaUnsupported = -5,
    IntegrityInvalid = -6,
    CommandDigestConflict = -7,
    TransactionFailed = -8,
    RevisionFenced = -9,
    IdentityConflict = -10,
    RecordNotFound = -11,
}

type Result<T> = std::result::Result<T, JournalError>;

#[derive(Deserialize)]
#[serde(tag = "operation", rename_all = "camelCase", deny_unknown_fields)]
enum Request {
    Open {
        #[serde(rename = "abiVersion")]
        abi_version: u32,
        #[serde(rename = "catalogDigest")]
        catalog_digest: String,
        #[serde(rename = "databasePath")]
        database_path: String,
    },
    ReadEvents {
        #[serde(rename = "abiVersion")]
        abi_version: u32,
        #[serde(rename = "catalogDigest")]
        catalog_digest: String,
        #[serde(rename = "databasePath")]
        database_path: String,
        #[serde(rename = "afterSequence")]
        after_sequence: i64,
        limit: u32,
    },
    Admit {
        #[serde(rename = "abiVersion")]
        abi_version: u32,
        #[serde(rename = "catalogDigest")]
        catalog_digest: String,
        #[serde(rename = "databasePath")]
        database_path: String,
        admission: Admission,
    },
    StartRun {
        #[serde(rename = "abiVersion")]
        abi_version: u32,
        #[serde(rename = "catalogDigest")]
        catalog_digest: String,
        #[serde(rename = "databasePath")]
        database_path: String,
        run: agent_journal::StartRunInput,
    },
    CommitTransition {
        #[serde(rename = "abiVersion")]
        abi_version: u32,
        #[serde(rename = "catalogDigest")]
        catalog_digest: String,
        #[serde(rename = "databasePath")]
        database_path: String,
        transition: agent_journal::CommitTransitionInput,
    },
    RunnableRuns {
        #[serde(rename = "abiVersion")]
        abi_version: u32,
        #[serde(rename = "catalogDigest")]
        catalog_digest: String,
        #[serde(rename = "databasePath")]
        database_path: String,
        limit: u32,
    },
    ReadRunProjection {
        #[serde(rename = "abiVersion")]
        abi_version: u32,
        #[serde(rename = "catalogDigest")]
        catalog_digest: String,
        #[serde(rename = "databasePath")]
        database_path: String,
        #[serde(rename = "runId")]
        run_id: String,
    },
    ArmDispatch {
        #[serde(rename = "abiVersion")]
        abi_version: u32,
        #[serde(rename = "catalogDigest")]
        catalog_digest: String,
        #[serde(rename = "databasePath")]
        database_path: String,
        dispatch: attempt_journal::ArmDispatchInput,
    },
    SettleAttempt {
        #[serde(rename = "abiVersion")]
        abi_version: u32,
        #[serde(rename = "catalogDigest")]
        catalog_digest: String,
        #[serde(rename = "databasePath")]
        database_path: String,
        settlement: attempt_journal::SettleAttemptInput,
    },
    ReconcileInterrupted {
        #[serde(rename = "abiVersion")]
        abi_version: u32,
        #[serde(rename = "catalogDigest")]
        catalog_digest: String,
        #[serde(rename = "databasePath")]
        database_path: String,
        #[serde(rename = "reconciledAt")]
        reconciled_at: String,
    },
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Admission {
    accepted_at: String,
    actor_id: String,
    command_digest: String,
    command_id: String,
    contribution_id: String,
    contribution_version: String,
    events: Vec<ProposedEvent>,
    plugin_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ProposedEvent {
    body: Value,
    stream_id: String,
    #[serde(rename = "type")]
    event_type: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct JournalStatus {
    abi_version: u32,
    schema_version: i64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct StoredEvent {
    actor_id: String,
    aggregate_version: i64,
    body: Value,
    catalog_digest: String,
    causation_id: String,
    child_execution_id: String,
    command_id: String,
    contribution_id: String,
    contribution_version: String,
    correlation_id: String,
    event_hash: String,
    event_id: String,
    event_schema_version: u32,
    occurred_at: String,
    parent_execution_id: String,
    plugin_id: String,
    previous_hash: String,
    root_execution_id: String,
    sequence: i64,
    stream_id: String,
    #[serde(rename = "type")]
    event_type: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StoredEventEnvelope<'a> {
    actor_id: &'a str,
    aggregate_version: i64,
    body: &'a Value,
    catalog_digest: &'a str,
    causation_id: &'a str,
    child_execution_id: &'a str,
    command_id: &'a str,
    contribution_id: &'a str,
    contribution_version: &'a str,
    correlation_id: &'a str,
    event_schema_version: u32,
    occurred_at: &'a str,
    parent_execution_id: &'a str,
    plugin_id: &'a str,
    previous_hash: &'a str,
    root_execution_id: &'a str,
    sequence: i64,
    stream_id: &'a str,
    #[serde(rename = "type")]
    event_type: &'a str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Acknowledgement {
    actor_id: String,
    command_id: String,
    disposition: &'static str,
    event_count: i64,
    first_sequence: i64,
    last_sequence: i64,
}

#[derive(Serialize)]
struct AdmitResponse {
    acknowledgement: Acknowledgement,
    events: Vec<StoredEvent>,
}

#[derive(Debug)]
struct AdmissionRow {
    command_digest: String,
    event_count: i64,
    first_sequence: i64,
    last_sequence: i64,
}

#[unsafe(no_mangle)]
pub extern "C" fn curiosity_journal_abi_version() -> u32 {
    ABI_VERSION
}

#[unsafe(no_mangle)]
/// Executes one bounded journal request using caller-owned buffers.
///
/// # Safety
///
/// `request` must reference `request_length` readable bytes and `response` must
/// reference `response_capacity` writable bytes for the duration of this call.
/// The two regions must not overlap. Neither pointer is retained.
pub unsafe extern "C" fn curiosity_journal_call(
    request: *const u8,
    request_length: usize,
    response: *mut u8,
    response_capacity: usize,
) -> i64 {
    let result = catch_unwind(AssertUnwindSafe(|| {
        if request.is_null()
            || response.is_null()
            || request_length == 0
            || request_length > MAX_REQUEST_BYTES
        {
            return Err(JournalError::RequestInvalid);
        }
        let request = unsafe { std::slice::from_raw_parts(request, request_length) };
        let request: Request =
            serde_json::from_slice(request).map_err(|_| JournalError::RequestInvalid)?;
        let output = execute(request)?;
        if output.len() > response_capacity {
            return Err(JournalError::ResponseTooLarge);
        }
        unsafe {
            std::ptr::copy_nonoverlapping(output.as_ptr(), response, output.len());
        }
        Ok(output.len() as i64)
    }));
    match result {
        Ok(Ok(length)) => length,
        Ok(Err(error)) => error as i64,
        Err(_) => JournalError::TransactionFailed as i64,
    }
}

fn execute(request: Request) -> Result<Vec<u8>> {
    match request {
        Request::Open {
            abi_version,
            catalog_digest,
            database_path,
        } => {
            validate_common(abi_version, &database_path, &catalog_digest)?;
            let connection = open_database(&database_path)?;
            initialize(&connection, &catalog_digest)?;
            encode(&JournalStatus {
                abi_version,
                schema_version: SCHEMA_VERSION,
            })
        }
        Request::ReadEvents {
            abi_version,
            catalog_digest,
            database_path,
            after_sequence,
            limit,
        } => {
            validate_common(abi_version, &database_path, &catalog_digest)?;
            if limit == 0 || limit > MAX_READ_PAGE {
                return Err(JournalError::RequestInvalid);
            }
            let connection = open_ready_database(&database_path, &catalog_digest)?;
            encode(&read_events(&connection, after_sequence, limit)?)
        }
        Request::Admit {
            abi_version,
            catalog_digest,
            database_path,
            admission,
        } => {
            validate_common(abi_version, &database_path, &catalog_digest)?;
            validate_admission(&admission)?;
            let mut connection = open_ready_database(&database_path, &catalog_digest)?;
            encode(&admit(&mut connection, &catalog_digest, admission)?)
        }
        Request::StartRun {
            abi_version,
            catalog_digest,
            database_path,
            run,
        } => {
            validate_agent_common(abi_version, &database_path, &catalog_digest)?;
            let mut connection = open_ready_database(&database_path, &catalog_digest)?;
            encode(&agent_journal::start_run(
                &mut connection,
                &catalog_digest,
                run,
                agent_journal::FaultPoint::None,
            )?)
        }
        Request::CommitTransition {
            abi_version,
            catalog_digest,
            database_path,
            transition,
        } => {
            validate_agent_common(abi_version, &database_path, &catalog_digest)?;
            let mut connection = open_ready_database(&database_path, &catalog_digest)?;
            encode(&agent_journal::commit_transition(
                &mut connection,
                &catalog_digest,
                transition,
                agent_journal::FaultPoint::None,
            )?)
        }
        Request::RunnableRuns {
            abi_version,
            catalog_digest,
            database_path,
            limit,
        } => {
            validate_agent_common(abi_version, &database_path, &catalog_digest)?;
            if limit == 0 || limit > MAX_READ_PAGE {
                return Err(JournalError::RequestInvalid);
            }
            let connection = open_ready_database(&database_path, &catalog_digest)?;
            encode(&agent_journal::runnable_runs(&connection, limit)?)
        }
        Request::ReadRunProjection {
            abi_version,
            catalog_digest,
            database_path,
            run_id,
        } => {
            validate_agent_common(abi_version, &database_path, &catalog_digest)?;
            if !bounded(&run_id, 512) {
                return Err(JournalError::RequestInvalid);
            }
            let connection = open_ready_database(&database_path, &catalog_digest)?;
            encode(&agent_journal::read_run_projection(&connection, &run_id)?)
        }
        Request::ArmDispatch {
            abi_version,
            catalog_digest,
            database_path,
            dispatch,
        } => {
            validate_agent_common(abi_version, &database_path, &catalog_digest)?;
            let mut connection = open_ready_database(&database_path, &catalog_digest)?;
            encode(&attempt_journal::arm_dispatch(
                &mut connection,
                &catalog_digest,
                dispatch,
                attempt_journal::FaultPoint::None,
            )?)
        }
        Request::SettleAttempt {
            abi_version,
            catalog_digest,
            database_path,
            settlement,
        } => {
            validate_agent_common(abi_version, &database_path, &catalog_digest)?;
            let mut connection = open_ready_database(&database_path, &catalog_digest)?;
            encode(&attempt_journal::settle_attempt(
                &mut connection,
                &catalog_digest,
                settlement,
                attempt_journal::FaultPoint::None,
            )?)
        }
        Request::ReconcileInterrupted {
            abi_version,
            catalog_digest,
            database_path,
            reconciled_at,
        } => {
            validate_agent_common(abi_version, &database_path, &catalog_digest)?;
            if !bounded(&reconciled_at, 128) {
                return Err(JournalError::RequestInvalid);
            }
            let mut connection = open_ready_database(&database_path, &catalog_digest)?;
            encode(&attempt_journal::reconcile_interrupted(
                &mut connection,
                &reconciled_at,
            )?)
        }
    }
}

fn encode<T: Serialize>(value: &T) -> Result<Vec<u8>> {
    serde_json::to_vec(value).map_err(|_| JournalError::TransactionFailed)
}

fn validate_common(abi_version: u32, path: &str, catalog_digest: &str) -> Result<()> {
    if !(MIN_ABI_VERSION..=ABI_VERSION).contains(&abi_version) {
        return Err(JournalError::AbiUnsupported);
    }
    if path.is_empty()
        || path.as_bytes().contains(&0)
        || !is_digest(catalog_digest)
        || Path::new(path).file_name().is_none()
    {
        return Err(JournalError::RequestInvalid);
    }
    Ok(())
}

fn validate_agent_common(abi_version: u32, path: &str, catalog_digest: &str) -> Result<()> {
    validate_common(abi_version, path, catalog_digest)?;
    if abi_version != 2 {
        return Err(JournalError::AbiUnsupported);
    }
    Ok(())
}

fn validate_admission(input: &Admission) -> Result<()> {
    if input.events.is_empty()
        || input.events.len() > MAX_EVENTS_PER_ADMISSION
        || !is_digest(&input.command_digest)
        || !bounded(&input.accepted_at, 128)
        || !bounded(&input.actor_id, 512)
        || !bounded(&input.command_id, 512)
        || !bounded(&input.plugin_id, 512)
        || !bounded(&input.contribution_id, 512)
        || !bounded(&input.contribution_version, 128)
    {
        return Err(JournalError::RequestInvalid);
    }
    for event in &input.events {
        if !bounded(&event.stream_id, 512)
            || !bounded(&event.event_type, 512)
            || canonical_json(&event.body)?.len() > MAX_EVENT_BODY_BYTES
        {
            return Err(JournalError::RequestInvalid);
        }
    }
    Ok(())
}

fn bounded(value: &str, maximum: usize) -> bool {
    !value.is_empty() && value.len() <= maximum
}

fn is_digest(value: &str) -> bool {
    value.len() == 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

fn open_database(path: &str) -> Result<Connection> {
    let connection = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_WRITE
            | OpenFlags::SQLITE_OPEN_CREATE
            | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|_| JournalError::StorageUnavailable)?;
    connection
        .busy_timeout(std::time::Duration::from_secs(5))
        .map_err(|_| JournalError::StorageUnavailable)?;
    connection
        .pragma_update(None, "trusted_schema", "OFF")
        .map_err(|_| JournalError::StorageUnavailable)?;
    let mode: String = connection
        .query_row("PRAGMA journal_mode=WAL", [], |row| row.get(0))
        .map_err(|_| JournalError::StorageUnavailable)?;
    if !mode.eq_ignore_ascii_case("wal") {
        return Err(JournalError::StorageUnavailable);
    }
    connection
        .pragma_update(None, "synchronous", "FULL")
        .map_err(|_| JournalError::StorageUnavailable)?;
    let synchronous: i64 = connection
        .pragma_query_value(None, "synchronous", |row| row.get(0))
        .map_err(|_| JournalError::StorageUnavailable)?;
    if synchronous != 2 {
        return Err(JournalError::StorageUnavailable);
    }
    Ok(connection)
}

fn open_ready_database(path: &str, catalog_digest: &str) -> Result<Connection> {
    let connection = open_database(path)?;
    verify_schema(&connection)?;
    let active: String = connection
        .query_row(
            "SELECT value FROM harness_metadata WHERE key='active_catalog_digest'",
            [],
            |row| row.get(0),
        )
        .map_err(|_| JournalError::SchemaUnsupported)?;
    if active != catalog_digest {
        return Err(JournalError::SchemaUnsupported);
    }
    connection
        .pragma_update(None, "foreign_keys", "ON")
        .map_err(|_| JournalError::StorageUnavailable)?;
    Ok(connection)
}

fn initialize(connection: &Connection, catalog_digest: &str) -> Result<()> {
    connection
        .pragma_update(None, "foreign_keys", "OFF")
        .map_err(|_| JournalError::StorageUnavailable)?;
    let has_metadata: bool = connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_schema WHERE type='table' AND name='harness_metadata')",
            [],
            |row| row.get(0),
        )
        .map_err(|_| JournalError::StorageUnavailable)?;
    if has_metadata {
        verify_schema(connection)?;
    } else {
        connection
            .execute_batch(SCHEMA)
            .map_err(|_| JournalError::SchemaUnsupported)?;
    }
    connection
        .execute(
            "INSERT INTO harness_metadata(key,value) VALUES ('active_catalog_digest',?1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            [catalog_digest],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    connection
        .execute(
            "INSERT INTO harness_metadata(key,value) VALUES ('journal_abi_version',?1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            [ABI_VERSION.to_string()],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    verify_integrity(connection)?;
    connection
        .pragma_update(None, "foreign_keys", "ON")
        .map_err(|_| JournalError::StorageUnavailable)?;
    Ok(())
}

fn verify_schema(connection: &Connection) -> Result<()> {
    let version: String = connection
        .query_row(
            "SELECT value FROM harness_metadata WHERE key='schema_version'",
            [],
            |row| row.get(0),
        )
        .map_err(|_| JournalError::SchemaUnsupported)?;
    if version != SCHEMA_VERSION.to_string() {
        return Err(JournalError::SchemaUnsupported);
    }
    for table in REQUIRED_TABLES {
        let exists: bool = connection
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?1)",
                [table],
                |row| row.get(0),
            )
            .map_err(|_| JournalError::SchemaUnsupported)?;
        if !exists {
            return Err(JournalError::SchemaUnsupported);
        }
    }
    Ok(())
}

const REQUIRED_TABLES: &[&str] = &[
    "harness_metadata",
    "command_admissions",
    "events",
    "reaction_runs",
    "actions",
    "executions",
    "attempts",
    "gates",
    "capability_revocations",
    "provider_calls",
    "tool_calls",
    "quarantined_receipts",
    "resource_leases",
    "questions",
    "workflow_instances",
    "workflow_steps",
    "execution_ancestry",
    "delegation_groups",
    "agent_sessions",
    "agent_runs",
    "agent_session_messages",
];

fn verify_integrity(connection: &Connection) -> Result<()> {
    let quick_check: String = connection
        .query_row("PRAGMA quick_check", [], |row| row.get(0))
        .map_err(|_| JournalError::IntegrityInvalid)?;
    if quick_check != "ok" {
        return Err(JournalError::IntegrityInvalid);
    }
    let foreign_key_violation: bool = connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM pragma_foreign_key_check)",
            [],
            |row| row.get(0),
        )
        .map_err(|_| JournalError::IntegrityInvalid)?;
    if foreign_key_violation {
        return Err(JournalError::IntegrityInvalid);
    }
    verify_event_chain(connection)
}

fn verify_event_chain(connection: &Connection) -> Result<()> {
    let events = read_events(connection, 0, u32::MAX)?;
    let mut previous_hash = EMPTY_HASH.to_owned();
    let mut command_indexes: HashMap<(String, String), usize> = HashMap::new();
    for (offset, event) in events.iter().enumerate() {
        if event.sequence != offset as i64 + 1 || event.previous_hash != previous_hash {
            return Err(JournalError::IntegrityInvalid);
        }
        let hash = sha256(&canonical_json(&event.envelope_value()?)?);
        if hash != event.event_hash {
            return Err(JournalError::IntegrityInvalid);
        }
        let key = (event.actor_id.clone(), event.command_id.clone());
        let index = command_indexes.entry(key).or_default();
        let expected_id = sha256(&format!(
            "{}:{}:{}:{}",
            event.actor_id, event.command_id, *index, event.event_hash
        ));
        if expected_id != event.event_id {
            return Err(JournalError::IntegrityInvalid);
        }
        *index += 1;
        previous_hash = event.event_hash.clone();
    }
    Ok(())
}

impl StoredEvent {
    fn envelope_value(&self) -> Result<Value> {
        serde_json::to_value(StoredEventEnvelope {
            actor_id: &self.actor_id,
            aggregate_version: self.aggregate_version,
            body: &self.body,
            catalog_digest: &self.catalog_digest,
            causation_id: &self.causation_id,
            child_execution_id: &self.child_execution_id,
            command_id: &self.command_id,
            contribution_id: &self.contribution_id,
            contribution_version: &self.contribution_version,
            correlation_id: &self.correlation_id,
            event_schema_version: self.event_schema_version,
            occurred_at: &self.occurred_at,
            parent_execution_id: &self.parent_execution_id,
            plugin_id: &self.plugin_id,
            previous_hash: &self.previous_hash,
            root_execution_id: &self.root_execution_id,
            sequence: self.sequence,
            stream_id: &self.stream_id,
            event_type: &self.event_type,
        })
        .map_err(|_| JournalError::IntegrityInvalid)
    }
}

fn read_events(
    connection: &Connection,
    after_sequence: i64,
    limit: u32,
) -> Result<Vec<StoredEvent>> {
    let mut statement = connection
        .prepare(
            "SELECT global_sequence,event_id,command_id,actor_id,plugin_id,event_type,stream_id,body_json,occurred_at,previous_hash,event_hash,event_schema_version,aggregate_version,causation_id,correlation_id,root_execution_id,parent_execution_id,child_execution_id,contribution_id,contribution_version,catalog_digest FROM events WHERE global_sequence>?1 ORDER BY global_sequence LIMIT ?2",
        )
        .map_err(|_| JournalError::IntegrityInvalid)?;
    let rows = statement
        .query_map(params![after_sequence, limit], |row| {
            let body_json: String = row.get(7)?;
            let body = serde_json::from_str(&body_json).map_err(|error| {
                rusqlite::Error::FromSqlConversionFailure(
                    body_json.len(),
                    rusqlite::types::Type::Text,
                    Box::new(error),
                )
            })?;
            Ok(StoredEvent {
                sequence: row.get(0)?,
                event_id: row.get(1)?,
                command_id: row.get(2)?,
                actor_id: row.get(3)?,
                plugin_id: row.get(4)?,
                event_type: row.get(5)?,
                stream_id: row.get(6)?,
                body,
                occurred_at: row.get(8)?,
                previous_hash: row.get(9)?,
                event_hash: row.get(10)?,
                event_schema_version: row.get(11)?,
                aggregate_version: row.get(12)?,
                causation_id: row.get(13)?,
                correlation_id: row.get(14)?,
                root_execution_id: row.get(15)?,
                parent_execution_id: row.get(16)?,
                child_execution_id: row.get(17)?,
                contribution_id: row.get(18)?,
                contribution_version: row.get(19)?,
                catalog_digest: row.get(20)?,
            })
        })
        .map_err(|_| JournalError::IntegrityInvalid)?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|_| JournalError::IntegrityInvalid)
}

fn admit(
    connection: &mut Connection,
    catalog_digest: &str,
    input: Admission,
) -> Result<AdmitResponse> {
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|_| JournalError::TransactionFailed)?;
    if let Some(existing) = admission_row(&transaction, &input.actor_id, &input.command_id)? {
        if existing.command_digest != input.command_digest {
            return Err(JournalError::CommandDigestConflict);
        }
        return Ok(AdmitResponse {
            acknowledgement: Acknowledgement {
                actor_id: input.actor_id,
                command_id: input.command_id,
                disposition: "duplicate",
                event_count: existing.event_count,
                first_sequence: existing.first_sequence,
                last_sequence: existing.last_sequence,
            },
            events: Vec::new(),
        });
    }

    let tail: Option<(i64, String)> = transaction
        .query_row(
            "SELECT global_sequence,event_hash FROM events ORDER BY global_sequence DESC LIMIT 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|_| JournalError::TransactionFailed)?;
    let mut sequence = tail.as_ref().map_or(0, |tail| tail.0);
    let mut previous_hash = tail.map_or_else(|| EMPTY_HASH.to_owned(), |tail| tail.1);
    let first_sequence = sequence + 1;
    let execution_id = input
        .events
        .iter()
        .find_map(|event| field(&event.body, &["rootExecutionId", "turnId", "executionId"]));
    let mut stored_events = Vec::with_capacity(input.events.len());
    for (event_index, event) in input.events.iter().enumerate() {
        sequence += 1;
        let aggregate_version: i64 = transaction
            .query_row(
                "SELECT count(*)+1 FROM events WHERE stream_id=?1",
                [&event.stream_id],
                |row| row.get(0),
            )
            .map_err(|_| JournalError::TransactionFailed)?;
        let root_execution_id = field(&event.body, &["rootExecutionId", "turnId"])
            .or_else(|| execution_id.clone())
            .unwrap_or_else(|| event.stream_id.clone());
        let child_execution_id = field(&event.body, &["childExecutionId", "executionId"])
            .unwrap_or_else(|| root_execution_id.clone());
        let correlation_id = field(
            &event.body,
            &["correlationId", "turnId", "delegationGroupId"],
        )
        .unwrap_or_else(|| root_execution_id.clone());
        let parent_execution_id =
            field(&event.body, &["parentExecutionId"]).unwrap_or_else(|| root_execution_id.clone());
        let mut stored = StoredEvent {
            actor_id: input.actor_id.clone(),
            aggregate_version,
            body: event.body.clone(),
            catalog_digest: catalog_digest.to_owned(),
            causation_id: input.command_id.clone(),
            child_execution_id,
            command_id: input.command_id.clone(),
            contribution_id: input.contribution_id.clone(),
            contribution_version: input.contribution_version.clone(),
            correlation_id,
            event_hash: String::new(),
            event_id: String::new(),
            event_schema_version: 1,
            occurred_at: input.accepted_at.clone(),
            parent_execution_id,
            plugin_id: input.plugin_id.clone(),
            previous_hash: previous_hash.clone(),
            root_execution_id,
            sequence,
            stream_id: event.stream_id.clone(),
            event_type: event.event_type.clone(),
        };
        stored.event_hash = sha256(&canonical_json(&stored.envelope_value()?)?);
        stored.event_id = sha256(&format!(
            "{}:{}:{}:{}",
            input.actor_id, input.command_id, event_index, stored.event_hash
        ));
        transaction
            .execute(
                "INSERT INTO events(global_sequence,event_id,command_id,actor_id,plugin_id,event_type,stream_id,body_json,occurred_at,previous_hash,event_hash,event_schema_version,aggregate_version,causation_id,correlation_id,root_execution_id,parent_execution_id,child_execution_id,contribution_id,contribution_version,catalog_digest) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21)",
                params![
                    stored.sequence,
                    stored.event_id,
                    stored.command_id,
                    stored.actor_id,
                    stored.plugin_id,
                    stored.event_type,
                    stored.stream_id,
                    canonical_json(&stored.body)?,
                    stored.occurred_at,
                    stored.previous_hash,
                    stored.event_hash,
                    stored.event_schema_version,
                    stored.aggregate_version,
                    stored.causation_id,
                    stored.correlation_id,
                    stored.root_execution_id,
                    stored.parent_execution_id,
                    stored.child_execution_id,
                    stored.contribution_id,
                    stored.contribution_version,
                    stored.catalog_digest,
                ],
            )
            .map_err(|_| JournalError::TransactionFailed)?;
        previous_hash = stored.event_hash.clone();
        stored_events.push(stored);
    }
    transaction
        .execute(
            "INSERT INTO command_admissions(actor_id,command_id,command_digest,nonce,accepted_at,first_sequence,last_sequence,event_count) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
            params![
                input.actor_id,
                input.command_id,
                input.command_digest,
                input.command_digest,
                input.accepted_at,
                first_sequence,
                sequence,
                input.events.len() as i64,
            ],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    transaction
        .commit()
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(AdmitResponse {
        acknowledgement: Acknowledgement {
            actor_id: input.actor_id,
            command_id: input.command_id,
            disposition: "accepted",
            event_count: stored_events.len() as i64,
            first_sequence,
            last_sequence: sequence,
        },
        events: stored_events,
    })
}

fn admission_row(
    connection: &Connection,
    actor_id: &str,
    command_id: &str,
) -> Result<Option<AdmissionRow>> {
    connection
        .query_row(
            "SELECT command_digest,event_count,first_sequence,last_sequence FROM command_admissions WHERE actor_id=?1 AND command_id=?2",
            params![actor_id, command_id],
            |row| {
                Ok(AdmissionRow {
                    command_digest: row.get(0)?,
                    event_count: row.get(1)?,
                    first_sequence: row.get(2)?,
                    last_sequence: row.get(3)?,
                })
            },
        )
        .optional()
        .map_err(|_| JournalError::TransactionFailed)
}

fn field(value: &Value, names: &[&str]) -> Option<String> {
    let object = value.as_object()?;
    names.iter().find_map(|name| {
        object
            .get(*name)
            .and_then(Value::as_str)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned)
    })
}

fn canonical_json(value: &Value) -> Result<String> {
    match value {
        Value::Null | Value::Bool(_) | Value::Number(_) | Value::String(_) => {
            serde_json::to_string(value).map_err(|_| JournalError::RequestInvalid)
        }
        Value::Array(values) => {
            let values = values
                .iter()
                .map(canonical_json)
                .collect::<Result<Vec<_>>>()?;
            Ok(format!("[{}]", values.join(",")))
        }
        Value::Object(object) => {
            let sorted = object.iter().collect::<BTreeMap<_, _>>();
            let entries = sorted
                .into_iter()
                .map(|(key, value)| {
                    Ok(format!(
                        "{}:{}",
                        serde_json::to_string(key).map_err(|_| JournalError::RequestInvalid)?,
                        canonical_json(value)?
                    ))
                })
                .collect::<Result<Vec<_>>>()?;
            Ok(format!("{{{}}}", entries.join(",")))
        }
    }
}

fn sha256(value: &str) -> String {
    format!("{:x}", Sha256::digest(value.as_bytes()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn path(name: &str) -> String {
        let root = std::env::temp_dir().join(format!(
            "curiosity-journal-{}-{}-{}",
            std::process::id(),
            name,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&root).unwrap();
        root.join("journal.sqlite3").to_string_lossy().into_owned()
    }

    fn admission() -> Admission {
        Admission {
            accepted_at: "2026-08-29T12:00:00.000Z".into(),
            actor_id: "local-ipad-owner".into(),
            command_digest: "1".repeat(64),
            command_id: "command-1".into(),
            contribution_id: "curiosity.stock.thread.commands.open".into(),
            contribution_version: "1".into(),
            events: vec![ProposedEvent {
                body: serde_json::json!({
                    "openedBy": "local-ipad-owner",
                    "schemaVersion": 1,
                    "threadId": "thread-1",
                    "title": "Hello"
                }),
                stream_id: "thread-1".into(),
                event_type: "thread.opened".into(),
            }],
            plugin_id: "curiosity.stock.thread".into(),
        }
    }

    #[test]
    fn persists_deduplicates_and_verifies_the_event_chain() {
        let database_path = path("roundtrip");
        let digest = "0".repeat(64);
        let connection = open_database(&database_path).unwrap();
        initialize(&connection, &digest).unwrap();
        drop(connection);

        let mut connection = open_ready_database(&database_path, &digest).unwrap();
        let accepted = admit(&mut connection, &digest, admission()).unwrap();
        assert_eq!(accepted.acknowledgement.disposition, "accepted");
        assert_eq!(accepted.events.len(), 1);
        assert_eq!(
            accepted.events[0].event_hash,
            "ad832e81949d3877fa30be597350c8e15a8731a13df59efc0bf7db7400bf34a9"
        );
        assert_eq!(
            accepted.events[0].event_id,
            "08288af35e54aa9cf5e9913eebd4a11687215a6457f9eda071864497f2509302"
        );
        drop(connection);

        let connection = open_database(&database_path).unwrap();
        initialize(&connection, &digest).unwrap();
        let events = read_events(&connection, 0, 128).unwrap();
        assert_eq!(events.len(), 1);
        drop(connection);

        let mut connection = open_ready_database(&database_path, &digest).unwrap();
        let duplicate = admit(&mut connection, &digest, admission()).unwrap();
        assert_eq!(duplicate.acknowledgement.disposition, "duplicate");
        assert!(duplicate.events.is_empty());
    }

    #[test]
    fn rejects_digest_conflict_and_body_corruption() {
        let database_path = path("corruption");
        let digest = "0".repeat(64);
        let connection = open_database(&database_path).unwrap();
        initialize(&connection, &digest).unwrap();
        drop(connection);
        let mut connection = open_ready_database(&database_path, &digest).unwrap();
        admit(&mut connection, &digest, admission()).unwrap();
        let mut conflict = admission();
        conflict.command_digest = "2".repeat(64);
        assert!(matches!(
            admit(&mut connection, &digest, conflict),
            Err(JournalError::CommandDigestConflict)
        ));
        connection
            .execute("UPDATE events SET body_json='{}'", [])
            .unwrap();
        drop(connection);
        let connection = open_database(&database_path).unwrap();
        assert!(matches!(
            initialize(&connection, &digest),
            Err(JournalError::IntegrityInvalid)
        ));
    }
}
