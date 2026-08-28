export type Face = "desktop" | "serve" | "import" | "save" | "load" | "usage" | "usage-error";

export const USAGE = `Crafty — local visual design surface

Usage:
  crafty                    Open the design surface in your browser (desktop face)
  crafty serve [--port N]   Host the surface over HTTPS for other devices (iPad)
  crafty serve --http [--port N]  Host over plain HTTP for a reverse proxy (Dokploy/Traefik)
  crafty import <file.pen>  Import a pen.dev .pen document into the current scene
  crafty save <slug> [dir.ui]    Copy the slug's .ui package out of the store
  crafty load <slug> [dir.ui]    Copy a .ui package into the store as <slug>
  crafty --help             Show this help
`;

export const defaultPort = 4173;

export const resolveFace = (argv: string[]): { face: Face; args: string[] } => {
  const [command] = argv;
  if (command === undefined) return { face: "desktop", args: [] };
  if (command === "--help" || command === "-h") return { face: "usage", args: [] };
  if (command === "serve") return { face: "serve", args: argv.slice(1) };
  if (command === "import") return { face: "import", args: argv.slice(1) };
  if (command === "save") return { face: "save", args: argv.slice(1) };
  if (command === "load") return { face: "load", args: argv.slice(1) };
  if (command === "--port" || command.startsWith("--port=")) return { face: "desktop", args: argv };
  return { face: "usage-error", args: [] };
};

export const parsePort = (args: string[], fallback: number = defaultPort): number | undefined => {
  const flagIndex = args.indexOf("--port");
  if (flagIndex >= 0) {
    const value = Number(args[flagIndex + 1]);
    return Number.isInteger(value) && value > 0 && value <= 65535 ? value : undefined;
  }
  const equals = args.find((arg) => arg.startsWith("--port="));
  if (equals !== undefined) {
    const value = Number(equals.slice("--port=".length));
    return Number.isInteger(value) && value > 0 && value <= 65535 ? value : undefined;
  }
  return fallback;
};

export const hasHttpFlag = (args: string[]): boolean => args.includes("--http");
