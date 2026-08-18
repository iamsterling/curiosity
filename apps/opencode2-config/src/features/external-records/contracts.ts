export type ExternalRecordKind = "issue" | "private-security";
export interface GitHubRead {
  repository: string;
  marker: string;
}
export interface GitHubPreflight {
  repository: string;
  kind: ExternalRecordKind;
  intentRevision: number;
  privacy: string;
  rateLimitRemaining: number;
  approvalReference?: string;
}
export interface GitHubPlan {
  digest: string;
  marker: string;
  revision: number;
  title: string;
  body: string;
  kind: ExternalRecordKind;
}
export interface GitHubConfirmation {
  status: "confirmed" | "conflict";
  locator: string;
  digest: string;
}
export interface GitHubPort {
  read(input: GitHubRead): Promise<{ locator: string; body: string; digest: string } | undefined>;
  preflight(input: GitHubPreflight): Promise<{ allowed: boolean; code: string }>;
  write(plan: GitHubPlan): Promise<{ status: "written" | "ambiguous"; locator?: string }>;
  confirm(plan: GitHubPlan): Promise<GitHubConfirmation>;
}
