// server side session init, reading and writing

import { createCookie, createMemorySessionStorage, type Session } from "react-router";
import { randomBytes } from "node:crypto";
import type { Settings } from "../lib/types";

export type SessionData = {
  userId: number;
  csrfToken: string;
  sqliVulnerable: boolean;
  csrfVulnerable: boolean;
};
export type AppSession = Session<SessionData>;

// create 8h session cookie
const storage = createMemorySessionStorage<SessionData>({
  cookie: createCookie("__session", {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 8,
    secure: true,
    // hardcoded "secret" for local - doesnt match actual secret on Render
    secrets: [process.env.SESSION_SECRET ?? "45f55ace40adc7c3945c095356871733beb520f276c1019a3d6c86d649a117ef"],
  }),
});

// read session/settings
export function readSession(request: Request): Promise<AppSession> {
  return storage.getSession(request.headers.get("Cookie"));
}
export function getSettings(session: AppSession): Settings {
  return {
    sqliVulnerable: session.get("sqliVulnerable") ?? true,
    csrfVulnerable: session.get("csrfVulnerable") ?? true,
  };
}

// session init; returns false if already initialized
export function initSession(session: AppSession): boolean {
  if (session.has("csrfToken")) return false;
  session.set("csrfToken", randomBytes(32).toString("base64url"));
  session.set("sqliVulnerable", true);
  session.set("csrfVulnerable", true);
  return true;
}

// commit write
export function commit(session: AppSession): Promise<string> {
  return storage.commitSession(session);
}
