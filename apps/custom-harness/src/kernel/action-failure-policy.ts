const workspaceMutationActions = new Set([
  "workspace.delete",
  "workspace.patch",
  "workspace.write",
]);

const gitMutationActions = new Set([
  "git.ref.update",
  "git.worktree.create",
  "git.worktree.remove",
]);

const workspaceMutationFailureDefinitelyNotApplied = new Set([
  "WORKSPACE_FILE_NOT_UTF8",
  "WORKSPACE_MUTATION_DELETE_FAILED",
  "WORKSPACE_MUTATION_INVALID",
  "WORKSPACE_MUTATION_RENAME_FAILED",
  "WORKSPACE_MUTATION_TEMP_CONFLICT",
  "WORKSPACE_MUTATION_TOO_LARGE",
  "WORKSPACE_MUTATION_WRITE_FAILED",
  "WORKSPACE_PATCH_OCCURRENCE_MISMATCH",
  "WORKSPACE_PATH_INVALID",
  "WORKSPACE_PATH_UNSAFE",
  "WORKSPACE_PRECONDITION_FAILED",
  "WORKSPACE_PRECONDITION_REQUIRED",
]);

const gitMutationFailureDefinitelyNotApplied = new Set([
  "GIT_CLEAN_PRECONDITION_FAILED",
  "GIT_CLEAN_PRECONDITION_REQUIRED",
  "GIT_EXECUTABLE_DIGEST_MISMATCH",
  "GIT_HEAD_PRECONDITION_FAILED",
  "GIT_OUTPUT_LIMIT_DENIED",
  "GIT_REF_NAME_DENIED",
  "GIT_REF_PRECONDITION_FAILED",
  "GIT_REF_TARGET_INVALID",
  "GIT_WORKTREE_ABSENT",
  "GIT_WORKTREE_ALREADY_EXISTS",
  "GIT_WORKTREE_ID_INVALID",
  "GIT_WORKTREE_UNAVAILABLE",
]);

const agentRecoverableActions = new Set([
  "fetch.web",
  "git.diff",
  "git.ref.inspect",
  "git.status",
  "git.worktree.inspect",
  "process.run",
  "question.ask",
  "search.web",
  "workspace.glob",
  "workspace.list",
  "workspace.read",
  "workspace.search",
]);

const terminalFailureCodes = new Set([
  "ACTION_CANCELLED",
  "ATTEMPT_AUTHORIZATION_DENIED",
  "ATTEMPT_DISPATCH_DENIED",
  "CAPABILITY_DENIED",
  "CHILD_AUTHORITY_DENIED",
  "ROLE_CAPABILITY_DENIED",
  "TOOL_RECEIPT_STALE",
  "WORKSPACE_ACTION_INPUT_INVALID",
  "WORKSPACE_RESOURCE_CLAIM_MISMATCH",
  "WORKSPACE_TOOL_PROPOSAL_INVALID",
  "WORKSPACE_TOOL_SNAPSHOT_INVALID",
  "GIT_RESOURCE_CLAIM_MISMATCH",
]);

export const mutationFailureDefinitelyNotApplied = (
  actionType: string,
  errorCode: string,
): boolean => {
  if (workspaceMutationActions.has(actionType))
    return workspaceMutationFailureDefinitelyNotApplied.has(errorCode);
  if (gitMutationActions.has(actionType))
    return gitMutationFailureDefinitelyNotApplied.has(errorCode);
  return false;
};

export const mutationFailureMayHaveApplied = (
  actionType: string,
  errorCode: string,
): boolean =>
  (workspaceMutationActions.has(actionType) ||
    gitMutationActions.has(actionType)) &&
  !mutationFailureDefinitelyNotApplied(actionType, errorCode);

export const actionFailureCanEnterAgentRecovery = (
  actionType: string,
  errorCode: string,
): boolean => {
  if (workspaceMutationActions.has(actionType) || gitMutationActions.has(actionType))
    return mutationFailureDefinitelyNotApplied(actionType, errorCode);
  if (!agentRecoverableActions.has(actionType)) return false;
  if (terminalFailureCodes.has(errorCode)) return false;
  return !errorCode.endsWith("_DELIVERY_UNKNOWN");
};
