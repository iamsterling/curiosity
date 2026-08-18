export class EvidenceDiagnostic extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "EvidenceDiagnostic";
    this.code = code;
  }
}

export const fail = (code: string): never => {
  throw new EvidenceDiagnostic(code);
};
