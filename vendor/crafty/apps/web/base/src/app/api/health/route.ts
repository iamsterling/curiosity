export const dynamic = "force-dynamic";

/**
 * The only route the base app owns. The serve face and the Dokploy
 * healthcheck probe this to decide whether the domain entry is up.
 */
export async function GET(): Promise<Response> {
  return Response.json({ status: "healthy", service: "crafty-base" });
}
