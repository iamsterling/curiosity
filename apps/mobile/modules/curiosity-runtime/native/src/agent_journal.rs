use super::*;
use serde_json::json;

const KERNEL_ACTOR: &str = "curiosity-kernel";
const KERNEL_PLUGIN: &str = "curiosity.kernel.workflows";
const MAX_ALLOCATIONS: usize = 32;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(super) struct WorkflowLimits {
    max_actions: i64,
    max_children: i64,
    max_delegation_depth: i64,
    max_no_progress: i64,
    max_steps: i64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(super) struct StartRunInput {
    capability_ceiling: Vec<String>,
    child_key: Option<String>,
    contribution_id: String,
    contribution_version: String,
    depth: i64,
    execution_id: String,
    input: Value,
    limits: WorkflowLimits,
    parent_run_id: Option<String>,
    plugin_id: String,
    run_id: String,
    source_event_id: String,
    started_at: String,
    state: Value,
    workflow_name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ActionAllocation {
    action_id: String,
    action_schema_version: i64,
    action_type: String,
    deadline_class: String,
    execution_id: String,
    gate_class: String,
    input: Value,
    input_digest: String,
    plugin_id: String,
    reactor_id: String,
    requested_capabilities: Vec<String>,
    resource: String,
    source_event_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ChildAllocation {
    capability_ceiling: Vec<String>,
    child_key: String,
    contribution_id: String,
    contribution_version: String,
    execution_id: String,
    initial_state: Value,
    limits: WorkflowLimits,
    plugin_id: String,
    run_id: String,
    workflow_name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(super) struct CommitTransitionInput {
    actions: Vec<ActionAllocation>,
    children: Vec<ChildAllocation>,
    committed_at: String,
    expected_revision: i64,
    gate_eligible_actor_id: String,
    gate_expires_at: String,
    next_state: Value,
    observed_state_digest: String,
    progress_key: String,
    run_id: String,
    terminal_requested: bool,
    transition_digest: String,
}

#[derive(Clone, Copy, PartialEq)]
pub(super) enum FaultPoint {
    None,
    AfterRunInsert,
    AfterEventAppend,
    AfterAllocations,
    AfterTransitionUpdate,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct MutationResponse {
    disposition: &'static str,
    revision: i64,
    run_id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct RunProjection {
    action_count: i64,
    capability_ceiling: Value,
    child_count: i64,
    child_key: Option<String>,
    contribution_id: String,
    contribution_version: String,
    created_at: String,
    depth: i64,
    error_code: Option<String>,
    execution_generation: i64,
    execution_id: String,
    input: Value,
    last_progress_key: Option<String>,
    limits: RunLimitsProjection,
    no_progress_count: i64,
    parent_run_id: Option<String>,
    plugin_id: String,
    provider_action: Option<ProviderActionProjection>,
    revision: i64,
    run_id: String,
    source_event_id: String,
    state: Value,
    state_digest: String,
    status: String,
    updated_at: String,
    workflow_name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProviderActionProjection {
    action_id: String,
    call: Option<ProviderCallProjection>,
    error_code: Option<String>,
    input: Value,
    input_digest: String,
    output_digest: Option<String>,
    status: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProviderCallProjection {
    allocated_at: String,
    attempt_id: String,
    call_id: String,
    completed_at: Option<String>,
    dispatch_state: String,
    dispatched_at: Option<String>,
    error_code: Option<String>,
    generation: i64,
    model_id: String,
    output_digest: Option<String>,
    prompt_snapshot_digest: String,
    request_digest: String,
    source_revision: i64,
    status: String,
    terminal_event: Option<ProviderTerminalEvent>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProviderTerminalEvent {
    body: Value,
    stream_id: String,
    #[serde(rename = "type")]
    event_type: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RunLimitsProjection {
    max_actions: i64,
    max_children: i64,
    max_delegation_depth: i64,
    max_no_progress: i64,
    max_steps: i64,
}

struct RunRow {
    action_count: i64,
    capability_ceiling_json: String,
    child_count: i64,
    child_key: Option<String>,
    contribution_id: String,
    contribution_version: String,
    created_at: String,
    depth: i64,
    error_code: Option<String>,
    execution_generation: i64,
    execution_id: String,
    input_json: String,
    last_progress_key: Option<String>,
    max_actions: i64,
    max_children: i64,
    max_delegation_depth: i64,
    max_no_progress: i64,
    max_steps: i64,
    no_progress_count: i64,
    parent_run_id: Option<String>,
    plugin_id: String,
    run_id: String,
    source_event_id: String,
    state_json: String,
    status: String,
    revision: i64,
    updated_at: String,
    workflow_name: String,
}

pub(super) struct EventContext {
    causation_id: String,
    child_execution_id: String,
    contribution_id: String,
    contribution_version: String,
    correlation_id: String,
    parent_execution_id: String,
    root_execution_id: String,
}

pub(super) struct KernelEvent {
    pub(super) body: Value,
    pub(super) context: EventContext,
    pub(super) event_type: String,
    pub(super) stream_id: String,
}

pub(super) struct SourceContext {
    pub(super) correlation_id: String,
    pub(super) event_id: String,
    pub(super) parent_execution_id: String,
    pub(super) root_execution_id: String,
}

pub(super) fn start_run(
    connection: &mut Connection,
    catalog_digest: &str,
    input: StartRunInput,
    fault: FaultPoint,
) -> Result<MutationResponse> {
    validate_start_run(&input)?;
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|_| JournalError::TransactionFailed)?;
    if let Some(existing) = run_row(&transaction, &input.run_id)? {
        if existing.source_event_id != input.source_event_id
            || existing.contribution_id != input.contribution_id
            || existing.contribution_version != input.contribution_version
            || existing.execution_id != input.execution_id
        {
            return Err(JournalError::IdentityConflict);
        }
        return Ok(MutationResponse {
            disposition: "duplicate",
            revision: existing.revision,
            run_id: existing.run_id,
        });
    }
    let source = source_context(&transaction, &input.source_event_id)?;
    transaction
        .execute(
            "INSERT OR IGNORE INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?1,0,0,'active',0,?2)",
            params![input.execution_id, input.started_at],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    if let Some(parent_run_id) = &input.parent_run_id {
        let parent_execution_id: String = transaction
            .query_row(
                "SELECT execution_id FROM workflow_instances WHERE instance_id=?1",
                [parent_run_id],
                |row| row.get(0),
            )
            .map_err(|_| JournalError::RecordNotFound)?;
        transaction
            .execute(
                "INSERT INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) SELECT ancestor_execution_id,?1,depth+1 FROM execution_ancestry WHERE descendant_execution_id=?2",
                params![input.execution_id, parent_execution_id],
            )
            .map_err(|_| JournalError::TransactionFailed)?;
    }
    transaction
        .execute(
            "INSERT OR IGNORE INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) VALUES (?1,?1,0)",
            [&input.execution_id],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    insert_run(&transaction, &input)?;
    inject(fault, FaultPoint::AfterRunInsert)?;

    let event_body = json!({
        "capabilityCeiling": input.capability_ceiling,
        "instanceId": input.run_id,
        "schemaVersion": 1,
        "state": input.state,
        "workflowName": input.workflow_name,
        "workflowVersion": input.contribution_version,
    });
    let command_id = format!("workflow-start:{}", input.run_id);
    let command_digest = sha256(&canonical_json(&json!({
        "body": event_body,
        "streamId": input.run_id,
        "type": "workflow.started",
    }))?);
    append_kernel_events(
        &transaction,
        catalog_digest,
        KERNEL_PLUGIN,
        &input.started_at,
        &command_id,
        &command_digest,
        &input.contribution_id,
        &input.contribution_version,
        vec![KernelEvent {
            body: event_body,
            context: EventContext {
                causation_id: input.source_event_id,
                child_execution_id: input.execution_id,
                contribution_id: input.contribution_id.clone(),
                contribution_version: input.contribution_version.clone(),
                correlation_id: source.correlation_id,
                parent_execution_id: source.parent_execution_id,
                root_execution_id: source.root_execution_id,
            },
            event_type: "workflow.started".to_owned(),
            stream_id: input.run_id.clone(),
        }],
    )?;
    inject(fault, FaultPoint::AfterEventAppend)?;
    transaction
        .commit()
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(MutationResponse {
        disposition: "accepted",
        revision: 0,
        run_id: input.run_id,
    })
}

pub(super) fn commit_transition(
    connection: &mut Connection,
    catalog_digest: &str,
    input: CommitTransitionInput,
    fault: FaultPoint,
) -> Result<MutationResponse> {
    validate_transition(&input)?;
    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|_| JournalError::TransactionFailed)?;
    let row = run_row(&transaction, &input.run_id)?.ok_or(JournalError::RecordNotFound)?;
    if row.revision == input.expected_revision + 1 {
        let digest: Option<String> = transaction
            .query_row(
                "SELECT transition_digest FROM workflow_steps WHERE instance_id=?1 AND step_number=?2",
                params![input.run_id, row.revision],
                |record| record.get(0),
            )
            .optional()
            .map_err(|_| JournalError::TransactionFailed)?;
        if digest.as_deref() == Some(input.transition_digest.as_str()) {
            return Ok(MutationResponse {
                disposition: "duplicate",
                revision: row.revision,
                run_id: input.run_id,
            });
        }
    }
    if row.revision != input.expected_revision
        || row.status != "running"
        || sha256(&canonical_json(&parse_json(&row.state_json)?)?) != input.observed_state_digest
    {
        return Err(JournalError::RevisionFenced);
    }
    enforce_budgets(&row, &input)?;
    let no_progress = if row.last_progress_key.as_deref() == Some(input.progress_key.as_str()) {
        row.no_progress_count + 1
    } else {
        0
    };
    if no_progress > row.max_no_progress {
        return Err(JournalError::RevisionFenced);
    }
    let source = latest_run_source(&transaction, &input.run_id)?;
    let parent_execution_id = parent_execution(&transaction, &row)?;

    for child in &input.children {
        transaction
            .execute(
                "INSERT INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?1,0,0,'active',0,?2)",
                params![child.execution_id, input.committed_at],
            )
            .map_err(|_| JournalError::IdentityConflict)?;
        transaction
            .execute(
                "INSERT INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) SELECT ancestor_execution_id,?1,depth+1 FROM execution_ancestry WHERE descendant_execution_id=?2",
                params![child.execution_id, row.execution_id],
            )
            .map_err(|_| JournalError::TransactionFailed)?;
        transaction
            .execute(
                "INSERT INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) VALUES (?1,?1,0)",
                [&child.execution_id],
            )
            .map_err(|_| JournalError::TransactionFailed)?;
    }

    let mut events = vec![KernelEvent {
        body: json!({
            "instanceId": input.run_id,
            "progressKey": input.progress_key,
            "schemaVersion": 1,
            "state": input.next_state,
            "step": row.revision + 1,
            "terminalRequested": input.terminal_requested,
            "workflowName": row.workflow_name,
        }),
        context: event_context(
            &source,
            &row.execution_id,
            &row.contribution_id,
            &row.contribution_version,
            &parent_execution_id,
        ),
        event_type: "workflow.advanced".to_owned(),
        stream_id: input.run_id.clone(),
    }];
    for child in &input.children {
        events.push(KernelEvent {
            body: json!({
                "capabilityCeiling": child.capability_ceiling,
                "childKey": child.child_key,
                "instanceId": child.run_id,
                "parentInstanceId": input.run_id,
                "schemaVersion": 1,
                "workflowName": child.workflow_name,
                "workflowVersion": child.contribution_version,
            }),
            context: event_context(
                &source,
                &child.execution_id,
                &child.contribution_id,
                &child.contribution_version,
                &row.execution_id,
            ),
            event_type: "workflow.child-created".to_owned(),
            stream_id: child.run_id.clone(),
        });
    }
    for action in &input.actions {
        events.push(KernelEvent {
            body: json!({
                "actionId": action.action_id,
                "actionSchemaVersion": action.action_schema_version,
                "actionType": action.action_type,
                "deadlineClass": action.deadline_class,
                "executionId": action.execution_id,
                "gateClass": action.gate_class,
                "inputDigest": action.input_digest,
                "requestedCapabilities": action.requested_capabilities,
                "resource": action.resource,
                "schemaVersion": 1,
                "sourceEventId": action.source_event_id,
            }),
            context: event_context(
                &source,
                &action.execution_id,
                &action.reactor_id,
                "1",
                &row.execution_id,
            ),
            event_type: "action.proposed".to_owned(),
            stream_id: action.action_id.clone(),
        });
    }
    let command_id = format!("workflow-step:{}:{}", input.run_id, row.revision + 1);
    append_kernel_events(
        &transaction,
        catalog_digest,
        KERNEL_PLUGIN,
        &input.committed_at,
        &command_id,
        &input.transition_digest,
        &row.contribution_id,
        &row.contribution_version,
        events,
    )?;
    inject(fault, FaultPoint::AfterEventAppend)?;
    insert_actions(&transaction, &input)?;
    insert_children(&transaction, &row, &input, &command_id)?;
    inject(fault, FaultPoint::AfterAllocations)?;
    let next_state_json = canonical_json(&input.next_state)?;
    transaction
        .execute(
            "INSERT INTO workflow_steps(instance_id,step_number,from_state_json,to_state_json,progress_key,transition_digest,committed_at) VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![input.run_id, row.revision + 1, row.state_json, next_state_json, input.progress_key, input.transition_digest, input.committed_at],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    let updated = transaction
        .execute(
            "UPDATE workflow_instances SET status=?1,state_json=?2,step_count=step_count+1,no_progress_count=?3,action_count=action_count+?4,child_count=child_count+?5,last_progress_key=?6,updated_at=?7 WHERE instance_id=?8 AND step_count=?9 AND status='running'",
            params![if input.terminal_requested { "completion-requested" } else { "running" }, canonical_json(&input.next_state)?, no_progress, input.actions.len() as i64, input.children.len() as i64, input.progress_key, input.committed_at, input.run_id, input.expected_revision],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    if updated != 1 {
        return Err(JournalError::RevisionFenced);
    }
    inject(fault, FaultPoint::AfterTransitionUpdate)?;
    transaction
        .commit()
        .map_err(|_| JournalError::TransactionFailed)?;
    Ok(MutationResponse {
        disposition: "accepted",
        revision: row.revision + 1,
        run_id: input.run_id,
    })
}

pub(super) fn runnable_runs(connection: &Connection, limit: u32) -> Result<Vec<RunProjection>> {
    let mut statement = connection
        .prepare(
            "SELECT workflow_instances.action_count,workflow_instances.capability_ceiling_json,workflow_instances.child_count,workflow_instances.child_key,workflow_instances.contribution_id,workflow_instances.contribution_version,workflow_instances.created_at,workflow_instances.depth,workflow_instances.error_code,workflow_instances.execution_id,workflow_instances.input_json,workflow_instances.last_progress_key,workflow_instances.max_actions,workflow_instances.max_children,workflow_instances.max_delegation_depth,workflow_instances.max_no_progress,workflow_instances.max_steps,workflow_instances.no_progress_count,workflow_instances.parent_instance_id,workflow_instances.plugin_id,workflow_instances.instance_id,workflow_instances.source_event_id,workflow_instances.state_json,workflow_instances.status,workflow_instances.step_count,workflow_instances.updated_at,workflow_instances.workflow_name,executions.generation FROM workflow_instances JOIN executions ON executions.execution_id=workflow_instances.execution_id WHERE workflow_instances.status='running' AND NOT EXISTS (SELECT 1 FROM workflow_instances child WHERE child.parent_instance_id=workflow_instances.instance_id AND child.status IN ('running','completion-requested')) AND NOT EXISTS (SELECT 1 FROM actions WHERE actions.execution_id=workflow_instances.execution_id AND actions.status IN ('proposed','running') AND actions.action_type!='provider.generate') ORDER BY workflow_instances.depth DESC,workflow_instances.created_at,workflow_instances.instance_id LIMIT ?1",
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    let rows = statement
        .query_map([limit], row_from_record)
        .map_err(|_| JournalError::TransactionFailed)?;
    rows.map(|row| {
        row.map_err(|_| JournalError::TransactionFailed)
            .and_then(|value| to_projection(connection, value))
    })
    .collect()
}

pub(super) fn list_run_projections(
    connection: &Connection,
    limit: u32,
) -> Result<Vec<RunProjection>> {
    let mut statement = connection
        .prepare(
            "SELECT workflow_instances.action_count,workflow_instances.capability_ceiling_json,workflow_instances.child_count,workflow_instances.child_key,workflow_instances.contribution_id,workflow_instances.contribution_version,workflow_instances.created_at,workflow_instances.depth,workflow_instances.error_code,workflow_instances.execution_id,workflow_instances.input_json,workflow_instances.last_progress_key,workflow_instances.max_actions,workflow_instances.max_children,workflow_instances.max_delegation_depth,workflow_instances.max_no_progress,workflow_instances.max_steps,workflow_instances.no_progress_count,workflow_instances.parent_instance_id,workflow_instances.plugin_id,workflow_instances.instance_id,workflow_instances.source_event_id,workflow_instances.state_json,workflow_instances.status,workflow_instances.step_count,workflow_instances.updated_at,workflow_instances.workflow_name,executions.generation FROM workflow_instances JOIN executions ON executions.execution_id=workflow_instances.execution_id ORDER BY workflow_instances.updated_at DESC,workflow_instances.instance_id DESC LIMIT ?1",
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    let rows = statement
        .query_map([limit], row_from_record)
        .map_err(|_| JournalError::TransactionFailed)?;
    rows.map(|row| {
        row.map_err(|_| JournalError::TransactionFailed)
            .and_then(|value| to_projection(connection, value))
    })
    .collect()
}

pub(super) fn read_run_projection(
    connection: &Connection,
    run_id: &str,
) -> Result<Option<RunProjection>> {
    run_row(connection, run_id)?
        .map(|value| to_projection(connection, value))
        .transpose()
}

fn validate_start_run(input: &StartRunInput) -> Result<()> {
    if !bounded(&input.run_id, 512)
        || !bounded(&input.execution_id, 512)
        || !bounded(&input.source_event_id, 512)
        || !bounded(&input.workflow_name, 512)
        || !bounded(&input.contribution_id, 512)
        || !bounded(&input.contribution_version, 128)
        || !bounded(&input.plugin_id, 512)
        || !bounded(&input.started_at, 128)
        || input.depth < 0
        || input.parent_run_id.is_some() != input.child_key.is_some()
        || !valid_limits(&input.limits)
        || !valid_strings(&input.capability_ceiling, 64)
        || canonical_json(&input.input)?.len() > MAX_EVENT_BODY_BYTES
        || canonical_json(&input.state)?.len() > MAX_EVENT_BODY_BYTES
    {
        return Err(JournalError::RequestInvalid);
    }
    if let Some(value) = &input.parent_run_id {
        if !bounded(value, 512) {
            return Err(JournalError::RequestInvalid);
        }
    }
    if let Some(value) = &input.child_key {
        if !bounded(value, 512) {
            return Err(JournalError::RequestInvalid);
        }
    }
    Ok(())
}

fn validate_transition(input: &CommitTransitionInput) -> Result<()> {
    if !bounded(&input.run_id, 512)
        || input.expected_revision < 0
        || !is_digest(&input.observed_state_digest)
        || !is_digest(&input.transition_digest)
        || !bounded(&input.committed_at, 128)
        || !bounded(&input.progress_key, 512)
        || !bounded(&input.gate_eligible_actor_id, 512)
        || !bounded(&input.gate_expires_at, 128)
        || input.actions.len() > MAX_ALLOCATIONS
        || input.children.len() > MAX_ALLOCATIONS
        || canonical_json(&input.next_state)?.len() > MAX_EVENT_BODY_BYTES
    {
        return Err(JournalError::RequestInvalid);
    }
    for action in &input.actions {
        if !bounded(&action.action_id, 512)
            || action.action_schema_version < 1
            || !bounded(&action.action_type, 512)
            || !bounded(&action.execution_id, 512)
            || !bounded(&action.plugin_id, 512)
            || !bounded(&action.reactor_id, 512)
            || !bounded(&action.resource, 2048)
            || !bounded(&action.source_event_id, 512)
            || !is_digest(&action.input_digest)
            || sha256(&canonical_json(&action.input)?) != action.input_digest
            || !matches!(
                action.gate_class.as_str(),
                "none-requested" | "binding-human-requested"
            )
            || !matches!(action.deadline_class.as_str(), "interactive" | "background")
            || !valid_strings(&action.requested_capabilities, 64)
            || canonical_json(&action.input)?.len() > MAX_EVENT_BODY_BYTES
        {
            return Err(JournalError::RequestInvalid);
        }
    }
    for child in &input.children {
        if !bounded(&child.run_id, 512)
            || !bounded(&child.execution_id, 512)
            || !bounded(&child.child_key, 512)
            || !bounded(&child.workflow_name, 512)
            || !bounded(&child.contribution_id, 512)
            || !bounded(&child.contribution_version, 128)
            || !bounded(&child.plugin_id, 512)
            || !valid_limits(&child.limits)
            || !valid_strings(&child.capability_ceiling, 64)
            || canonical_json(&child.initial_state)?.len() > MAX_EVENT_BODY_BYTES
        {
            return Err(JournalError::RequestInvalid);
        }
    }
    Ok(())
}

fn valid_limits(limits: &WorkflowLimits) -> bool {
    limits.max_steps > 0
        && limits.max_no_progress >= 0
        && limits.max_actions >= 0
        && limits.max_children >= 0
        && limits.max_delegation_depth >= 0
}

fn valid_strings(values: &[String], maximum: usize) -> bool {
    values.len() <= maximum
        && values.iter().all(|value| bounded(value, 512))
        && values
            .iter()
            .collect::<std::collections::HashSet<_>>()
            .len()
            == values.len()
}

fn enforce_budgets(row: &RunRow, input: &CommitTransitionInput) -> Result<()> {
    if row.revision >= row.max_steps
        || row.action_count + input.actions.len() as i64 > row.max_actions
        || row.child_count + input.children.len() as i64 > row.max_children
        || input
            .children
            .iter()
            .any(|_| row.depth >= row.max_delegation_depth)
    {
        return Err(JournalError::RevisionFenced);
    }
    Ok(())
}

fn insert_run(connection: &Connection, input: &StartRunInput) -> Result<()> {
    connection
        .execute(
            "INSERT INTO workflow_instances(instance_id,source_event_id,workflow_name,contribution_id,contribution_version,plugin_id,execution_id,parent_instance_id,child_key,depth,status,input_json,state_json,capability_ceiling_json,step_count,no_progress_count,action_count,child_count,max_steps,max_no_progress,max_actions,max_children,max_delegation_depth,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,'running',?11,?12,?13,0,0,0,0,?14,?15,?16,?17,?18,?19,?19)",
            params![input.run_id, input.source_event_id, input.workflow_name, input.contribution_id, input.contribution_version, input.plugin_id, input.execution_id, input.parent_run_id, input.child_key, input.depth, canonical_json(&input.input)?, canonical_json(&input.state)?, canonical_json(&serde_json::to_value(&input.capability_ceiling).map_err(|_| JournalError::RequestInvalid)?)?, input.limits.max_steps, input.limits.max_no_progress, input.limits.max_actions, input.limits.max_children, input.limits.max_delegation_depth, input.started_at],
        )
        .map_err(|_| JournalError::IdentityConflict)?;
    Ok(())
}

fn insert_actions(connection: &Connection, input: &CommitTransitionInput) -> Result<()> {
    for action in &input.actions {
        connection
            .execute(
                "INSERT OR IGNORE INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?1,0,0,'active',0,?2)",
                params![action.execution_id, input.committed_at],
            )
            .map_err(|_| JournalError::TransactionFailed)?;
        connection
            .execute(
                "INSERT INTO actions(action_id,source_event_id,reactor_id,plugin_id,action_type,action_schema_version,execution_id,resource,gate_class,deadline_class,input_json,input_digest,requested_capabilities_json,status,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,'proposed',?14,?14)",
                params![action.action_id, action.source_event_id, action.reactor_id, action.plugin_id, action.action_type, action.action_schema_version, action.execution_id, action.resource, action.gate_class, action.deadline_class, canonical_json(&action.input)?, action.input_digest, canonical_json(&serde_json::to_value(&action.requested_capabilities).map_err(|_| JournalError::RequestInvalid)?)?, input.committed_at],
            )
            .map_err(|_| JournalError::IdentityConflict)?;
        if action.gate_class == "binding-human-requested" {
            connection
                .execute(
                    "INSERT INTO gates(gate_id,action_id,proposal_revision,payload_digest,policy_version,eligible_actor_id,status,expires_at,created_at) VALUES (?1,?2,1,?3,'local-v1',?4,'pending',?5,?6)",
                    params![format!("gate:{}:1", action.action_id), action.action_id, action.input_digest, input.gate_eligible_actor_id, input.gate_expires_at, input.committed_at],
                )
                .map_err(|_| JournalError::IdentityConflict)?;
        }
    }
    Ok(())
}

fn insert_children(
    connection: &Connection,
    row: &RunRow,
    input: &CommitTransitionInput,
    command_id: &str,
) -> Result<()> {
    for child in &input.children {
        let source_event_id: String = connection
            .query_row(
                "SELECT event_id FROM events WHERE command_id=?1 AND event_type='workflow.child-created' AND stream_id=?2",
                params![command_id, child.run_id],
                |record| record.get(0),
            )
            .map_err(|_| JournalError::TransactionFailed)?;
        let child_input = json!({
            "childKey": child.child_key,
            "parentInstanceId": input.run_id,
        });
        connection
            .execute(
                "INSERT INTO workflow_instances(instance_id,source_event_id,workflow_name,contribution_id,contribution_version,plugin_id,execution_id,parent_instance_id,child_key,depth,status,input_json,state_json,capability_ceiling_json,step_count,no_progress_count,action_count,child_count,max_steps,max_no_progress,max_actions,max_children,max_delegation_depth,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,'running',?11,?12,?13,0,0,0,0,?14,?15,?16,?17,?18,?19,?19)",
                params![child.run_id, source_event_id, child.workflow_name, child.contribution_id, child.contribution_version, child.plugin_id, child.execution_id, input.run_id, child.child_key, row.depth + 1, canonical_json(&child_input)?, canonical_json(&child.initial_state)?, canonical_json(&serde_json::to_value(&child.capability_ceiling).map_err(|_| JournalError::RequestInvalid)?)?, child.limits.max_steps, child.limits.max_no_progress, child.limits.max_actions, child.limits.max_children, std::cmp::min(row.max_delegation_depth, child.limits.max_delegation_depth), input.committed_at],
            )
            .map_err(|_| JournalError::IdentityConflict)?;
    }
    Ok(())
}

pub(super) fn append_kernel_events(
    connection: &Connection,
    catalog_digest: &str,
    plugin_id: &str,
    accepted_at: &str,
    command_id: &str,
    command_digest: &str,
    contribution_id: &str,
    contribution_version: &str,
    events: Vec<KernelEvent>,
) -> Result<()> {
    if let Some(existing) = admission_row(connection, KERNEL_ACTOR, command_id)? {
        return if existing.command_digest == command_digest {
            Ok(())
        } else {
            Err(JournalError::CommandDigestConflict)
        };
    }
    let tail: Option<(i64, String)> = connection
        .query_row(
            "SELECT global_sequence,event_hash FROM events ORDER BY global_sequence DESC LIMIT 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|_| JournalError::TransactionFailed)?;
    let mut sequence = tail.as_ref().map_or(0, |value| value.0);
    let mut previous_hash = tail.map_or_else(|| EMPTY_HASH.to_owned(), |value| value.1);
    let first_sequence = sequence + 1;
    let event_count = events.len() as i64;
    for (index, event) in events.into_iter().enumerate() {
        sequence += 1;
        let aggregate_version: i64 = connection
            .query_row(
                "SELECT count(*)+1 FROM events WHERE stream_id=?1",
                [&event.stream_id],
                |row| row.get(0),
            )
            .map_err(|_| JournalError::TransactionFailed)?;
        let mut stored = StoredEvent {
            actor_id: KERNEL_ACTOR.to_owned(),
            aggregate_version,
            body: event.body,
            catalog_digest: catalog_digest.to_owned(),
            causation_id: event.context.causation_id,
            child_execution_id: event.context.child_execution_id,
            command_id: command_id.to_owned(),
            contribution_id: event.context.contribution_id,
            contribution_version: event.context.contribution_version,
            correlation_id: event.context.correlation_id,
            event_hash: String::new(),
            event_id: String::new(),
            event_schema_version: 1,
            occurred_at: accepted_at.to_owned(),
            parent_execution_id: event.context.parent_execution_id,
            plugin_id: plugin_id.to_owned(),
            previous_hash: previous_hash.clone(),
            root_execution_id: event.context.root_execution_id,
            sequence,
            stream_id: event.stream_id,
            event_type: event.event_type,
        };
        stored.event_hash = sha256(&canonical_json(&stored.envelope_value()?)?);
        stored.event_id = sha256(&format!(
            "{}:{}:{}:{}",
            KERNEL_ACTOR, command_id, index, stored.event_hash
        ));
        connection
            .execute(
                "INSERT INTO events(global_sequence,event_id,command_id,actor_id,plugin_id,event_type,stream_id,body_json,occurred_at,previous_hash,event_hash,event_schema_version,aggregate_version,causation_id,correlation_id,root_execution_id,parent_execution_id,child_execution_id,contribution_id,contribution_version,catalog_digest) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21)",
                params![stored.sequence, stored.event_id, stored.command_id, stored.actor_id, stored.plugin_id, stored.event_type, stored.stream_id, canonical_json(&stored.body)?, stored.occurred_at, stored.previous_hash, stored.event_hash, stored.event_schema_version, stored.aggregate_version, stored.causation_id, stored.correlation_id, stored.root_execution_id, stored.parent_execution_id, stored.child_execution_id, stored.contribution_id, stored.contribution_version, stored.catalog_digest],
            )
            .map_err(|_| JournalError::TransactionFailed)?;
        previous_hash = stored.event_hash;
    }
    connection
        .execute(
            "INSERT INTO command_admissions(actor_id,command_id,command_digest,nonce,accepted_at,first_sequence,last_sequence,event_count) VALUES (?1,?2,?3,?3,?4,?5,?6,?7)",
            params![KERNEL_ACTOR, command_id, command_digest, accepted_at, first_sequence, sequence, event_count],
        )
        .map_err(|_| JournalError::TransactionFailed)?;
    let _ = (contribution_id, contribution_version);
    Ok(())
}

fn run_row(connection: &Connection, run_id: &str) -> Result<Option<RunRow>> {
    connection
        .query_row(
            "SELECT workflow_instances.action_count,workflow_instances.capability_ceiling_json,workflow_instances.child_count,workflow_instances.child_key,workflow_instances.contribution_id,workflow_instances.contribution_version,workflow_instances.created_at,workflow_instances.depth,workflow_instances.error_code,workflow_instances.execution_id,workflow_instances.input_json,workflow_instances.last_progress_key,workflow_instances.max_actions,workflow_instances.max_children,workflow_instances.max_delegation_depth,workflow_instances.max_no_progress,workflow_instances.max_steps,workflow_instances.no_progress_count,workflow_instances.parent_instance_id,workflow_instances.plugin_id,workflow_instances.instance_id,workflow_instances.source_event_id,workflow_instances.state_json,workflow_instances.status,workflow_instances.step_count,workflow_instances.updated_at,workflow_instances.workflow_name,executions.generation FROM workflow_instances JOIN executions ON executions.execution_id=workflow_instances.execution_id WHERE workflow_instances.instance_id=?1",
            [run_id],
            row_from_record,
        )
        .optional()
        .map_err(|_| JournalError::TransactionFailed)
}

fn row_from_record(row: &rusqlite::Row<'_>) -> rusqlite::Result<RunRow> {
    Ok(RunRow {
        action_count: row.get(0)?,
        capability_ceiling_json: row.get(1)?,
        child_count: row.get(2)?,
        child_key: row.get(3)?,
        contribution_id: row.get(4)?,
        contribution_version: row.get(5)?,
        created_at: row.get(6)?,
        depth: row.get(7)?,
        error_code: row.get(8)?,
        execution_id: row.get(9)?,
        input_json: row.get(10)?,
        last_progress_key: row.get(11)?,
        max_actions: row.get(12)?,
        max_children: row.get(13)?,
        max_delegation_depth: row.get(14)?,
        max_no_progress: row.get(15)?,
        max_steps: row.get(16)?,
        no_progress_count: row.get(17)?,
        parent_run_id: row.get(18)?,
        plugin_id: row.get(19)?,
        run_id: row.get(20)?,
        source_event_id: row.get(21)?,
        state_json: row.get(22)?,
        status: row.get(23)?,
        revision: row.get(24)?,
        updated_at: row.get(25)?,
        workflow_name: row.get(26)?,
        execution_generation: row.get(27)?,
    })
}

fn to_projection(connection: &Connection, row: RunRow) -> Result<RunProjection> {
    let state = parse_json(&row.state_json)?;
    let provider_action = provider_action_projection(connection, &row.execution_id, &state)?;
    Ok(RunProjection {
        action_count: row.action_count,
        capability_ceiling: parse_json(&row.capability_ceiling_json)?,
        child_count: row.child_count,
        child_key: row.child_key,
        contribution_id: row.contribution_id,
        contribution_version: row.contribution_version,
        created_at: row.created_at,
        depth: row.depth,
        error_code: row.error_code,
        execution_generation: row.execution_generation,
        execution_id: row.execution_id,
        input: parse_json(&row.input_json)?,
        last_progress_key: row.last_progress_key,
        limits: RunLimitsProjection {
            max_actions: row.max_actions,
            max_children: row.max_children,
            max_delegation_depth: row.max_delegation_depth,
            max_no_progress: row.max_no_progress,
            max_steps: row.max_steps,
        },
        no_progress_count: row.no_progress_count,
        parent_run_id: row.parent_run_id,
        plugin_id: row.plugin_id,
        provider_action,
        revision: row.revision,
        run_id: row.run_id,
        source_event_id: row.source_event_id,
        state_digest: sha256(&canonical_json(&state)?),
        state,
        status: row.status,
        updated_at: row.updated_at,
        workflow_name: row.workflow_name,
    })
}

fn provider_action_projection(
    connection: &Connection,
    execution_id: &str,
    state: &Value,
) -> Result<Option<ProviderActionProjection>> {
    let Some(action_id) = state
        .as_object()
        .filter(|value| value.get("phase").and_then(Value::as_str) == Some("waiting-provider"))
        .and_then(|value| value.get("providerActionId"))
        .and_then(Value::as_str)
    else {
        return Ok(None);
    };
    let action: Option<(String, String, String, Option<String>, Option<String>)> = connection
        .query_row(
            "SELECT input_json,input_digest,status,output_digest,error_code FROM actions WHERE action_id=?1 AND execution_id=?2 AND action_type='provider.generate'",
            params![action_id, execution_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
        )
        .optional()
        .map_err(|_| JournalError::TransactionFailed)?;
    let Some((input_json, input_digest, status, output_digest, error_code)) = action else {
        return Ok(None);
    };
    Ok(Some(ProviderActionProjection {
        action_id: action_id.to_owned(),
        call: provider_call_projection(connection, action_id)?,
        error_code,
        input: parse_json(&input_json)?,
        input_digest,
        output_digest,
        status,
    }))
}

fn provider_call_projection(
    connection: &Connection,
    action_id: &str,
) -> Result<Option<ProviderCallProjection>> {
    type ProviderCallRow = (
        String,
        String,
        String,
        Option<String>,
        String,
        Option<String>,
        Option<String>,
        i64,
        String,
        Option<String>,
        String,
        String,
        i64,
        String,
    );
    let row: Option<ProviderCallRow> = connection
        .query_row(
            "SELECT allocated_at,attempt_id,call_id,completed_at,dispatch_state,dispatched_at,error_code,generation,model_id,output_digest,prompt_snapshot_digest,request_digest,source_revision,status FROM provider_calls WHERE action_id=?1",
            [action_id],
            |row| {
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
                    row.get(9)?,
                    row.get(10)?,
                    row.get(11)?,
                    row.get(12)?,
                    row.get(13)?,
                ))
            },
        )
        .optional()
        .map_err(|_| JournalError::TransactionFailed)?;
    let Some((
        allocated_at,
        attempt_id,
        call_id,
        completed_at,
        dispatch_state,
        dispatched_at,
        error_code,
        generation,
        model_id,
        output_digest,
        prompt_snapshot_digest,
        request_digest,
        source_revision,
        status,
    )) = row
    else {
        return Ok(None);
    };
    let terminal_event = provider_terminal_event(connection, action_id, &call_id)?;
    Ok(Some(ProviderCallProjection {
        allocated_at,
        attempt_id,
        call_id,
        completed_at,
        dispatch_state,
        dispatched_at,
        error_code,
        generation,
        model_id,
        output_digest,
        prompt_snapshot_digest,
        request_digest,
        source_revision,
        status,
        terminal_event,
    }))
}

fn provider_terminal_event(
    connection: &Connection,
    action_id: &str,
    call_id: &str,
) -> Result<Option<ProviderTerminalEvent>> {
    let command_ids = [
        format!("{call_id}:succeeded"),
        format!("{call_id}:failed"),
        format!("{call_id}:cancelled"),
        format!("{call_id}:delivery-unknown"),
    ];
    let event: Option<(String, String, String)> = connection
        .query_row(
            "SELECT body_json,stream_id,event_type FROM events WHERE stream_id=?1 AND command_id IN (?2,?3,?4,?5) ORDER BY global_sequence DESC LIMIT 1",
            params![action_id, command_ids[0], command_ids[1], command_ids[2], command_ids[3]],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .optional()
        .map_err(|_| JournalError::TransactionFailed)?;
    event
        .map(|(body, stream_id, event_type)| {
            Ok(ProviderTerminalEvent {
                body: parse_json(&body)?,
                event_type,
                stream_id,
            })
        })
        .transpose()
}

fn parse_json(value: &str) -> Result<Value> {
    serde_json::from_str(value).map_err(|_| JournalError::IntegrityInvalid)
}

fn source_context(connection: &Connection, event_id: &str) -> Result<SourceContext> {
    connection
        .query_row(
            "SELECT event_id,correlation_id,root_execution_id,parent_execution_id FROM events WHERE event_id=?1",
            [event_id],
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

fn latest_run_source(connection: &Connection, run_id: &str) -> Result<SourceContext> {
    connection
        .query_row(
            "SELECT event_id,correlation_id,root_execution_id,parent_execution_id FROM events WHERE stream_id=?1 ORDER BY aggregate_version DESC LIMIT 1",
            [run_id],
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

fn parent_execution(connection: &Connection, row: &RunRow) -> Result<String> {
    match &row.parent_run_id {
        Some(parent) => connection
            .query_row(
                "SELECT execution_id FROM workflow_instances WHERE instance_id=?1",
                [parent],
                |record| record.get(0),
            )
            .map_err(|_| JournalError::RecordNotFound),
        None => Ok(row.execution_id.clone()),
    }
}

pub(super) fn event_context(
    source: &SourceContext,
    child_execution_id: &str,
    contribution_id: &str,
    contribution_version: &str,
    parent_execution_id: &str,
) -> EventContext {
    EventContext {
        causation_id: source.event_id.clone(),
        child_execution_id: child_execution_id.to_owned(),
        contribution_id: contribution_id.to_owned(),
        contribution_version: contribution_version.to_owned(),
        correlation_id: source.correlation_id.clone(),
        parent_execution_id: parent_execution_id.to_owned(),
        root_execution_id: source.root_execution_id.clone(),
    }
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

    fn database(name: &str) -> (String, String, Connection, String) {
        let root = std::env::temp_dir().join(format!(
            "curiosity-agent-journal-{}-{}-{}",
            std::process::id(),
            name,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&root).unwrap();
        let path = root.join("journal.sqlite3").to_string_lossy().into_owned();
        let catalog_digest = "0".repeat(64);
        let connection = open_database(&path).unwrap();
        initialize(&connection, &catalog_digest).unwrap();
        drop(connection);
        let mut connection = open_ready_database(&path, &catalog_digest).unwrap();
        let admitted = admit(
            &mut connection,
            &catalog_digest,
            Admission {
                accepted_at: "2026-08-29T12:00:00.000Z".into(),
                actor_id: "local-owner".into(),
                command_digest: "1".repeat(64),
                command_id: "request-1".into(),
                contribution_id: "request-contribution".into(),
                contribution_version: "1".into(),
                events: vec![ProposedEvent {
                    body: json!({
                        "rootExecutionId": "execution-root",
                        "schemaVersion": 1,
                    }),
                    stream_id: "request-stream".into(),
                    event_type: "workflow.requested".into(),
                }],
                plugin_id: "request-plugin".into(),
            },
        )
        .unwrap();
        let source_event_id = admitted.events[0].event_id.clone();
        (path, catalog_digest, connection, source_event_id)
    }

    fn limits() -> WorkflowLimits {
        WorkflowLimits {
            max_actions: 4,
            max_children: 4,
            max_delegation_depth: 3,
            max_no_progress: 2,
            max_steps: 8,
        }
    }

    fn start_input(source_event_id: &str) -> StartRunInput {
        StartRunInput {
            capability_ceiling: vec!["documents.read".into()],
            child_key: None,
            contribution_id: "workflow-generalist".into(),
            contribution_version: "1".into(),
            depth: 0,
            execution_id: "run-root".into(),
            input: json!({"goal": "summarize"}),
            limits: limits(),
            parent_run_id: None,
            plugin_id: "workflow-plugin".into(),
            run_id: "run-root".into(),
            source_event_id: source_event_id.into(),
            started_at: "2026-08-29T12:00:01.000Z".into(),
            state: json!({"phase": "start"}),
            workflow_name: "generalist".into(),
        }
    }

    fn transition_input() -> CommitTransitionInput {
        let action_input = json!({"documentId": "document-1"});
        CommitTransitionInput {
            actions: vec![ActionAllocation {
                action_id: "action-1".into(),
                action_schema_version: 1,
                action_type: "document.read".into(),
                deadline_class: "interactive".into(),
                execution_id: "run-root".into(),
                gate_class: "binding-human-requested".into(),
                input_digest: sha256(&canonical_json(&action_input).unwrap()),
                input: action_input,
                plugin_id: "workflow-plugin".into(),
                reactor_id: "workflow-generalist".into(),
                requested_capabilities: vec!["documents.read".into()],
                resource: "document:document-1".into(),
                source_event_id: "source-action-1".into(),
            }],
            children: vec![ChildAllocation {
                capability_ceiling: vec!["documents.read".into()],
                child_key: "review".into(),
                contribution_id: "workflow-reviewer".into(),
                contribution_version: "1".into(),
                execution_id: "run-child".into(),
                initial_state: json!({"phase": "review"}),
                limits: limits(),
                plugin_id: "workflow-plugin".into(),
                run_id: "run-child".into(),
                workflow_name: "reviewer".into(),
            }],
            committed_at: "2026-08-29T12:00:02.000Z".into(),
            expected_revision: 0,
            gate_eligible_actor_id: "local-owner".into(),
            gate_expires_at: "2026-08-29T12:10:00.000Z".into(),
            next_state: json!({"phase": "waiting"}),
            observed_state_digest: sha256(&canonical_json(&json!({"phase": "start"})).unwrap()),
            progress_key: "allocated".into(),
            run_id: "run-root".into(),
            terminal_requested: false,
            transition_digest: "4".repeat(64),
        }
    }

    fn count(connection: &Connection, table: &str) -> i64 {
        connection
            .query_row(&format!("SELECT count(*) FROM {table}"), [], |row| {
                row.get(0)
            })
            .unwrap()
    }

    #[test]
    fn v2_start_and_transition_are_idempotent_and_revision_fenced() {
        let (_, catalog, mut connection, source) = database("roundtrip");
        let started = start_run(
            &mut connection,
            &catalog,
            start_input(&source),
            FaultPoint::None,
        )
        .unwrap();
        assert_eq!(started.disposition, "accepted");
        let duplicate = start_run(
            &mut connection,
            &catalog,
            start_input(&source),
            FaultPoint::None,
        )
        .unwrap();
        assert_eq!(duplicate.disposition, "duplicate");

        let mut mismatched_input = transition_input();
        mismatched_input.actions[0].input_digest = "9".repeat(64);
        assert!(matches!(
            commit_transition(
                &mut connection,
                &catalog,
                mismatched_input,
                FaultPoint::None,
            ),
            Err(JournalError::RequestInvalid)
        ));

        let committed = commit_transition(
            &mut connection,
            &catalog,
            transition_input(),
            FaultPoint::None,
        )
        .unwrap();
        assert_eq!(committed.revision, 1);
        let duplicate = commit_transition(
            &mut connection,
            &catalog,
            transition_input(),
            FaultPoint::None,
        )
        .unwrap();
        assert_eq!(duplicate.disposition, "duplicate");

        let mut changed = transition_input();
        changed.transition_digest = "5".repeat(64);
        assert!(matches!(
            commit_transition(&mut connection, &catalog, changed, FaultPoint::None),
            Err(JournalError::RevisionFenced)
        ));
        let projection = read_run_projection(&connection, "run-root")
            .unwrap()
            .unwrap();
        assert_eq!(projection.revision, 1);
        assert_eq!(projection.action_count, 1);
        assert_eq!(projection.child_count, 1);
        assert_eq!(count(&connection, "events"), 5);
        assert_eq!(count(&connection, "actions"), 1);
        assert_eq!(count(&connection, "gates"), 1);
        assert_eq!(count(&connection, "workflow_steps"), 1);
        assert_eq!(
            runnable_runs(&connection, 8).unwrap()[0].run_id,
            "run-child"
        );
        let activity = list_run_projections(&connection, 8).unwrap();
        assert_eq!(activity.len(), 2);
        assert!(activity.iter().any(|run| run.depth == 1));
        assert!(activity.iter().any(|run| run.run_id == "run-root"));
        verify_integrity(&connection).unwrap();
    }

    #[test]
    fn injected_start_fault_rolls_back_run_event_and_execution() {
        let (_, catalog, mut connection, source) = database("start-rollback");
        assert!(matches!(
            start_run(
                &mut connection,
                &catalog,
                start_input(&source),
                FaultPoint::AfterRunInsert,
            ),
            Err(JournalError::TransactionFailed)
        ));
        assert_eq!(count(&connection, "workflow_instances"), 0);
        assert_eq!(count(&connection, "executions"), 0);
        assert_eq!(count(&connection, "events"), 1);
        verify_integrity(&connection).unwrap();
    }

    #[test]
    fn injected_transition_fault_rolls_back_events_actions_children_and_step() {
        let (_, catalog, mut connection, source) = database("transition-rollback");
        start_run(
            &mut connection,
            &catalog,
            start_input(&source),
            FaultPoint::None,
        )
        .unwrap();
        assert!(matches!(
            commit_transition(
                &mut connection,
                &catalog,
                transition_input(),
                FaultPoint::AfterAllocations,
            ),
            Err(JournalError::TransactionFailed)
        ));
        let projection = read_run_projection(&connection, "run-root")
            .unwrap()
            .unwrap();
        assert_eq!(projection.revision, 0);
        assert_eq!(count(&connection, "events"), 2);
        assert_eq!(count(&connection, "actions"), 0);
        assert_eq!(count(&connection, "gates"), 0);
        assert_eq!(count(&connection, "workflow_steps"), 0);
        assert_eq!(count(&connection, "workflow_instances"), 1);
        verify_integrity(&connection).unwrap();

        assert!(matches!(
            commit_transition(
                &mut connection,
                &catalog,
                transition_input(),
                FaultPoint::AfterTransitionUpdate,
            ),
            Err(JournalError::TransactionFailed)
        ));
        let projection = read_run_projection(&connection, "run-root")
            .unwrap()
            .unwrap();
        assert_eq!(projection.revision, 0);
        assert_eq!(count(&connection, "events"), 2);
        assert_eq!(count(&connection, "actions"), 0);
        assert_eq!(count(&connection, "gates"), 0);
        assert_eq!(count(&connection, "workflow_steps"), 0);
        assert_eq!(count(&connection, "workflow_instances"), 1);
        verify_integrity(&connection).unwrap();
    }

    #[test]
    fn v1_database_opens_for_v2_without_schema_rewrite() {
        let (path, catalog, connection, _) = database("abi-upgrade");
        let version: String = connection
            .query_row(
                "SELECT value FROM harness_metadata WHERE key='schema_version'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(version, "15");
        drop(connection);
        let response = execute(Request::Open {
            abi_version: 1,
            catalog_digest: catalog.clone(),
            database_path: path.clone(),
        })
        .unwrap();
        assert_eq!(
            serde_json::from_slice::<Value>(&response).unwrap()["abiVersion"],
            1
        );
        let response = execute(Request::Open {
            abi_version: 2,
            catalog_digest: catalog,
            database_path: path,
        })
        .unwrap();
        assert_eq!(
            serde_json::from_slice::<Value>(&response).unwrap()["abiVersion"],
            2
        );
    }
}
