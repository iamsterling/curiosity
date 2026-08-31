use super::agent_journal::{KernelEvent, SourceContext, append_kernel_events, event_context};
use super::*;
use serde_json::json;

const ATTEMPT_PLUGIN: &str = "curiosity.kernel.attempts";
const MAX_SETTLEMENT_EVENTS: usize = 16;

#[derive(Deserialize)]
#[serde(tag = "phase", rename_all = "camelCase", deny_unknown_fields)]
#[allow(clippy::large_enum_variant)]
pub(super) enum ArmDispatchInput {
    Allocate {
        #[serde(rename = "actionId")]
        action_id: String,
        #[serde(rename = "allocatedAt")]
        allocated_at: String,
        #[serde(rename = "attemptId")]
        attempt_id: String,
        #[serde(rename = "callId")]
        call_id: String,
        dispatch: DispatchAllocation,
        #[serde(rename = "executionId")]
        execution_id: String,
        generation: i64,
        #[serde(rename = "inputDigest")]
        input_digest: String,
        #[serde(rename = "leaseExpiresAt")]
        lease_expires_at: String,
        #[serde(rename = "ownerId")]
        owner_id: String,
        snapshot: Value,
        #[serde(rename = "snapshotDigest")]
        snapshot_digest: String,
    },
    Authorize {
        #[serde(rename = "actionId")]
        action_id: String,
        #[serde(rename = "attemptId")]
        attempt_id: String,
        #[serde(rename = "authorizedAt")]
        authorized_at: String,
        #[serde(rename = "callId")]
        call_id: String,
        generation: i64,
        kind: DispatchKind,
        #[serde(rename = "requestDigest")]
        request_digest: String,
    },
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub(super) enum DispatchAllocation {
    Provider {
        #[serde(rename = "modelId")]
        model_id: String,
        #[serde(rename = "promptSnapshot")]
        prompt_snapshot: Value,
        #[serde(rename = "promptSnapshotDigest")]
        prompt_snapshot_digest: String,
        purpose: String,
        #[serde(rename = "requestDigest")]
        request_digest: String,
        #[serde(rename = "sourceRevision")]
        source_revision: i64,
    },
    Tool {
        #[serde(rename = "modelToolCallId")]
        model_tool_call_id: String,
        #[serde(rename = "requestDigest")]
        request_digest: String,
        #[serde(rename = "toolName")]
        tool_name: String,
        #[serde(rename = "toolVersion")]
        tool_version: String,
    },
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) enum DispatchKind {
    Provider,
    Tool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(super) struct SettleAttemptInput {
    action_id: String,
    attempt_id: String,
    call_id: String,
    completed_at: String,
    error_code: Option<String>,
    events: Vec<ProposedEvent>,
    generation: i64,
    kind: DispatchKind,
    output_digest: String,
    status: String,
    usage: Option<Value>,
    usage_state: Option<String>,
}

#[derive(Clone, Copy, PartialEq)]
pub(super) enum FaultPoint {
    None,
    AfterAllocation,
    AfterAuthorization,
    AfterSettlement,
    AfterSettlementEvents,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct DispatchResponse {
    action_id: String,
    attempt_id: String,
    call_id: String,
    disposition: &'static str,
    generation: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct SettlementResponse {
    action_id: String,
    attempt_id: String,
    call_id: String,
    disposition: &'static str,
    generation: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct ReconciliationResponse {
    attempts: Vec<ReconciledAttempt>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ReconciledAttempt {
    action_id: String,
    attempt_id: String,
    call_id: String,
    classification: &'static str,
    generation: i64,
    kind: &'static str,
}

struct ActionRow {
    action_type: String,
    execution_id: String,
    gate_class: String,
    input_digest: String,
    input_json: String,
    requested_capabilities_json: String,
    resource: String,
    status: String,
}

struct SnapshotAuthority {
    catalog_digest: String,
    granted_capabilities: Vec<String>,
}

struct ActiveAttempt {
    action_id: String,
    attempt_id: String,
    call_id: String,
    cancellation_requested: bool,
    dispatch_state: String,
    generation: i64,
    kind: DispatchKind,
}

pub(super) fn arm_dispatch(
    connection: &mut Connection,
    catalog_digest: &str,
    input: ArmDispatchInput,
    fault: FaultPoint,
) -> Result<DispatchResponse> {
    match input {
        ArmDispatchInput::Allocate {
            action_id,
            allocated_at,
            attempt_id,
            call_id,
            dispatch,
            execution_id,
            generation,
            input_digest,
            lease_expires_at,
            owner_id,
            snapshot,
            snapshot_digest,
        } => allocate(
            connection,
            catalog_digest,
            AllocationInput {
                action_id,
                allocated_at,
                attempt_id,
                call_id,
                dispatch,
                execution_id,
                generation,
                input_digest,
                lease_expires_at,
                owner_id,
                snapshot,
                snapshot_digest,
            },
            fault,
        ),
        ArmDispatchInput::Authorize {
            action_id,
            attempt_id,
            authorized_at,
            call_id,
            generation,
            kind,
            request_digest,
        } => authorize(
            connection,
            action_id,
            attempt_id,
            authorized_at,
            call_id,
            generation,
            kind,
            request_digest,
            fault,
        ),
    }
}

struct AllocationInput {
    action_id: String,
    allocated_at: String,
    attempt_id: String,
    call_id: String,
    dispatch: DispatchAllocation,
    execution_id: String,
    generation: i64,
    input_digest: String,
    lease_expires_at: String,
    owner_id: String,
    snapshot: Value,
    snapshot_digest: String,
}

fn allocate(
    connection: &mut Connection,
    catalog_digest: &str,
    input: AllocationInput,
    fault: FaultPoint,
) -> Result<DispatchResponse> {
    validate_allocation(&input)?;
    let snapshot_authority = snapshot_authority(&input.snapshot)?;
    if snapshot_authority.catalog_digest != catalog_digest
        || sha256(&canonical_json(&input.snapshot)?) != input.snapshot_digest
    {
        return Err(JournalError::RevisionFenced);
    }
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|_| JournalError::TransactionFailed)?;
    if let Some(response) = duplicate_allocation(&transaction, &input)? {
        return Ok(response);
    }
    let action = action_row(&transaction, &input.action_id)?;
    if action.status != "proposed"
        || action.input_digest != input.input_digest
        || action.execution_id != input.execution_id
    {
        return Ok(dispatch_response(&input, "denied"));
    }
    if !dispatch_matches_action(&input.dispatch, &action)? {
        return Ok(dispatch_response(&input, "denied"));
    }
    let requested = strings_from_json(&action.requested_capabilities_json)?;
    if requested
        .iter()
        .any(|value| !snapshot_authority.granted_capabilities.contains(value))
        || revoked(&transaction, &requested)?
        || !gate_allows(&transaction, &input, &action)?
    {
        return Ok(dispatch_response(&input, "denied"));
    }
    let execution: Option<(i64, i64, String)> = transaction
        .query_row(
            "SELECT cancellation_requested,generation,status FROM executions WHERE execution_id=?1",
            [&input.execution_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .optional()
        .map_err(|_| JournalError::TransactionFailed)?;
    let Some((cancellation_requested, current_generation, status)) = execution else {
        return Ok(dispatch_response(&input, "denied"));
    };
    if cancellation_requested == 1
        || current_generation + 1 != input.generation
        || !matches!(
            status.as_str(),
            "active" | "completed" | "failed" | "delivery-unknown"
        )
    {
        return Ok(dispatch_response(&input, "denied"));
    }
    if matches!(input.dispatch, DispatchAllocation::Tool { .. })
        && mutation_capabilities(&requested)
        && resource_collision(&transaction, &action.resource)?
    {
        return Ok(dispatch_response(&input, "resource-collision"));
    }
    fence_prior_attempts(&transaction, &input.execution_id, &input.allocated_at)?;
    transaction
        .execute(
            "UPDATE executions SET version=version+1,generation=?1,status='active',updated_at=?2 WHERE execution_id=?3",
            params![input.generation, input.allocated_at, input.execution_id],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    transaction
        .execute(
            "INSERT INTO attempts(attempt_id,action_id,execution_id,generation,owner_id,status,lease_expires_at,heartbeat_at,snapshot_digest,snapshot_json,catalog_digest,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,'running',?6,?7,?8,?9,?10,?7,?7)",
            params![input.attempt_id, input.action_id, input.execution_id, input.generation, input.owner_id, input.lease_expires_at, input.allocated_at, input.snapshot_digest, canonical_json(&input.snapshot)?, catalog_digest],
        )
        .map_err(|_| JournalError::IdentityConflict)?;
    transaction
        .execute(
            "UPDATE actions SET status='running',updated_at=?1 WHERE action_id=?2 AND status='proposed'",
            params![input.allocated_at, input.action_id],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    insert_call(&transaction, catalog_digest, &input)?;
    if matches!(input.dispatch, DispatchAllocation::Tool { .. })
        && mutation_capabilities(&requested)
    {
        insert_lease(&transaction, &input, &action.resource)?;
    }
    inject(fault, FaultPoint::AfterAllocation)?;
    transaction
        .commit()
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(dispatch_response(&input, "armed"))
}

#[allow(clippy::too_many_arguments)]
fn authorize(
    connection: &mut Connection,
    action_id: String,
    attempt_id: String,
    authorized_at: String,
    call_id: String,
    generation: i64,
    kind: DispatchKind,
    request_digest: String,
    fault: FaultPoint,
) -> Result<DispatchResponse> {
    type AuthorizationRow = (
        String,
        String,
        String,
        String,
        String,
        i64,
        i64,
        String,
        String,
    );
    if !valid_identity_fields(&action_id, &attempt_id, &call_id, generation)
        || !bounded(&authorized_at, 128)
        || !is_digest(&request_digest)
    {
        return Err(JournalError::RequestInvalid);
    }
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|_| JournalError::TransactionFailed)?;
    let table = call_table(kind);
    let query = format!(
        "SELECT actions.status,actions.requested_capabilities_json,attempts.status,attempts.snapshot_json,attempts.lease_expires_at,executions.cancellation_requested,executions.generation,{table}.dispatch_state,{table}.request_digest FROM {table} JOIN attempts ON attempts.attempt_id={table}.attempt_id JOIN actions ON actions.action_id={table}.action_id JOIN executions ON executions.execution_id=attempts.execution_id WHERE {table}.call_id=?1 AND attempts.attempt_id=?2 AND actions.action_id=?3"
    );
    let row: Option<AuthorizationRow> = transaction
        .query_row(&query, params![call_id, attempt_id, action_id], |row| {
            Ok((
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                row.get(3)?,
                row.get(4)?,
                row.get(5)?,
                row.get(6)?,
                row.get(7)?,
                row.get(8)?,
            ))
        })
        .optional()
        .map_err(|_| JournalError::TransactionFailed)?;
    let disposition = if let Some((
        action_status,
        requested_json,
        attempt_status,
        snapshot_json,
        lease_expires_at,
        cancellation_requested,
        current_generation,
        dispatch_state,
        stored_digest,
    )) = row
    {
        let requested = strings_from_json(&requested_json)?;
        let authority = snapshot_authority(&parse_json(&snapshot_json)?)?;
        if action_status == "running"
            && attempt_status == "running"
            && cancellation_requested == 0
            && current_generation == generation
            && dispatch_state == "armed"
            && stored_digest == request_digest
            && lease_expires_at > authorized_at
            && !revoked(&transaction, &requested)?
            && requested
                .iter()
                .all(|value| authority.granted_capabilities.contains(value))
        {
            let updated = transaction
                .execute(
                    &format!("UPDATE {table} SET dispatch_state='dispatched',dispatched_at=?1,delivery_certainty='UNKNOWN' WHERE call_id=?2 AND dispatch_state='armed'"),
                    params![authorized_at, call_id],
                )
                .map_err(|_| JournalError::TransactionFailed)?;
            if updated == 1 { "authorized" } else { "denied" }
        } else if dispatch_state == "dispatched" && stored_digest == request_digest {
            "duplicate"
        } else {
            "denied"
        }
    } else {
        "denied"
    };
    if disposition == "authorized" {
        inject(fault, FaultPoint::AfterAuthorization)?;
    }
    transaction
        .commit()
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(DispatchResponse {
        action_id,
        attempt_id,
        call_id,
        disposition,
        generation,
    })
}

pub(super) fn settle_attempt(
    connection: &mut Connection,
    catalog_digest: &str,
    input: SettleAttemptInput,
    fault: FaultPoint,
) -> Result<SettlementResponse> {
    validate_settlement(&input)?;
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|_| JournalError::TransactionFailed)?;
    if let Some(disposition) = terminal_duplicate(&transaction, &input)? {
        if disposition == "stale" {
            quarantine(&transaction, &input, "STALE_OR_CANCELLED_GENERATION")?;
            transaction
                .commit()
                .map_err(|_| JournalError::TransactionFailed)?;
        }
        return Ok(settlement_response(&input, disposition));
    }
    let table = call_table(input.kind);
    let query = format!(
        "SELECT attempts.status,attempts.lease_expires_at,executions.cancellation_requested,executions.generation,attempts.execution_id FROM {table} JOIN attempts ON attempts.attempt_id={table}.attempt_id JOIN executions ON executions.execution_id=attempts.execution_id WHERE {table}.call_id=?1 AND attempts.attempt_id=?2 AND {table}.action_id=?3"
    );
    let row: Option<(String, String, i64, i64, String)> = transaction
        .query_row(
            &query,
            params![input.call_id, input.attempt_id, input.action_id],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                ))
            },
        )
        .optional()
        .map_err(|_| JournalError::TransactionFailed)?;
    let Some((attempt_status, lease_expires_at, cancelled, current_generation, execution_id)) = row
    else {
        quarantine(&transaction, &input, "UNKNOWN_ATTEMPT")?;
        transaction
            .commit()
            .map_err(|_| JournalError::TransactionFailed)?;
        return Ok(settlement_response(&input, "stale"));
    };
    if attempt_status != "running"
        || current_generation != input.generation
        || cancelled == 1
        || lease_expires_at <= input.completed_at
    {
        quarantine(&transaction, &input, "STALE_OR_CANCELLED_GENERATION")?;
        transaction
            .commit()
            .map_err(|_| JournalError::TransactionFailed)?;
        return Ok(settlement_response(&input, "stale"));
    }
    apply_settlement(&transaction, &input, &execution_id)?;
    inject(fault, FaultPoint::AfterSettlement)?;
    append_settlement_events(&transaction, catalog_digest, &input, &execution_id)?;
    inject(fault, FaultPoint::AfterSettlementEvents)?;
    transaction
        .commit()
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(settlement_response(&input, "committed"))
}

pub(super) fn reconcile_interrupted(
    connection: &mut Connection,
    reconciled_at: &str,
) -> Result<ReconciliationResponse> {
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|_| JournalError::TransactionFailed)?;
    let mut attempts = active_attempts(&transaction, DispatchKind::Provider)?;
    attempts.extend(active_attempts(&transaction, DispatchKind::Tool)?);
    attempts.sort_by(|left, right| {
        left.action_id
            .cmp(&right.action_id)
            .then(left.generation.cmp(&right.generation))
    });
    let mut result = Vec::with_capacity(attempts.len());
    for attempt in attempts {
        let classification = if attempt.cancellation_requested {
            reconcile_cancelled(&transaction, &attempt, reconciled_at)?;
            "cancelled"
        } else if attempt.dispatch_state == "armed" {
            reconcile_not_dispatched(&transaction, &attempt, reconciled_at)?;
            "not-dispatched"
        } else {
            reconcile_unknown(&transaction, &attempt, reconciled_at)?;
            "delivery-unknown"
        };
        result.push(ReconciledAttempt {
            action_id: attempt.action_id,
            attempt_id: attempt.attempt_id,
            call_id: attempt.call_id,
            classification,
            generation: attempt.generation,
            kind: match attempt.kind {
                DispatchKind::Provider => "provider",
                DispatchKind::Tool => "tool",
            },
        });
    }
    transaction
        .commit()
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(ReconciliationResponse { attempts: result })
}

fn validate_allocation(input: &AllocationInput) -> Result<()> {
    if !valid_identity_fields(
        &input.action_id,
        &input.attempt_id,
        &input.call_id,
        input.generation,
    ) || !bounded(&input.execution_id, 512)
        || !bounded(&input.allocated_at, 128)
        || !bounded(&input.lease_expires_at, 128)
        || !bounded(&input.owner_id, 512)
        || !is_digest(&input.input_digest)
        || !is_digest(&input.snapshot_digest)
        || canonical_json(&input.snapshot)?.len() > MAX_EVENT_BODY_BYTES
    {
        return Err(JournalError::RequestInvalid);
    }
    match &input.dispatch {
        DispatchAllocation::Provider {
            model_id,
            prompt_snapshot,
            prompt_snapshot_digest,
            purpose,
            request_digest,
            source_revision,
        } => {
            if !bounded(model_id, 512)
                || !is_digest(prompt_snapshot_digest)
                || sha256(&canonical_json(prompt_snapshot)?) != *prompt_snapshot_digest
                || !bounded(purpose, 128)
                || !is_digest(request_digest)
                || *source_revision < 0
            {
                return Err(JournalError::RequestInvalid);
            }
        }
        DispatchAllocation::Tool {
            model_tool_call_id,
            request_digest,
            tool_name,
            tool_version,
        } => {
            if !bounded(model_tool_call_id, 512)
                || !is_digest(request_digest)
                || !bounded(tool_name, 512)
                || !bounded(tool_version, 128)
            {
                return Err(JournalError::RequestInvalid);
            }
        }
    }
    Ok(())
}

fn validate_settlement(input: &SettleAttemptInput) -> Result<()> {
    if !valid_identity_fields(
        &input.action_id,
        &input.attempt_id,
        &input.call_id,
        input.generation,
    ) || !bounded(&input.completed_at, 128)
        || !is_digest(&input.output_digest)
        || !matches!(
            input.status.as_str(),
            "cancelled" | "delivery-unknown" | "failed" | "succeeded"
        )
        || input.events.is_empty()
        || input.events.len() > MAX_SETTLEMENT_EVENTS
        || input
            .error_code
            .as_ref()
            .is_some_and(|value| !bounded(value, 512))
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
    match input.kind {
        DispatchKind::Provider => {
            if input.usage.is_none()
                || !matches!(
                    input.usage_state.as_deref(),
                    Some("ESTIMATED" | "REPORTED" | "UNKNOWN")
                )
            {
                return Err(JournalError::RequestInvalid);
            }
        }
        DispatchKind::Tool => {
            if input.usage.is_some() || input.usage_state.is_some() {
                return Err(JournalError::RequestInvalid);
            }
        }
    }
    Ok(())
}

fn valid_identity_fields(
    action_id: &str,
    attempt_id: &str,
    call_id: &str,
    generation: i64,
) -> bool {
    bounded(action_id, 512) && bounded(attempt_id, 512) && bounded(call_id, 512) && generation > 0
}

fn snapshot_authority(snapshot: &Value) -> Result<SnapshotAuthority> {
    let value = snapshot.as_object().ok_or(JournalError::RequestInvalid)?;
    let catalog_digest = value
        .get("catalogDigest")
        .and_then(Value::as_str)
        .filter(|value| is_digest(value))
        .ok_or(JournalError::RequestInvalid)?
        .to_owned();
    let granted_capabilities = value
        .get("grantedCapabilities")
        .and_then(Value::as_array)
        .ok_or(JournalError::RequestInvalid)?
        .iter()
        .map(|value| value.as_str().map(ToOwned::to_owned))
        .collect::<Option<Vec<_>>>()
        .ok_or(JournalError::RequestInvalid)?;
    if granted_capabilities.len() > 64
        || granted_capabilities
            .iter()
            .any(|value| !bounded(value, 512))
    {
        return Err(JournalError::RequestInvalid);
    }
    Ok(SnapshotAuthority {
        catalog_digest,
        granted_capabilities,
    })
}

fn action_row(connection: &Connection, action_id: &str) -> Result<ActionRow> {
    connection
        .query_row(
            "SELECT action_type,execution_id,gate_class,input_digest,input_json,requested_capabilities_json,resource,status FROM actions WHERE action_id=?1",
            [action_id],
            |row| {
                Ok(ActionRow {
                    action_type: row.get(0)?,
                    execution_id: row.get(1)?,
                    gate_class: row.get(2)?,
                    input_digest: row.get(3)?,
                    input_json: row.get(4)?,
                    requested_capabilities_json: row.get(5)?,
                    resource: row.get(6)?,
                    status: row.get(7)?,
                })
            },
        )
        .map_err(|_| JournalError::RecordNotFound)
}

fn dispatch_matches_action(dispatch: &DispatchAllocation, action: &ActionRow) -> Result<bool> {
    match dispatch {
        DispatchAllocation::Provider {
            model_id,
            prompt_snapshot,
            prompt_snapshot_digest,
            purpose,
            request_digest,
            source_revision,
        } => {
            let input = parse_json(&action.input_json)?;
            let Some(input) = input.as_object() else {
                return Ok(false);
            };
            let Some(request) = input.get("request") else {
                return Ok(false);
            };
            let route = request.get("route").and_then(Value::as_object);
            let requested = strings_from_json(&action.requested_capabilities_json)?;
            Ok(action.action_type == "provider.generate"
                && requested.len() == 1
                && requested[0] == "provider.generate"
                && input.get("schemaVersion").and_then(Value::as_i64) == Some(1)
                && input.get("requestDigest").and_then(Value::as_str)
                    == Some(request_digest.as_str())
                && request_digest == prompt_snapshot_digest
                && sha256(&canonical_json(request)?) == *request_digest
                && canonical_json(request)? == canonical_json(prompt_snapshot)?
                && route
                    .and_then(|value| value.get("modelId"))
                    .and_then(Value::as_str)
                    == Some(model_id.as_str())
                && route
                    .and_then(|value| value.get("purpose"))
                    .and_then(Value::as_str)
                    == Some(purpose.as_str())
                && purpose == "agent.step"
                && request.get("observedRunRevision").and_then(Value::as_i64)
                    == Some(*source_revision))
        }
        DispatchAllocation::Tool {
            request_digest,
            tool_name,
            tool_version,
            ..
        } => {
            let request = json!({
                "input": parse_json(&action.input_json)?,
                "toolId": tool_name,
                "toolVersion": tool_version,
            });
            Ok(action.action_type == *tool_name
                && sha256(&canonical_json(&request)?) == *request_digest)
        }
    }
}

fn duplicate_allocation(
    connection: &Connection,
    input: &AllocationInput,
) -> Result<Option<DispatchResponse>> {
    let existing: Option<(String, String, i64, String)> = connection
        .query_row(
            "SELECT action_id,execution_id,generation,snapshot_digest FROM attempts WHERE attempt_id=?1",
            [&input.attempt_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .optional()
        .map_err(|_| JournalError::TransactionFailed)?;
    let Some((action_id, execution_id, generation, snapshot_digest)) = existing else {
        return Ok(None);
    };
    if action_id == input.action_id
        && execution_id == input.execution_id
        && generation == input.generation
        && snapshot_digest == input.snapshot_digest
    {
        return Ok(Some(dispatch_response(input, "duplicate")));
    }
    Err(JournalError::IdentityConflict)
}

fn dispatch_response(input: &AllocationInput, disposition: &'static str) -> DispatchResponse {
    DispatchResponse {
        action_id: input.action_id.clone(),
        attempt_id: input.attempt_id.clone(),
        call_id: input.call_id.clone(),
        disposition,
        generation: input.generation,
    }
}

fn gate_allows(
    connection: &Connection,
    input: &AllocationInput,
    action: &ActionRow,
) -> Result<bool> {
    if action.gate_class == "none-requested" {
        return Ok(true);
    }
    let gate: Option<(String, String, String)> = connection
        .query_row(
            "SELECT expires_at,payload_digest,status FROM gates WHERE action_id=?1 ORDER BY created_at DESC LIMIT 1",
            [&input.action_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .optional()
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(gate.is_some_and(|(expires_at, digest, status)| {
        status == "approved" && digest == input.input_digest && expires_at > input.allocated_at
    }))
}

fn revoked(connection: &Connection, requested: &[String]) -> Result<bool> {
    let mut statement = connection
        .prepare("SELECT capability FROM capability_revocations")
        .map_err(|_| JournalError::TransactionFailed)?;
    let revoked = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|_| JournalError::TransactionFailed)?
        .collect::<std::result::Result<std::collections::HashSet<_>, _>>()
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(requested.iter().any(|value| revoked.contains(value)))
}

fn strings_from_json(value: &str) -> Result<Vec<String>> {
    serde_json::from_str(value).map_err(|_| JournalError::IntegrityInvalid)
}

fn mutation_capabilities(values: &[String]) -> bool {
    values
        .iter()
        .any(|value| matches!(value.as_str(), "filesystem.mutation" | "git.mutation"))
}

fn resource_collision(connection: &Connection, resource: &str) -> Result<bool> {
    let mut statement = connection
        .prepare("SELECT resource FROM resource_leases WHERE status IN ('active','fenced')")
        .map_err(|_| JournalError::TransactionFailed)?;
    let resources = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|_| JournalError::TransactionFailed)?;
    for candidate in resources {
        let candidate = candidate.map_err(|_| JournalError::TransactionFailed)?;
        if resource == candidate
            || resource.starts_with(&format!("{candidate}/"))
            || candidate.starts_with(&format!("{resource}/"))
        {
            return Ok(true);
        }
    }
    Ok(false)
}

fn fence_prior_attempts(connection: &Connection, execution_id: &str, at: &str) -> Result<()> {
    for query in [
        "UPDATE provider_calls SET status=CASE dispatch_state WHEN 'dispatched' THEN 'delivery-unknown' ELSE 'failed' END,completed_at=?1,error_code='ATTEMPT_FENCED',usage_state='UNKNOWN',delivery_certainty=CASE dispatch_state WHEN 'dispatched' THEN 'UNKNOWN' ELSE 'NOT_DELIVERED' END WHERE attempt_id IN (SELECT attempt_id FROM attempts WHERE execution_id=?2 AND status='running') AND status='allocated'",
        "UPDATE tool_calls SET status=CASE dispatch_state WHEN 'dispatched' THEN 'delivery-unknown' ELSE 'failed' END,completed_at=?1,error_code='ATTEMPT_FENCED',delivery_certainty=CASE dispatch_state WHEN 'dispatched' THEN 'UNKNOWN' ELSE 'NOT_DELIVERED' END WHERE attempt_id IN (SELECT attempt_id FROM attempts WHERE execution_id=?2 AND status='running') AND status='allocated'",
        "UPDATE actions SET status='delivery-unknown',updated_at=?1,error_code='ATTEMPT_FENCED' WHERE action_id IN (SELECT action_id FROM attempts WHERE execution_id=?2 AND status='running')",
        "UPDATE attempts SET status='delivery-unknown',updated_at=?1 WHERE execution_id=?2 AND status='running'",
    ] {
        connection
            .execute(query, params![at, execution_id])
            .map_err(|_| JournalError::TransactionFailed)?;
    }
    Ok(())
}

fn insert_call(
    connection: &Connection,
    catalog_digest: &str,
    input: &AllocationInput,
) -> Result<()> {
    match &input.dispatch {
        DispatchAllocation::Provider {
            model_id,
            prompt_snapshot,
            prompt_snapshot_digest,
            purpose,
            request_digest,
            source_revision,
        } => connection
            .execute(
                "INSERT INTO provider_calls(call_id,action_id,attempt_id,generation,purpose,model_id,request_digest,catalog_digest,prompt_snapshot_digest,prompt_snapshot_json,source_revision,dispatch_state,usage_state,delivery_certainty,status,allocated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,'armed','UNKNOWN','NOT_DISPATCHED','allocated',?12)",
                params![input.call_id, input.action_id, input.attempt_id, input.generation, purpose, model_id, request_digest, catalog_digest, prompt_snapshot_digest, canonical_json(prompt_snapshot)?, source_revision, input.allocated_at],
            ),
        DispatchAllocation::Tool {
            model_tool_call_id,
            request_digest,
            tool_name,
            tool_version,
        } => connection
            .execute(
                "INSERT INTO tool_calls(call_id,action_id,attempt_id,generation,tool_name,tool_version,model_tool_call_id,request_digest,catalog_digest,dispatch_state,delivery_certainty,status,allocated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,'armed','NOT_DISPATCHED','allocated',?10)",
                params![input.call_id, input.action_id, input.attempt_id, input.generation, tool_name, tool_version, model_tool_call_id, request_digest, catalog_digest, input.allocated_at],
            ),
    }
    .map_err(|_| JournalError::IdentityConflict)?;
    Ok(())
}

fn insert_lease(connection: &Connection, input: &AllocationInput, resource: &str) -> Result<()> {
    let lease_id = sha256(&canonical_json(&json!({
        "attemptId": input.attempt_id,
        "generation": input.generation,
        "resource": resource,
    }))?);
    connection
        .execute(
            "INSERT INTO resource_leases(lease_id,resource,attempt_id,action_id,execution_id,generation,mode,status,acquired_at,expires_at,released_at) VALUES (?1,?2,?3,?4,?5,?6,'exclusive','active',?7,?8,NULL)",
            params![lease_id, resource, input.attempt_id, input.action_id, input.execution_id, input.generation, input.allocated_at, input.lease_expires_at],
        )
        .map_err(|_| JournalError::IdentityConflict)?;
    Ok(())
}

fn call_table(kind: DispatchKind) -> &'static str {
    match kind {
        DispatchKind::Provider => "provider_calls",
        DispatchKind::Tool => "tool_calls",
    }
}

fn terminal_duplicate(
    connection: &Connection,
    input: &SettleAttemptInput,
) -> Result<Option<&'static str>> {
    let table = call_table(input.kind);
    let query = format!(
        "SELECT status,output_digest,error_code FROM {table} WHERE call_id=?1 AND action_id=?2"
    );
    let row: Option<(String, Option<String>, Option<String>)> = connection
        .query_row(&query, params![input.call_id, input.action_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
        .optional()
        .map_err(|_| JournalError::TransactionFailed)?;
    let Some((status, digest, error_code)) = row else {
        return Ok(None);
    };
    if status == "allocated" {
        return Ok(None);
    }
    let expected_status = if input.status == "cancelled" {
        "failed"
    } else {
        &input.status
    };
    if status == expected_status && digest.as_deref() == Some(input.output_digest.as_str()) {
        return Ok(Some("duplicate"));
    }
    if error_code.as_deref() == Some("ACTION_CANCELLED") {
        return Ok(Some("stale"));
    }
    Err(JournalError::IdentityConflict)
}

fn quarantine(connection: &Connection, input: &SettleAttemptInput, reason: &str) -> Result<()> {
    let body = json!({
        "actionId": input.action_id,
        "attemptId": input.attempt_id,
        "callId": input.call_id,
        "completedAt": input.completed_at,
        "generation": input.generation,
        "outputDigest": input.output_digest,
        "status": input.status,
    });
    connection
        .execute(
            "INSERT OR IGNORE INTO quarantined_receipts(receipt_id,action_id,attempt_id,call_id,generation,reason,body_json,received_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
            params![sha256(&canonical_json(&body)?), input.action_id, input.attempt_id, input.call_id, input.generation, reason, canonical_json(&body)?, input.completed_at],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(())
}

fn apply_settlement(
    connection: &Connection,
    input: &SettleAttemptInput,
    execution_id: &str,
) -> Result<()> {
    let attempt_status = if input.status == "cancelled" {
        "cancelled"
    } else {
        &input.status
    };
    let action_status = if input.status == "cancelled" {
        "failed"
    } else {
        &input.status
    };
    let execution_status = match input.status.as_str() {
        "succeeded" => "completed",
        "delivery-unknown" => "delivery-unknown",
        "cancelled" => "cancelled",
        _ => "failed",
    };
    let certainty = match input.status.as_str() {
        "delivery-unknown" => "UNKNOWN",
        "succeeded" => "DELIVERED",
        _ => "NOT_DELIVERED",
    };
    match input.kind {
        DispatchKind::Provider => {
            connection.execute(
                "UPDATE provider_calls SET status=?1,completed_at=?2,output_digest=?3,error_code=?4,usage_state=?5,usage_json=?6,delivery_certainty=?7 WHERE call_id=?8",
                params![action_status, input.completed_at, input.output_digest, input.error_code, input.usage_state, canonical_json(input.usage.as_ref().ok_or(JournalError::RequestInvalid)?)?, certainty, input.call_id],
            )
        }
        DispatchKind::Tool => connection.execute(
            "UPDATE tool_calls SET status=?1,completed_at=?2,output_digest=?3,error_code=?4,delivery_certainty=?5 WHERE call_id=?6",
            params![action_status, input.completed_at, input.output_digest, input.error_code, certainty, input.call_id],
        ),
    }
    .map_err(|_| JournalError::TransactionFailed)?;
    connection
        .execute(
            "UPDATE attempts SET status=?1,updated_at=?2 WHERE attempt_id=?3 AND generation=?4",
            params![
                attempt_status,
                input.completed_at,
                input.attempt_id,
                input.generation
            ],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    connection
        .execute(
            "UPDATE resource_leases SET status=?1,released_at=?2 WHERE attempt_id=?3 AND generation=?4 AND status='active'",
            params![match input.status.as_str() { "delivery-unknown" => "fenced", "cancelled" => "cancelled", _ => "released" }, if input.status == "delivery-unknown" { None::<&str> } else { Some(input.completed_at.as_str()) }, input.attempt_id, input.generation],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    connection
        .execute(
            "UPDATE actions SET status=?1,updated_at=?2,output_digest=?3,error_code=?4 WHERE action_id=?5",
            params![action_status, input.completed_at, input.output_digest, input.error_code, input.action_id],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    connection
        .execute(
            "UPDATE executions SET status=?1,version=version+1,updated_at=?2 WHERE execution_id=?3 AND generation=?4 AND NOT EXISTS (SELECT 1 FROM workflow_instances WHERE workflow_instances.execution_id=executions.execution_id)",
            params![execution_status, input.completed_at, execution_id, input.generation],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(())
}

fn append_settlement_events(
    connection: &Connection,
    catalog_digest: &str,
    input: &SettleAttemptInput,
    execution_id: &str,
) -> Result<()> {
    let source = source_for_execution(connection, execution_id)?;
    let reactor_id: String = connection
        .query_row(
            "SELECT reactor_id FROM actions WHERE action_id=?1",
            [&input.action_id],
            |row| row.get(0),
        )
        .map_err(|_| JournalError::RecordNotFound)?;
    let events = input
        .events
        .iter()
        .map(|event| KernelEvent {
            body: event.body.clone(),
            context: event_context(&source, execution_id, &reactor_id, "1", execution_id),
            event_type: event.event_type.clone(),
            stream_id: event.stream_id.clone(),
        })
        .collect();
    append_kernel_events(
        connection,
        catalog_digest,
        ATTEMPT_PLUGIN,
        &input.completed_at,
        &format!("{}:{}", input.call_id, input.status),
        &input.output_digest,
        &reactor_id,
        "1",
        events,
    )
}

fn source_for_execution(connection: &Connection, execution_id: &str) -> Result<SourceContext> {
    connection
        .query_row(
            "SELECT event_id,correlation_id,root_execution_id,parent_execution_id FROM events WHERE child_execution_id=?1 ORDER BY global_sequence DESC LIMIT 1",
            [execution_id],
            |row| {
                Ok(SourceContext {
                    event_id: row.get(0)?,
                    correlation_id: row.get(1)?,
                    root_execution_id: row.get(2)?,
                    parent_execution_id: row.get(3)?,
                })
            },
        )
        .map_err(|_| JournalError::RecordNotFound)
}

fn settlement_response(
    input: &SettleAttemptInput,
    disposition: &'static str,
) -> SettlementResponse {
    SettlementResponse {
        action_id: input.action_id.clone(),
        attempt_id: input.attempt_id.clone(),
        call_id: input.call_id.clone(),
        disposition,
        generation: input.generation,
    }
}

fn active_attempts(connection: &Connection, kind: DispatchKind) -> Result<Vec<ActiveAttempt>> {
    let table = call_table(kind);
    let query = format!(
        "SELECT actions.action_id,attempts.attempt_id,{table}.call_id,executions.cancellation_requested,{table}.dispatch_state,attempts.generation FROM actions JOIN attempts ON attempts.action_id=actions.action_id JOIN {table} ON {table}.attempt_id=attempts.attempt_id JOIN executions ON executions.execution_id=attempts.execution_id WHERE actions.status='running' AND attempts.status='running' AND {table}.status='allocated'"
    );
    let mut statement = connection
        .prepare(&query)
        .map_err(|_| JournalError::TransactionFailed)?;
    let rows = statement
        .query_map([], |row| {
            Ok(ActiveAttempt {
                action_id: row.get(0)?,
                attempt_id: row.get(1)?,
                call_id: row.get(2)?,
                cancellation_requested: row.get::<_, i64>(3)? == 1,
                dispatch_state: row.get(4)?,
                generation: row.get(5)?,
                kind,
            })
        })
        .map_err(|_| JournalError::TransactionFailed)?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|_| JournalError::TransactionFailed)
}

fn reconcile_not_dispatched(
    connection: &Connection,
    attempt: &ActiveAttempt,
    at: &str,
) -> Result<()> {
    update_call(
        connection,
        attempt,
        "failed",
        "NOT_DELIVERED",
        "INTERRUPTED_NOT_DISPATCHED",
        at,
    )?;
    connection
        .execute(
            "UPDATE attempts SET status='failed',updated_at=?1 WHERE attempt_id=?2",
            params![at, attempt.attempt_id],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    connection
        .execute(
            "UPDATE actions SET status='proposed',updated_at=?1,error_code=NULL WHERE action_id=?2",
            params![at, attempt.action_id],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    release_lease(connection, attempt, "released", at)
}

fn reconcile_cancelled(connection: &Connection, attempt: &ActiveAttempt, at: &str) -> Result<()> {
    let dispatched = attempt.dispatch_state == "dispatched";
    update_call(
        connection,
        attempt,
        if dispatched {
            "delivery-unknown"
        } else {
            "failed"
        },
        if dispatched {
            "UNKNOWN"
        } else {
            "NOT_DELIVERED"
        },
        "ACTION_CANCELLED",
        at,
    )?;
    connection
        .execute(
            "UPDATE attempts SET status='cancelled',updated_at=?1 WHERE attempt_id=?2",
            params![at, attempt.attempt_id],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    connection
        .execute(
            "UPDATE actions SET status=?1,updated_at=?2,error_code='ACTION_CANCELLED' WHERE action_id=?3",
            params![if dispatched { "delivery-unknown" } else { "failed" }, at, attempt.action_id],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    release_lease(
        connection,
        attempt,
        if dispatched { "fenced" } else { "cancelled" },
        at,
    )
}

fn reconcile_unknown(connection: &Connection, attempt: &ActiveAttempt, at: &str) -> Result<()> {
    update_call(
        connection,
        attempt,
        "delivery-unknown",
        "UNKNOWN",
        "INTERRUPTED_DELIVERY_UNKNOWN",
        at,
    )?;
    connection
        .execute(
            "UPDATE attempts SET status='delivery-unknown',updated_at=?1 WHERE attempt_id=?2",
            params![at, attempt.attempt_id],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    connection
        .execute(
            "UPDATE actions SET status='delivery-unknown',updated_at=?1,error_code='INTERRUPTED_DELIVERY_UNKNOWN' WHERE action_id=?2",
            params![at, attempt.action_id],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    release_lease(connection, attempt, "fenced", at)
}

fn update_call(
    connection: &Connection,
    attempt: &ActiveAttempt,
    status: &str,
    certainty: &str,
    error: &str,
    at: &str,
) -> Result<()> {
    let table = call_table(attempt.kind);
    let usage = if matches!(attempt.kind, DispatchKind::Provider) {
        ",usage_state='UNKNOWN'"
    } else {
        ""
    };
    connection
        .execute(
            &format!("UPDATE {table} SET status=?1,completed_at=?2,error_code=?3,delivery_certainty=?4{usage} WHERE call_id=?5"),
            params![status, at, error, certainty, attempt.call_id],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(())
}

fn release_lease(
    connection: &Connection,
    attempt: &ActiveAttempt,
    status: &str,
    at: &str,
) -> Result<()> {
    connection
        .execute(
            "UPDATE resource_leases SET status=?1,released_at=CASE WHEN ?1='fenced' THEN NULL ELSE ?2 END WHERE attempt_id=?3 AND generation=?4 AND status='active'",
            params![status, at, attempt.attempt_id, attempt.generation],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(())
}

fn parse_json(value: &str) -> Result<Value> {
    serde_json::from_str(value).map_err(|_| JournalError::IntegrityInvalid)
}

fn inject(actual: FaultPoint, expected: FaultPoint) -> Result<()> {
    if actual == expected {
        return Err(JournalError::TransactionFailed);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn provider_prompt() -> Value {
        json!({
            "observedRunRevision": 0,
            "route": {
                "modelId": "apple:system-language-model",
                "purpose": "agent.step"
            }
        })
    }

    fn provider_action_input() -> Value {
        let request = provider_prompt();
        json!({
            "requestDigest": sha256(&canonical_json(&request).unwrap()),
            "request": request,
            "schemaVersion": 1,
        })
    }

    fn setup(name: &str, action_id: &str) -> (String, Connection, String) {
        let root = std::env::temp_dir().join(format!(
            "curiosity-attempt-journal-{}-{}-{}",
            std::process::id(),
            name,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&root).unwrap();
        let path = root.join("journal.sqlite3").to_string_lossy().into_owned();
        let catalog = "0".repeat(64);
        let connection = open_database(&path).unwrap();
        initialize(&connection, &catalog).unwrap();
        drop(connection);
        let mut connection = open_ready_database(&path, &catalog).unwrap();
        let action_input = provider_action_input();
        let input_digest = sha256(&canonical_json(&action_input).unwrap());
        admit(
            &mut connection,
            &catalog,
            Admission {
                accepted_at: "2026-08-29T12:00:00.000Z".into(),
                actor_id: "curiosity-kernel".into(),
                command_digest: "1".repeat(64),
                command_id: format!("propose-{action_id}"),
                contribution_id: "workflow-generalist".into(),
                contribution_version: "1".into(),
                events: vec![ProposedEvent {
                    body: json!({
                        "actionId": action_id,
                        "executionId": format!("execution-{action_id}"),
                        "schemaVersion": 1,
                    }),
                    stream_id: action_id.into(),
                    event_type: "action.proposed".into(),
                }],
                plugin_id: "workflow-plugin".into(),
            },
        )
        .unwrap();
        connection
            .execute(
                "INSERT INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?1,0,0,'active',0,?2)",
                params![format!("execution-{action_id}"), "2026-08-29T12:00:00.000Z"],
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO actions(action_id,source_event_id,reactor_id,plugin_id,action_type,action_schema_version,execution_id,resource,gate_class,deadline_class,input_json,input_digest,requested_capabilities_json,status,created_at,updated_at) VALUES (?1,'source','workflow-generalist','workflow-plugin','provider.generate',1,?2,?3,'none-requested','interactive',?4,?5,'[\"provider.generate\"]','proposed',?6,?6)",
                params![action_id, format!("execution-{action_id}"), format!("model:{action_id}"), canonical_json(&action_input).unwrap(), input_digest, "2026-08-29T12:00:00.000Z"],
            )
            .unwrap();
        (catalog, connection, input_digest)
    }

    fn provider_allocate(action_id: &str, input_digest: &str, catalog: &str) -> ArmDispatchInput {
        let snapshot = json!({
            "catalogDigest": catalog,
            "grantedCapabilities": ["provider.generate"],
            "routeId": "on-device.apple",
        });
        let prompt = provider_prompt();
        let request_digest = sha256(&canonical_json(&prompt).unwrap());
        ArmDispatchInput::Allocate {
            action_id: action_id.into(),
            allocated_at: "2026-08-29T12:00:01.000Z".into(),
            attempt_id: format!("attempt-{action_id}"),
            call_id: format!("call-{action_id}"),
            dispatch: DispatchAllocation::Provider {
                model_id: "apple:system-language-model".into(),
                prompt_snapshot_digest: sha256(&canonical_json(&prompt).unwrap()),
                prompt_snapshot: prompt,
                purpose: "agent.step".into(),
                request_digest,
                source_revision: 0,
            },
            execution_id: format!("execution-{action_id}"),
            generation: 1,
            input_digest: input_digest.into(),
            lease_expires_at: "2026-08-29T12:10:00.000Z".into(),
            owner_id: "ipad-owner".into(),
            snapshot_digest: sha256(&canonical_json(&snapshot).unwrap()),
            snapshot,
        }
    }

    fn insert_waiting_provider_run(connection: &Connection, action_id: &str) {
        let source_event_id: String = connection
            .query_row(
                "SELECT event_id FROM events WHERE stream_id=?1 ORDER BY global_sequence LIMIT 1",
                [action_id],
                |row| row.get(0),
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) VALUES (?1,?1,0)",
                [format!("execution-{action_id}")],
            )
            .unwrap();
        let state = json!({
            "phase": "waiting-provider",
            "providerActionId": action_id,
            "providerStepId": "2".repeat(64),
            "schemaVersion": 1,
        });
        connection
            .execute(
                "INSERT INTO workflow_instances(instance_id,source_event_id,workflow_name,contribution_id,contribution_version,plugin_id,execution_id,parent_instance_id,child_key,depth,status,input_json,state_json,capability_ceiling_json,step_count,no_progress_count,action_count,child_count,max_steps,max_no_progress,max_actions,max_children,max_delegation_depth,created_at,updated_at) VALUES (?1,?2,'generalist','workflow-generalist','1','workflow-plugin',?3,NULL,NULL,0,'running','{}',?4,'[\"provider.generate\"]',1,0,0,0,8,2,4,0,0,?5,?5)",
                params![format!("run-{action_id}"), source_event_id, format!("execution-{action_id}"), canonical_json(&state).unwrap(), "2026-08-29T12:00:00.000Z"],
            )
            .unwrap();
    }

    fn authorize(action_id: &str) -> ArmDispatchInput {
        ArmDispatchInput::Authorize {
            action_id: action_id.into(),
            attempt_id: format!("attempt-{action_id}"),
            authorized_at: "2026-08-29T12:00:02.000Z".into(),
            call_id: format!("call-{action_id}"),
            generation: 1,
            kind: DispatchKind::Provider,
            request_digest: sha256(&canonical_json(&provider_prompt()).unwrap()),
        }
    }

    fn tool_allocate(
        action_id: &str,
        input_digest: &str,
        catalog: &str,
        tool_name: &str,
        request_digest: String,
    ) -> ArmDispatchInput {
        let snapshot = json!({
            "catalogDigest": catalog,
            "grantedCapabilities": [],
        });
        ArmDispatchInput::Allocate {
            action_id: action_id.into(),
            allocated_at: "2026-08-29T12:00:01.000Z".into(),
            attempt_id: format!("attempt-{action_id}"),
            call_id: format!("call-{action_id}"),
            dispatch: DispatchAllocation::Tool {
                model_tool_call_id: "model-tool-call-1".into(),
                request_digest,
                tool_name: tool_name.into(),
                tool_version: "1".into(),
            },
            execution_id: format!("execution-{action_id}"),
            generation: 1,
            input_digest: input_digest.into(),
            lease_expires_at: "2026-08-29T12:10:00.000Z".into(),
            owner_id: "ipad-owner".into(),
            snapshot_digest: sha256(&canonical_json(&snapshot).unwrap()),
            snapshot,
        }
    }

    fn settlement(action_id: &str) -> SettleAttemptInput {
        SettleAttemptInput {
            action_id: action_id.into(),
            attempt_id: format!("attempt-{action_id}"),
            call_id: format!("call-{action_id}"),
            completed_at: "2026-08-29T12:00:03.000Z".into(),
            error_code: None,
            events: vec![ProposedEvent {
                body: json!({
                    "actionId": action_id,
                    "schemaVersion": 1,
                    "text": "done",
                }),
                stream_id: action_id.into(),
                event_type: "generation.completed".into(),
            }],
            generation: 1,
            kind: DispatchKind::Provider,
            output_digest: "4".repeat(64),
            status: "succeeded".into(),
            usage: Some(json!({"inputTokens": 8, "outputTokens": 2})),
            usage_state: Some("REPORTED".into()),
        }
    }

    fn status(connection: &Connection, table: &str, id_column: &str, id: &str) -> String {
        connection
            .query_row(
                &format!("SELECT status FROM {table} WHERE {id_column}=?1"),
                [id],
                |row| row.get(0),
            )
            .unwrap()
    }

    fn dispatch_state(connection: &Connection, call_id: &str) -> String {
        connection
            .query_row(
                "SELECT dispatch_state FROM provider_calls WHERE call_id=?1",
                [call_id],
                |row| row.get(0),
            )
            .unwrap()
    }

    #[test]
    fn provider_dispatch_is_armed_authorized_and_settled_with_terminal_event() {
        let action_id = "action-provider";
        let (catalog, mut connection, input_digest) = setup("provider", action_id);
        insert_waiting_provider_run(&connection, action_id);
        assert_eq!(
            crate::agent_journal::runnable_runs(&connection, 1)
                .unwrap()
                .len(),
            1
        );
        let mut wrong_model = provider_allocate(action_id, &input_digest, &catalog);
        if let ArmDispatchInput::Allocate {
            dispatch: DispatchAllocation::Provider { model_id, .. },
            ..
        } = &mut wrong_model
        {
            *model_id = "frontier:wrong-model".into();
        }
        assert_eq!(
            arm_dispatch(&mut connection, &catalog, wrong_model, FaultPoint::None,)
                .unwrap()
                .disposition,
            "denied"
        );
        let armed = arm_dispatch(
            &mut connection,
            &catalog,
            provider_allocate(action_id, &input_digest, &catalog),
            FaultPoint::None,
        )
        .unwrap();
        assert_eq!(armed.disposition, "armed");
        let authorized = arm_dispatch(
            &mut connection,
            &catalog,
            authorize(action_id),
            FaultPoint::None,
        )
        .unwrap();
        assert_eq!(authorized.disposition, "authorized");
        let settled = settle_attempt(
            &mut connection,
            &catalog,
            settlement(action_id),
            FaultPoint::None,
        )
        .unwrap();
        assert_eq!(settled.disposition, "committed");
        assert_eq!(
            status(&connection, "actions", "action_id", action_id),
            "succeeded"
        );
        assert_eq!(
            status(
                &connection,
                "provider_calls",
                "call_id",
                &format!("call-{action_id}")
            ),
            "succeeded"
        );
        assert_eq!(read_events(&connection, 0, 128).unwrap().len(), 2);
        let projection =
            crate::agent_journal::read_run_projection(&connection, &format!("run-{action_id}"))
                .unwrap()
                .unwrap();
        let projection = serde_json::to_value(projection).unwrap();
        assert_eq!(projection["executionGeneration"], 1);
        assert_eq!(projection["providerAction"]["status"], "succeeded");
        assert_eq!(
            projection["providerAction"]["call"]["terminalEvent"]["body"]["text"],
            "done"
        );
        verify_integrity(&connection).unwrap();
    }

    #[test]
    fn cancelled_provider_quarantines_a_late_terminal_receipt() {
        let action_id = "action-provider-cancelled";
        let (catalog, mut connection, input_digest) = setup("provider-cancelled", action_id);
        insert_waiting_provider_run(&connection, action_id);
        let run_id = format!("run-{action_id}");
        let execution_id = format!("execution-{action_id}");
        let source = source_for_execution(&connection, &execution_id).unwrap();
        let started = KernelEvent {
            body: json!({"instanceId": run_id, "schemaVersion": 1}),
            context: event_context(
                &source,
                &execution_id,
                "workflow-generalist",
                "1",
                &execution_id,
            ),
            event_type: "workflow.started".into(),
            stream_id: run_id.clone(),
        };
        append_kernel_events(
            &connection,
            &catalog,
            "workflow-plugin",
            "2026-08-29T12:00:00.500Z",
            &format!("workflow-start:{run_id}"),
            &sha256("workflow-start"),
            "workflow-generalist",
            "1",
            vec![started],
        )
        .unwrap();
        arm_dispatch(
            &mut connection,
            &catalog,
            provider_allocate(action_id, &input_digest, &catalog),
            FaultPoint::None,
        )
        .unwrap();
        arm_dispatch(
            &mut connection,
            &catalog,
            authorize(action_id),
            FaultPoint::None,
        )
        .unwrap();
        crate::agent_journal::cancel_run(
            &mut connection,
            &catalog,
            &run_id,
            "2026-08-29T12:00:02.500Z",
        )
        .unwrap();

        let late = settle_attempt(
            &mut connection,
            &catalog,
            settlement(action_id),
            FaultPoint::None,
        )
        .unwrap();
        assert_eq!(late.disposition, "stale");
        assert_eq!(
            connection
                .query_row("SELECT count(*) FROM quarantined_receipts", [], |record| {
                    record.get::<_, i64>(0)
                })
                .unwrap(),
            1
        );
        assert_eq!(
            status(
                &connection,
                "workflow_instances",
                "instance_id",
                &format!("run-{action_id}")
            ),
            "cancelled"
        );
        verify_integrity(&connection).unwrap();
    }

    #[test]
    fn tool_dispatch_is_bound_to_the_stored_action_type_and_input() {
        let action_id = "action-tool-binding";
        let (catalog, mut connection, _) = setup("tool-binding", action_id);
        let tool_input = json!({"query": "hello"});
        let input_digest = sha256(&canonical_json(&tool_input).unwrap());
        connection
            .execute(
                "UPDATE actions SET action_type='document.read',input_json=?1,input_digest=?2,requested_capabilities_json='[]' WHERE action_id=?3",
                params![canonical_json(&tool_input).unwrap(), input_digest, action_id],
            )
            .unwrap();
        let correct_digest = sha256(
            &canonical_json(&json!({
                "input": tool_input,
                "toolId": "document.read",
                "toolVersion": "1",
            }))
            .unwrap(),
        );
        let wrong_tool_digest = sha256(
            &canonical_json(&json!({
                "input": {"query": "hello"},
                "toolId": "document.search",
                "toolVersion": "1",
            }))
            .unwrap(),
        );
        let wrong_tool = arm_dispatch(
            &mut connection,
            &catalog,
            tool_allocate(
                action_id,
                &input_digest,
                &catalog,
                "document.search",
                wrong_tool_digest,
            ),
            FaultPoint::None,
        )
        .unwrap();
        assert_eq!(wrong_tool.disposition, "denied");
        let wrong_input = arm_dispatch(
            &mut connection,
            &catalog,
            tool_allocate(
                action_id,
                &input_digest,
                &catalog,
                "document.read",
                "3".repeat(64),
            ),
            FaultPoint::None,
        )
        .unwrap();
        assert_eq!(wrong_input.disposition, "denied");
        let armed = arm_dispatch(
            &mut connection,
            &catalog,
            tool_allocate(
                action_id,
                &input_digest,
                &catalog,
                "document.read",
                correct_digest,
            ),
            FaultPoint::None,
        )
        .unwrap();
        assert_eq!(armed.disposition, "armed");
        verify_integrity(&connection).unwrap();
    }

    #[test]
    fn injected_allocation_and_settlement_faults_leave_no_partial_state() {
        let action_id = "action-fault";
        let (catalog, mut connection, input_digest) = setup("fault", action_id);
        assert!(matches!(
            arm_dispatch(
                &mut connection,
                &catalog,
                provider_allocate(action_id, &input_digest, &catalog),
                FaultPoint::AfterAllocation,
            ),
            Err(JournalError::TransactionFailed)
        ));
        assert_eq!(
            status(&connection, "actions", "action_id", action_id),
            "proposed"
        );
        let attempts: i64 = connection
            .query_row("SELECT count(*) FROM attempts", [], |row| row.get(0))
            .unwrap();
        assert_eq!(attempts, 0);

        arm_dispatch(
            &mut connection,
            &catalog,
            provider_allocate(action_id, &input_digest, &catalog),
            FaultPoint::None,
        )
        .unwrap();
        assert!(matches!(
            arm_dispatch(
                &mut connection,
                &catalog,
                authorize(action_id),
                FaultPoint::AfterAuthorization,
            ),
            Err(JournalError::TransactionFailed)
        ));
        assert_eq!(
            dispatch_state(&connection, &format!("call-{action_id}")),
            "armed"
        );
        arm_dispatch(
            &mut connection,
            &catalog,
            authorize(action_id),
            FaultPoint::None,
        )
        .unwrap();
        assert!(matches!(
            settle_attempt(
                &mut connection,
                &catalog,
                settlement(action_id),
                FaultPoint::AfterSettlement,
            ),
            Err(JournalError::TransactionFailed)
        ));
        assert_eq!(
            status(&connection, "actions", "action_id", action_id),
            "running"
        );
        assert_eq!(
            status(
                &connection,
                "provider_calls",
                "call_id",
                &format!("call-{action_id}")
            ),
            "allocated"
        );
        assert_eq!(read_events(&connection, 0, 128).unwrap().len(), 1);
        assert!(matches!(
            settle_attempt(
                &mut connection,
                &catalog,
                settlement(action_id),
                FaultPoint::AfterSettlementEvents,
            ),
            Err(JournalError::TransactionFailed)
        ));
        assert_eq!(
            status(&connection, "actions", "action_id", action_id),
            "running"
        );
        assert_eq!(
            status(
                &connection,
                "provider_calls",
                "call_id",
                &format!("call-{action_id}")
            ),
            "allocated"
        );
        assert_eq!(read_events(&connection, 0, 128).unwrap().len(), 1);
        verify_integrity(&connection).unwrap();
    }

    #[test]
    fn reconciliation_retries_armed_and_fences_dispatched_attempts() {
        let armed_id = "action-armed";
        let (catalog, mut connection, input_digest) = setup("reconcile", armed_id);
        arm_dispatch(
            &mut connection,
            &catalog,
            provider_allocate(armed_id, &input_digest, &catalog),
            FaultPoint::None,
        )
        .unwrap();

        let dispatched_id = "action-dispatched";
        let action_input = provider_action_input();
        let second_digest = sha256(&canonical_json(&action_input).unwrap());
        admit(
            &mut connection,
            &catalog,
            Admission {
                accepted_at: "2026-08-29T12:00:00.500Z".into(),
                actor_id: "curiosity-kernel".into(),
                command_digest: "2".repeat(64),
                command_id: "propose-dispatched".into(),
                contribution_id: "workflow-generalist".into(),
                contribution_version: "1".into(),
                events: vec![ProposedEvent {
                    body: json!({"actionId": dispatched_id, "executionId": format!("execution-{dispatched_id}")}),
                    stream_id: dispatched_id.into(),
                    event_type: "action.proposed".into(),
                }],
                plugin_id: "workflow-plugin".into(),
            },
        )
        .unwrap();
        connection.execute(
            "INSERT INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?1,0,0,'active',0,?2)",
            params![format!("execution-{dispatched_id}"), "2026-08-29T12:00:00.500Z"],
        ).unwrap();
        connection.execute(
            "INSERT INTO actions(action_id,source_event_id,reactor_id,plugin_id,action_type,action_schema_version,execution_id,resource,gate_class,deadline_class,input_json,input_digest,requested_capabilities_json,status,created_at,updated_at) VALUES (?1,'source','workflow-generalist','workflow-plugin','provider.generate',1,?2,?3,'none-requested','interactive',?4,?5,'[\"provider.generate\"]','proposed',?6,?6)",
            params![dispatched_id, format!("execution-{dispatched_id}"), format!("model:{dispatched_id}"), canonical_json(&action_input).unwrap(), second_digest, "2026-08-29T12:00:00.500Z"],
        ).unwrap();
        arm_dispatch(
            &mut connection,
            &catalog,
            provider_allocate(dispatched_id, &second_digest, &catalog),
            FaultPoint::None,
        )
        .unwrap();
        arm_dispatch(
            &mut connection,
            &catalog,
            authorize(dispatched_id),
            FaultPoint::None,
        )
        .unwrap();

        let result = reconcile_interrupted(&mut connection, "2026-08-29T12:00:04.000Z").unwrap();
        assert_eq!(result.attempts.len(), 2);
        assert_eq!(result.attempts[0].classification, "not-dispatched");
        assert_eq!(result.attempts[1].classification, "delivery-unknown");
        assert_eq!(
            status(&connection, "actions", "action_id", armed_id),
            "proposed"
        );
        assert_eq!(
            status(&connection, "actions", "action_id", dispatched_id),
            "delivery-unknown"
        );
    }
}
