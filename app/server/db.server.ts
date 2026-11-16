// in-memory SQLite DB seeding and interaction

import { DatabaseSync } from "node:sqlite";

let instance: DatabaseSync | undefined;

export function getDb(): DatabaseSync {
  if (!instance) {
    instance = new DatabaseSync(":memory:");
    seed(instance);
  }
  return instance;
}

export function resetDatabase(): void {
  const db = getDb();
  db.exec("DROP TABLE IF EXISTS request_log; DROP TABLE IF EXISTS transfers; DROP TABLE IF EXISTS users;");
  seed(db);
}

function seed(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE users (
      id            INTEGER PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      full_name     TEXT NOT NULL,
      email         TEXT NOT NULL,
      iban          TEXT NOT NULL,
      is_public     INTEGER NOT NULL DEFAULT 1,
      balance       INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE transfers (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user    INTEGER NOT NULL REFERENCES users(id),
      to_user      INTEGER NOT NULL REFERENCES users(id),
      amount       INTEGER NOT NULL,
      created_at   TEXT NOT NULL
    );
    CREATE TABLE request_log (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      at        TEXT NOT NULL,
      method    TEXT NOT NULL,
      user      TEXT,
      outcome   TEXT NOT NULL,
      detail    TEXT NOT NULL,
      referer   TEXT
    );
  `);

  const insert = db.prepare(
    `INSERT INTO users (id, username, full_name, email, iban, is_public, balance)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const users: [number, string, string, string, string, number, number][] = [
    [1, "zeljka", "Željka Žrtvić", "zeljka@banka.test", "HR1234567890987654321", 1, 1000],
    [2, "niko", "Niko Novčić", "niko@banka.test", "HR0112233445566778899", 1, 500],
    [3, "kruno", "Kruno Kradić", "kruno@banka.test", "HR9876543210123456789", 1, 0],
    [4, "admin", "Administrator", "admin@banka.test", "HR0000000000000000000", 0, 1000000],
  ];
  for (const [id, username, fullName, email, iban, isPublic, balance] of users) {
    insert.run(id, username, fullName, email, iban, isPublic, balance);
  }
}
