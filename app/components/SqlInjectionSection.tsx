// SQL injection component

import { useState } from "react";
import { useFetcher } from "react-router";
import type { ActionData } from "../lib/types";
import { SectionCard } from "./SectionCard";

const EXAMPLES = [
  { label: "Običan unos", value: "Željka" },
  { label: "Tautologija", value: "' OR 1=1 --" },
  { label: "UNION upit", value: "' UNION SELECT id, username, iban, balance FROM users --" },
  { label: "Ilegalan upit", value: "' ORDER BY 9 --" },
];

export function SqlInjectionSection({ enabled }: { enabled: boolean }) {
  const fetcher = useFetcher<ActionData>();
  const [q, setQ] = useState("Željka");
  const result = fetcher.data?.intent === "sqli-search" ? fetcher.data.search : null;
  const columns = result?.rows[0] ? Object.keys(result.rows[0]) : [];

  return (
    // main card
    <SectionCard
      title="1. SQL umetanje (SQL Injection)"
      switchName="sqli"
      enabled={enabled}
      instructions={
        <>
          <p>
            <strong className="not-italic">Upute:</strong> imenik korisnika banke prikazuje samo javne korisnike u
            četiri stupca. Kad je ranjivost uključena, upit se gradi konkatenacijom pa se unos izvršava kao dio SQL-a.
            Pruženi su gumbi s primjerima za <strong>običan unos</strong>, <strong>tautologiju</strong> (prikazuje
            skrivenog 'admin' korisnika), <strong>UNION upit</strong> (prikazuje stupce s podatcima koje imenik ne bi
            trebao prikazati; IBAN i stanje računa pojavljuju se pod stupcima 'full_name' i 'email'), te <strong>ilegalan
            upit</strong> (prikazana pogreška otkriva da originalni upit ima četiri stupca, što napadač može koristiti za
            UNION). Kad je ranjivost isključena, upit je parametriziran, a unos se validira, pa isti unosi postaju samo
            tekst za pretragu.
          </p>
        </>
      }
    >
      
      {/* example buttons */}
      <div className="mb-2 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => setQ(ex.value)}
            className="rounded border border-gray-700 px-2 py-1 text-xs hover:bg-gray-800"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* search form */}
      <fetcher.Form method="post" className="flex gap-2">
        <input type="hidden" name="intent" value="sqli-search" />
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Ime i prezime"
          className="flex-1 rounded border border-gray-700 px-3 py-2 font-mono text-sm bg-gray-950"
        />
        <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" type="submit">
          Pretraži
        </button>
      </fetcher.Form>

      {result && (
        <div className="mt-4 space-y-3 text-sm">
          {/* query info */}
          <div>
            <div className="font-medium">Izvršeni SQL upit ({result.mode === "vulnerable" ? "konkatenacija" : "parametrizirani upit"}):</div>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all rounded bg-gray-800 p-2 font-mono text-xs">
              {result.sql}
            </pre>
            {result.params.length > 0 && (
              <div className="mt-1 text-xs">
                Parametar upita: <strong className="font-mono">{JSON.stringify(result.params)}</strong>
              </div>
            )}
          </div>

          {/* query error */}
          {result.error && (
            <div className="rounded border p-2 border-red-900 bg-red-950 text-red-300">
              <strong>Pogreška:</strong> {result.error}
            </div>
          )}

          {/* query results */}
          {!result.error && (
            <div>
              <div className="font-medium">Rezultati:</div>
              {result.rows.length === 0 ? (
                <p className="mt-1 text-gray-400">Nema rezultata.</p>
              ) : (
                <div className="mt-1 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-700">
                        {columns.map((c) => (
                          <th key={c} className="px-2 py-1">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i} className="border-b border-gray-800">
                          {columns.map((c) => (
                            <td key={c} className="px-2 py-1 font-mono break-all">
                              {String(row[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
