// transfer endpoint - targeted by CSRF attack

import type { Route } from "./+types/transfer";
import { findUser, logRequest, performTransfer } from "../server/bank.server";
import { getDb } from "../server/db.server";
import { getSettings, readSession } from "../server/session.server";

type Ctx = Awaited<ReturnType<typeof getContext>>;

// gets context (session, db, vulnerability settings, user) - user comes from cookie
async function getContext(request: Request) {
  const session = await readSession(request);
  const db = getDb();
  return { session, db, settings: getSettings(session), user: findUser(db, session.get("userId")) };
}

// response helper that logs request
function respond(ctx: Ctx, request: Request, status: number, message: string, outcome: "ACCEPTED" | "BLOCKED", headers?: HeadersInit) {
  logRequest(ctx.db, {
    method: request.method,
    user: ctx.user?.username ?? null,
    outcome,
    detail: message,
    referer: request.headers.get("referer"),
  });
  return Response.json({ ok: outcome === "ACCEPTED", message }, { status, headers });
}

// performs transfer and responds
function execute(ctx: Ctx, request: Request, to: unknown, amount: unknown) {
  const result = performTransfer(ctx.db, ctx.user.id, to, amount);
  return respond(ctx, request, result.ok ? 200 : 400, result.message, result.ok ? "ACCEPTED" : "BLOCKED");
}

// GET /transfer?to=kruno&amount=X - handles CSRF attacks by GET
export async function loader({ request }: Route.LoaderArgs) {
  const ctx = await getContext(request);

  // if protected, the request is denied
  if (!ctx.settings.csrfVulnerable)
    return respond(ctx, request, 405, "Odbijeno: GET ne smije mijenjati stanje.", "BLOCKED", { Allow: "POST" });
  
  // if vulnerable, the request proceeds as normal
  if (!ctx.user) return respond(ctx, request, 401, "Korisnik nije prijavljen.", "BLOCKED");
  const url = new URL(request.url);
  return execute(ctx, request, url.searchParams.get("to"), url.searchParams.get("amount"));
}

// POST /transfer (body: to, amount, csrf_token) - handles legitimate transfers and CSRF attacks by POST
export async function action({ request }: Route.ActionArgs) {
  const ctx = await getContext(request);
  if (request.method !== "POST") return respond(ctx, request, 405, "Metoda nije dopuštena.", "BLOCKED", { Allow: "POST" });
  if (!ctx.user) return respond(ctx, request, 401, "Korisnik nije prijavljen.", "BLOCKED");
  const form = await request.formData();

  // if protected, the request requires a valid CSRF token
  if (!ctx.settings.csrfVulnerable && form.get("csrf_token") !== ctx.session.get("csrfToken"))
    return respond(ctx, request, 403, "Odbijeno: CSRF token nedostaje ili nije ispravan.", "BLOCKED");
  // if vulnerable, the request proceeds without token check
  
  return execute(ctx, request, form.get("to"), form.get("amount"));
}