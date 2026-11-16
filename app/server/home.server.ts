// loader and actions for home page (basics)

import { data } from "react-router";
import { findUser, listRequestLog, listTransfers } from "./bank.server";
import { getDb, resetDatabase } from "./db.server";
import { commit, getSettings, initSession, readSession } from "./session.server";
import { searchUsers } from "./sqli.server";
import type { ActionData, HomeLoaderData } from "../lib/types";

// home page loader - inits session, db, and gets other data
export async function homeLoader(request: Request) {
  const session = await readSession(request);
  const isNew = initSession(session);
  const db = getDb();
  const user = findUser(db, session.get("userId"));

  const payload: HomeLoaderData = {
    settings: getSettings(session),
    user,
    csrfToken: session.get("csrfToken")!,
    transfers: user ? listTransfers(db, user.id) : [],
    requestLog: listRequestLog(db, 10),
  };
  return data(payload, isNew ? { headers: { "Set-Cookie": await commit(session) } } : undefined);
}

// home page action(s) - mostly simple cookie updates, plus search and db reset
export async function homeAction(request: Request) {
  const form = await request.formData();
  const intent = form.get("intent");
  const session = await readSession(request);
  initSession(session);
  const db = getDb();

  switch (intent) {
    // update vulnerability setting for SQL injection / CSRF
    case "set-vulnerability": {
      const name = form.get("name");
      const enabled = form.get("enabled") === "true";
      if (name === "sqli") session.set("sqliVulnerable", enabled);
      else if (name === "csrf") session.set("csrfVulnerable", enabled);
      else return data<ActionData>({ intent: "set-vulnerability", ok: false }, { status: 400 });
      return data<ActionData>(
        { intent: "set-vulnerability", ok: true },
        { headers: { "Set-Cookie": await commit(session) } },
      );
    }

    // search bank users (SQL inj)
    case "sqli-search": {
      const search = searchUsers(db, form.get("q"), getSettings(session).sqliVulnerable);
      return data<ActionData>({ intent: "sqli-search", search });
    }

    // login/out victim (CSRF)
    case "login": {
      session.set("userId", 1);
      return data<ActionData>({ intent: "login", ok: true }, { headers: { "Set-Cookie": await commit(session) } });
    }
    case "logout": {
      session.unset("userId");
      return data<ActionData>({ intent: "logout", ok: true }, { headers: { "Set-Cookie": await commit(session) } });
    }

    // reset db
    case "reset": {
      resetDatabase();
      return data<ActionData>({ intent: "reset", ok: true });
    }

    // unknown intent
    default:
      return data<ActionData>({ intent: "unknown", ok: false }, { status: 400 });
  }
}
