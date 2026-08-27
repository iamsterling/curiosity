export const eventSchema = `
  CREATE TABLE IF NOT EXISTS harness_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  ) STRICT;
  INSERT OR IGNORE INTO harness_metadata(key, value) VALUES ('schema_version', '13');
  CREATE TABLE IF NOT EXISTS command_admissions (
    actor_id TEXT NOT NULL,
    command_id TEXT NOT NULL,
    command_digest TEXT NOT NULL,
    nonce TEXT NOT NULL,
    accepted_at TEXT NOT NULL,
    first_sequence INTEGER NOT NULL,
    last_sequence INTEGER NOT NULL,
    event_count INTEGER NOT NULL,
    PRIMARY KEY(actor_id, command_id)
  ) STRICT;
  CREATE TABLE IF NOT EXISTS events (
    global_sequence INTEGER PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    command_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    plugin_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    stream_id TEXT NOT NULL,
    body_json TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    previous_hash TEXT NOT NULL,
    event_hash TEXT NOT NULL UNIQUE
  ) STRICT;
  CREATE INDEX IF NOT EXISTS events_command_idx ON events(actor_id, command_id, global_sequence);
  CREATE TRIGGER IF NOT EXISTS events_no_update BEFORE UPDATE ON events BEGIN
    SELECT RAISE(ABORT, 'EVENT_LOG_IMMUTABLE');
  END;
  CREATE TRIGGER IF NOT EXISTS events_no_delete BEFORE DELETE ON events BEGIN
    SELECT RAISE(ABORT, 'EVENT_LOG_IMMUTABLE');
  END;
  CREATE TABLE IF NOT EXISTS reaction_runs (
    source_event_id TEXT NOT NULL,
    reactor_id TEXT NOT NULL,
    reactor_version INTEGER NOT NULL,
    plugin_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('running', 'completed')),
    started_at TEXT NOT NULL,
    completed_at TEXT,
    output_digest TEXT,
    PRIMARY KEY(source_event_id, reactor_id, reactor_version)
  ) STRICT;
  CREATE TABLE IF NOT EXISTS actions (
    action_id TEXT PRIMARY KEY,
    source_event_id TEXT NOT NULL,
    reactor_id TEXT NOT NULL,
    plugin_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_schema_version INTEGER NOT NULL,
    execution_id TEXT NOT NULL,
    resource TEXT NOT NULL,
    gate_class TEXT NOT NULL CHECK(gate_class IN ('none-requested', 'binding-human-requested')),
    deadline_class TEXT NOT NULL CHECK(deadline_class IN ('interactive', 'background')),
    input_json TEXT NOT NULL,
    input_digest TEXT NOT NULL,
    requested_capabilities_json TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('proposed', 'running', 'succeeded', 'failed', 'delivery-unknown')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    output_digest TEXT,
    error_code TEXT
  ) STRICT;
  CREATE INDEX IF NOT EXISTS actions_status_idx ON actions(status, created_at, action_id);
  CREATE TABLE IF NOT EXISTS executions (
    execution_id TEXT PRIMARY KEY,
    version INTEGER NOT NULL,
    generation INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'cancelling', 'cancelled', 'completed', 'failed', 'delivery-unknown')),
    cancellation_requested INTEGER NOT NULL CHECK(cancellation_requested IN (0, 1)),
    updated_at TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS attempts (
    attempt_id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL REFERENCES actions(action_id),
    execution_id TEXT NOT NULL REFERENCES executions(execution_id),
    generation INTEGER NOT NULL,
    owner_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('running', 'succeeded', 'failed', 'cancelled', 'delivery-unknown')),
    lease_expires_at TEXT NOT NULL,
    heartbeat_at TEXT NOT NULL,
    snapshot_digest TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    catalog_digest TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(execution_id, generation)
  ) STRICT;
  CREATE INDEX IF NOT EXISTS attempts_status_idx ON attempts(status, lease_expires_at);
  CREATE TABLE IF NOT EXISTS gates (
    gate_id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL REFERENCES actions(action_id),
    proposal_revision INTEGER NOT NULL,
    payload_digest TEXT NOT NULL,
    policy_version TEXT NOT NULL,
    eligible_actor_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'denied', 'expired')),
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    decided_at TEXT,
    decision_command_id TEXT
  ) STRICT;
  CREATE TABLE IF NOT EXISTS capability_revocations (
    capability TEXT PRIMARY KEY,
    revoked_at TEXT NOT NULL,
    reason TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS provider_calls (
    call_id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL UNIQUE REFERENCES actions(action_id),
    attempt_id TEXT REFERENCES attempts(attempt_id),
    generation INTEGER NOT NULL DEFAULT 0,
    purpose TEXT NOT NULL DEFAULT 'normal',
    model_id TEXT NOT NULL,
    request_digest TEXT NOT NULL,
    catalog_digest TEXT NOT NULL,
    prompt_snapshot_digest TEXT NOT NULL,
    prompt_snapshot_json TEXT NOT NULL,
    source_revision INTEGER NOT NULL,
    dispatch_state TEXT NOT NULL DEFAULT 'armed' CHECK(dispatch_state IN ('armed', 'dispatched')),
    dispatched_at TEXT,
    usage_state TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK(usage_state IN ('REPORTED', 'ESTIMATED', 'UNKNOWN')),
    usage_json TEXT,
    delivery_certainty TEXT NOT NULL DEFAULT 'NOT_DISPATCHED' CHECK(delivery_certainty IN ('NOT_DISPATCHED', 'DELIVERED', 'NOT_DELIVERED', 'UNKNOWN')),
    status TEXT NOT NULL CHECK(status IN ('allocated', 'succeeded', 'failed', 'delivery-unknown')),
    allocated_at TEXT NOT NULL,
    completed_at TEXT,
    output_digest TEXT,
    error_code TEXT
  ) STRICT;
  CREATE TABLE IF NOT EXISTS tool_calls (
    call_id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL UNIQUE REFERENCES actions(action_id),
    attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
    generation INTEGER NOT NULL,
    tool_name TEXT NOT NULL,
    tool_version TEXT NOT NULL,
    model_tool_call_id TEXT NOT NULL,
    request_digest TEXT NOT NULL,
    catalog_digest TEXT NOT NULL,
    dispatch_state TEXT NOT NULL DEFAULT 'armed' CHECK(dispatch_state IN ('armed', 'dispatched')),
    dispatched_at TEXT,
    delivery_certainty TEXT NOT NULL DEFAULT 'NOT_DISPATCHED' CHECK(delivery_certainty IN ('NOT_DISPATCHED', 'DELIVERED', 'NOT_DELIVERED', 'UNKNOWN')),
    status TEXT NOT NULL CHECK(status IN ('allocated', 'succeeded', 'failed', 'delivery-unknown')),
    allocated_at TEXT NOT NULL,
    completed_at TEXT,
    output_digest TEXT,
    error_code TEXT
  ) STRICT;
  CREATE TABLE IF NOT EXISTS quarantined_receipts (
    receipt_id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL,
    attempt_id TEXT NOT NULL,
    call_id TEXT NOT NULL,
    generation INTEGER NOT NULL,
    reason TEXT NOT NULL,
    body_json TEXT NOT NULL,
    received_at TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS resource_leases (
    lease_id TEXT PRIMARY KEY,
    resource TEXT NOT NULL,
    attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
    action_id TEXT NOT NULL REFERENCES actions(action_id),
    execution_id TEXT NOT NULL REFERENCES executions(execution_id),
    generation INTEGER NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('exclusive')),
    status TEXT NOT NULL CHECK(status IN ('active', 'released', 'cancelled', 'fenced', 'expired')),
    acquired_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    released_at TEXT
  ) STRICT;
  CREATE UNIQUE INDEX IF NOT EXISTS resource_leases_active_resource_idx
    ON resource_leases(resource) WHERE status = 'active';
  CREATE INDEX IF NOT EXISTS resource_leases_attempt_idx
    ON resource_leases(attempt_id, status);
  CREATE TABLE IF NOT EXISTS questions (
    question_id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL UNIQUE REFERENCES actions(action_id),
    execution_id TEXT NOT NULL REFERENCES executions(execution_id),
    eligible_actor_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    options_json TEXT NOT NULL,
    allow_free_text INTEGER NOT NULL CHECK(allow_free_text IN (0, 1)),
    status TEXT NOT NULL CHECK(status IN ('pending', 'answered', 'cancelled')),
    answer TEXT,
    asked_at TEXT NOT NULL,
    answered_at TEXT,
    answer_command_id TEXT
  ) STRICT;
  CREATE INDEX IF NOT EXISTS questions_status_idx ON questions(status, asked_at);
  CREATE TABLE IF NOT EXISTS workflow_instances (
    instance_id TEXT PRIMARY KEY,
    source_event_id TEXT NOT NULL UNIQUE REFERENCES events(event_id),
    workflow_name TEXT NOT NULL,
    contribution_id TEXT NOT NULL,
    contribution_version TEXT NOT NULL,
    plugin_id TEXT NOT NULL,
    execution_id TEXT NOT NULL UNIQUE REFERENCES executions(execution_id),
    parent_instance_id TEXT REFERENCES workflow_instances(instance_id),
    child_key TEXT,
    depth INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('running', 'completion-requested', 'completed', 'failed', 'cancelled')),
    input_json TEXT NOT NULL,
    state_json TEXT NOT NULL,
    capability_ceiling_json TEXT NOT NULL,
    step_count INTEGER NOT NULL,
    no_progress_count INTEGER NOT NULL,
    action_count INTEGER NOT NULL,
    child_count INTEGER NOT NULL,
    max_steps INTEGER NOT NULL,
    max_no_progress INTEGER NOT NULL,
    max_actions INTEGER NOT NULL,
    max_children INTEGER NOT NULL,
    max_delegation_depth INTEGER NOT NULL,
    last_progress_key TEXT,
    error_code TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(parent_instance_id, child_key)
  ) STRICT;
  CREATE INDEX IF NOT EXISTS workflow_instances_status_idx ON workflow_instances(status, instance_id);
  CREATE TABLE IF NOT EXISTS workflow_steps (
    instance_id TEXT NOT NULL REFERENCES workflow_instances(instance_id),
    step_number INTEGER NOT NULL,
    from_state_json TEXT NOT NULL,
    to_state_json TEXT NOT NULL,
    progress_key TEXT NOT NULL,
    transition_digest TEXT NOT NULL,
    committed_at TEXT NOT NULL,
    PRIMARY KEY(instance_id, step_number)
  ) STRICT;
  CREATE TABLE IF NOT EXISTS execution_ancestry (
    ancestor_execution_id TEXT NOT NULL REFERENCES executions(execution_id),
    descendant_execution_id TEXT NOT NULL REFERENCES executions(execution_id),
    depth INTEGER NOT NULL,
    PRIMARY KEY(ancestor_execution_id, descendant_execution_id)
  ) STRICT;
  CREATE INDEX IF NOT EXISTS execution_ancestry_descendant_idx ON execution_ancestry(descendant_execution_id, ancestor_execution_id);
  CREATE TABLE IF NOT EXISTS delegation_groups (
    delegation_group_id TEXT PRIMARY KEY,
    root_execution_id TEXT NOT NULL REFERENCES executions(execution_id),
    parent_execution_id TEXT NOT NULL REFERENCES executions(execution_id),
    parent_provider_action_id TEXT NOT NULL REFERENCES actions(action_id),
    expected_children INTEGER NOT NULL CHECK(expected_children BETWEEN 1 AND 2),
    status TEXT NOT NULL CHECK(status IN ('allocated', 'ready', 'delivered')),
    result_digest TEXT,
    allocated_at TEXT NOT NULL,
    ready_at TEXT,
    delivered_at TEXT
  ) STRICT;
  CREATE TABLE IF NOT EXISTS agent_sessions (
    agent_session_id TEXT PRIMARY KEY,
    root_execution_id TEXT NOT NULL REFERENCES executions(execution_id),
    parent_execution_id TEXT NOT NULL REFERENCES executions(execution_id),
    agent_id TEXT NOT NULL,
    agent_version TEXT NOT NULL,
    depth INTEGER NOT NULL CHECK(depth BETWEEN 1 AND 3),
    revision INTEGER NOT NULL,
    capability_ceiling_json TEXT NOT NULL,
    tool_ceiling_json TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('busy', 'idle')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS agent_runs (
    agent_run_id TEXT PRIMARY KEY,
    agent_session_id TEXT NOT NULL REFERENCES agent_sessions(agent_session_id),
    delegation_group_id TEXT NOT NULL REFERENCES delegation_groups(delegation_group_id),
    ordinal INTEGER NOT NULL,
    child_execution_id TEXT NOT NULL UNIQUE REFERENCES executions(execution_id),
    delegation_action_id TEXT NOT NULL UNIQUE REFERENCES actions(action_id),
    provider_action_id TEXT NOT NULL UNIQUE REFERENCES actions(action_id),
    model_tool_call_id TEXT NOT NULL,
    task_json TEXT NOT NULL,
    budget_json TEXT NOT NULL,
    resource_claims_json TEXT NOT NULL,
    catalog_digest TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('allocated', 'running', 'completed', 'failed', 'cancelled', 'delivery-unknown')),
    terminal_result_json TEXT,
    terminal_digest TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(delegation_group_id, ordinal),
    UNIQUE(delegation_group_id, model_tool_call_id)
  ) STRICT;
  CREATE INDEX IF NOT EXISTS agent_runs_status_idx ON agent_runs(status, agent_run_id);
  CREATE TABLE IF NOT EXISTS agent_session_messages (
    agent_session_id TEXT NOT NULL REFERENCES agent_sessions(agent_session_id),
    ordinal INTEGER NOT NULL,
    revision INTEGER NOT NULL,
    agent_run_id TEXT NOT NULL REFERENCES agent_runs(agent_run_id),
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(agent_session_id, ordinal)
  ) STRICT;
  CREATE INDEX IF NOT EXISTS agent_session_messages_revision_idx ON agent_session_messages(agent_session_id, revision, ordinal);
  CREATE TRIGGER IF NOT EXISTS workflow_steps_no_update BEFORE UPDATE ON workflow_steps BEGIN
    SELECT RAISE(ABORT, 'WORKFLOW_STEP_IMMUTABLE');
  END;
  CREATE TRIGGER IF NOT EXISTS workflow_steps_no_delete BEFORE DELETE ON workflow_steps BEGIN
    SELECT RAISE(ABORT, 'WORKFLOW_STEP_IMMUTABLE');
  END;
  CREATE TRIGGER IF NOT EXISTS attempt_snapshot_immutable
  BEFORE UPDATE ON attempts
  WHEN OLD.action_id != NEW.action_id
    OR OLD.execution_id != NEW.execution_id
    OR OLD.generation != NEW.generation
    OR OLD.snapshot_digest != NEW.snapshot_digest
    OR OLD.snapshot_json != NEW.snapshot_json
    OR OLD.catalog_digest != NEW.catalog_digest
  BEGIN
    SELECT RAISE(ABORT, 'ATTEMPT_SNAPSHOT_IMMUTABLE');
  END;
  CREATE TRIGGER IF NOT EXISTS tool_call_snapshot_immutable
  BEFORE UPDATE ON tool_calls
  WHEN OLD.action_id != NEW.action_id
    OR OLD.attempt_id != NEW.attempt_id
    OR OLD.generation != NEW.generation
    OR OLD.tool_name != NEW.tool_name
    OR OLD.tool_version != NEW.tool_version
    OR OLD.model_tool_call_id != NEW.model_tool_call_id
    OR OLD.request_digest != NEW.request_digest
    OR OLD.catalog_digest != NEW.catalog_digest
  BEGIN
    SELECT RAISE(ABORT, 'TOOL_CALL_SNAPSHOT_IMMUTABLE');
  END;
`;
