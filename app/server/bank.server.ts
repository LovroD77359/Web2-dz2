// bank logic for CSRF feature

import type { DatabaseSync } from "node:sqlite";
import type { PublicUser, RequestLogRow, TransferRow } from "../lib/types";

// find user by id
export function findUser(db: DatabaseSync, id: number | undefined): PublicUser | null {
  if (id === undefined) return null;
  const row = db
    .prepare("SELECT id, username, full_name AS fullName, balance FROM users WHERE id = ?")
    .get(id);
  return row ? ({ ...row } as PublicUser) : null;
}

// list all transfers involving user with some id
export function listTransfers(db: DatabaseSync, userId: number): TransferRow[] {
  return db
    .prepare(
      `SELECT t.id, t.created_at AS createdAt, f.username AS fromUser, r.username AS toUser, t.amount
         FROM transfers t
         JOIN users f ON f.id = t.from_user
         JOIN users r ON r.id = t.to_user
        WHERE t.from_user = ? OR t.to_user = ?
        ORDER BY t.id DESC LIMIT 10`,
    )
    .all(userId, userId)
    .map((r) => ({ ...r })) as TransferRow[];
}

export type TransferOutcome = { ok: boolean; message: string };

// perform transfer of money from one user to another
export function performTransfer(db: DatabaseSync, fromId: number, toUsername: unknown, amountRaw: unknown): TransferOutcome {
  const amount = Number(amountRaw);
  if (!Number.isSafeInteger(amount) || amount < 1) {
    return { ok: false, message: "Iznos mora biti cijeli broj veći od 0." };
  }
  const to = db.prepare("SELECT id, username FROM users WHERE username = ?").get(String(toUsername)) as
    | { id: number; username: string }
    | undefined;
  if (!to) return { ok: false, message: "Primatelj ne postoji." };

  db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, fromId);
  db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, to.id);
  db.prepare("INSERT INTO transfers (from_user, to_user, amount, created_at) VALUES (?, ?, ?, ?)").run(
    fromId,
    to.id,
    amount,
    new Date().toISOString(),
  );
  return { ok: true, message: `Preneseno ${amount} € korisniku ${to.username}.` };
}

// update transfer request log
export function logRequest(
  db: DatabaseSync,
  entry: { method: string; user: string | null; outcome: "ACCEPTED" | "BLOCKED"; detail: string; referer: string | null },
): void {
  db.prepare("INSERT INTO request_log (at, method, user, outcome, detail, referer) VALUES (?, ?, ?, ?, ?, ?)").run(
    new Date().toISOString(),
    entry.method,
    entry.user,
    entry.outcome,
    entry.detail,
    entry.referer,
  );
}

// get request log
export function listRequestLog(db: DatabaseSync, limit = 10): RequestLogRow[] {
  return db
    .prepare("SELECT id, at, method, user, outcome, detail, referer FROM request_log ORDER BY id DESC LIMIT ?")
    .all(limit)
    .map((r) => ({ ...r })) as RequestLogRow[];
}