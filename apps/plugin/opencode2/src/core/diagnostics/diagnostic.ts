export interface Diagnostic {
  readonly code: string;
  readonly path?: string;
}

export class DiagnosticError extends Error {
  readonly code: string;
  readonly path?: string;

  constructor(code: string, path?: string) {
    super(code);
    this.name = "DiagnosticError";
    this.code = code;
    if (path !== undefined) this.path = path;
  }
}
