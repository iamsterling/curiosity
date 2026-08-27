export const primaryRoleIds = ["generalist", "orchestrator"] as const;
export const subagentRoleIds = [
  "analyst",
  "implementer",
  "researcher",
  "reviewer",
  "strategist",
  "worker",
] as const;

export type PrimaryRoleId = (typeof primaryRoleIds)[number];
export type SubagentRoleId = (typeof subagentRoleIds)[number];

export interface RolePolicyConfig {
  readonly defaultPrimaryRole: PrimaryRoleId;
  readonly enabledPrimaryRoles: readonly PrimaryRoleId[];
  readonly enabledSubagentRoles: readonly SubagentRoleId[];
  readonly maximumConcurrentChildren: 1 | 2;
  readonly maximumDelegationDepth: 0 | 1;
  readonly schemaVersion: 1;
}

export const defaultRolePolicy: RolePolicyConfig = Object.freeze({
  defaultPrimaryRole: "generalist",
  enabledPrimaryRoles: Object.freeze([...primaryRoleIds]),
  enabledSubagentRoles: Object.freeze([...subagentRoleIds]),
  maximumConcurrentChildren: 2,
  maximumDelegationDepth: 1,
  schemaVersion: 1,
});

export const enabledRoleIds = (
  policy: RolePolicyConfig,
): ReadonlySet<string> =>
  new Set([...policy.enabledPrimaryRoles, ...policy.enabledSubagentRoles]);

export const validateRolePolicy = (policy: RolePolicyConfig): void => {
  if (
    Object.keys(policy).sort().join(",") !==
      [
        "defaultPrimaryRole",
        "enabledPrimaryRoles",
        "enabledSubagentRoles",
        "maximumConcurrentChildren",
        "maximumDelegationDepth",
        "schemaVersion",
      ]
        .sort()
        .join(",") ||
    policy.schemaVersion !== 1 ||
    !Array.isArray(policy.enabledPrimaryRoles) ||
    policy.enabledPrimaryRoles.length < 1 ||
    new Set(policy.enabledPrimaryRoles).size !==
      policy.enabledPrimaryRoles.length ||
    policy.enabledPrimaryRoles.some(
      (role) => !primaryRoleIds.includes(role),
    ) ||
    !policy.enabledPrimaryRoles.includes(policy.defaultPrimaryRole) ||
    !Array.isArray(policy.enabledSubagentRoles) ||
    new Set(policy.enabledSubagentRoles).size !==
      policy.enabledSubagentRoles.length ||
    policy.enabledSubagentRoles.some(
      (role) => !subagentRoleIds.includes(role),
    ) ||
    ![1, 2].includes(policy.maximumConcurrentChildren) ||
    ![0, 1].includes(policy.maximumDelegationDepth)
  )
    throw new Error("ROLE_POLICY_INVALID");
};
