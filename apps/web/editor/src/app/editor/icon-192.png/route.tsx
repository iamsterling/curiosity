import { renderPwaIcon } from "../pwa-icon";

export const dynamic = "force-static";

export function GET(): Response {
  return renderPwaIcon(192);
}
