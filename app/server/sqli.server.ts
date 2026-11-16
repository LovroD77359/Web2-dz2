// SQL injection feature logic

import type { DatabaseSync } from "node:sqlite";
import type { SearchResult } from "../lib/types";

// exported search which branches into vulnerable and protected version
export function searchUsers(db: DatabaseSync, term: unknown, vulnerable: boolean): SearchResult {
  return vulnerable ? searchVulnerable(db, term) : searchSecure(db, term);
}

// vulnerable version - uses simple concatenation, shows db error to user
function searchVulnerable(db: DatabaseSync, term: unknown): SearchResult {
  const input = String(term ?? "");
  const sql = `SELECT id, username, full_name, email FROM users WHERE is_public = 1 AND full_name LIKE '%${input}%'`;
  try {
    const rows = db.prepare(sql).all().map((r) => ({ ...r })) as SearchResult["rows"];
    return { mode: "vulnerable", sql, params: [], rows, error: null };
  } catch (e) {
    return { mode: "vulnerable", sql, params: [], rows: [], error: e instanceof Error ? e.message : String(e) };
  }
}

// protected version - validates + parameterizes, shows generic error
const SECURE_SQL = "SELECT id, username, full_name, email FROM users WHERE is_public = 1 AND full_name LIKE ?";
function searchSecure(db: DatabaseSync, term: unknown): SearchResult {
  if (typeof term !== "string" || term.length > 100) {
    return { mode: "secure", sql: SECURE_SQL, params: [], rows: [], error: "Neispravan unos; mora biti tekst do 100 znakova." };
  }
  const params = [`%${term}%`];
  try {
    const rows = db.prepare(SECURE_SQL).all(...params).map((r) => ({ ...r })) as SearchResult["rows"];
    return { mode: "secure", sql: SECURE_SQL, params, rows, error: null };
  } catch {
    return { mode: "secure", sql: SECURE_SQL, params, rows: [], error: "Došlo je do pogreške." };
  }
}
