// types - shared by server and client

export type Settings = {
  sqliVulnerable: boolean;
  csrfVulnerable: boolean;
};

export type PublicUser = {
  id: number;
  username: string;
  fullName: string;
  balance: number;
};

export type TransferRow = {
  id: number;
  createdAt: string;
  fromUser: string;
  toUser: string;
  amount: number;
};

export type RequestLogRow = {
  id: number;
  at: string;
  method: string;
  user: string | null;
  outcome: "ACCEPTED" | "BLOCKED";
  detail: string;
  referer: string | null;
};

export type SearchResult = {
  mode: "vulnerable" | "secure";
  sql: string;
  params: string[];
  rows: Record<string, string | number | null>[];
  error: string | null;
};

export type HomeLoaderData = {
  settings: Settings;
  user: PublicUser | null;
  csrfToken: string;
  transfers: TransferRow[];
  requestLog: RequestLogRow[];
};

export type ActionData =
  | { intent: "sqli-search"; search: SearchResult }
  | { intent: "login" | "logout" | "reset" | "set-vulnerability" | "unknown"; ok: boolean };

export type TransferResponse = { ok: boolean; message: string };