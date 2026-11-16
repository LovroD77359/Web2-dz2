// CSRF section component

import { useState, type FormEvent } from "react";
import { useFetcher, useRevalidator } from "react-router";
import type { ActionData, HomeLoaderData, TransferResponse } from "../lib/types";
import { SectionCard } from "./SectionCard";

type Variant = "post" | "get";

export function CsrfSection({ data }: { data: HomeLoaderData }) {
  const { settings, user, csrfToken, transfers, requestLog } = data;
  const revalidator = useRevalidator();
  const loginFetcher = useFetcher<ActionData>();
  const logoutFetcher = useFetcher<ActionData>();

  const [transferMsg, setTransferMsg] = useState<TransferResponse | null>(null);
  const [variant, setVariant] = useState<Variant>("post");
  const [amount, setAmount] = useState("250");
  const [attackSrc, setAttackSrc] = useState<string | null>(null);

  // legitimate transfer - includes hidden CSRF token
  async function onTransfer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const res = await fetch("/transfer", { method: "POST", body: new URLSearchParams(fields) });
    setTransferMsg((await res.json()) as TransferResponse);
    revalidator.revalidate();
  }

  // "malicious link" open - updates state, which (re)renders iframe with attackers page
  function openMaliciousLink() {
    setAttackSrc(`/attacker?variant=${variant}&to=kruno&amount=${encodeURIComponent(amount)}&t=${Date.now()}`);
  }

  return (
    // main card
    <SectionCard
      title="2. Lažiranje zahtjeva na drugom sjedištu (CSRF)"
      switchName="csrf"
      enabled={settings.csrfVulnerable}
      instructions={
        <>
          <p>
            <strong className="not-italic">Upute:</strong> Prvo se <strong>prijavljujete kao žrtva</strong> (Željka, stanje
            1000 €) u odjeljku 1), lijevo. Zatim, u odjeljku 2), desno, preko poveznice u lažiranom "e-mailu" <strong>
            otvarate zlonamjernu stranicu napadača</strong>, koja potajno u pozadini šalje zahtjev za prijenos novca prema
            banci. Pritom možete odabrati vrstu zahtjeva (GET preko &lt;img&gt; elementa ili POST preko &lt;form&gt;), te
            iznos. Preglednik će sam dodati <strong>žrtvin kolačić sesije</strong>. Kad je ranjivost uključena, prijenos će
            uspjeti, što je vidljivo na stranici banke žrtve, te u dnevniku zahtjeva ispod. Kad je ranjivost isključena,
            banka prihvaća samo POST zahtjeve s CSRF token, pa prijenos ne uspijeva.
          </p>
          <p>
            Napomena: napadačeva se "stranica" ovdje poslužuje s istog poslužitelja, jer bi za suprotno bila potrebna zasebna
            aplikacija, no mehanizam napada ostaje isti.
          </p>
        </>
      }
    >
      <div className="grid gap-4 grid-cols-2">
        {/* left section - victims bank site */}
        <div className="rounded-lg border border-gray-800 p-4">
          <h3 className="mb-2 font-semibold">1) Stranica banke žrtve (login)</h3>
          {!user ? (
            <loginFetcher.Form method="post" className="space-y-2 text-sm">
              <input type="hidden" name="intent" value="login" />
              <p>Niste prijavljeni.</p>
              <button type="submit" className={btnCls}>
                Prijavi se kao Željka (žrtva)
              </button>
            </loginFetcher.Form>
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                Prijavljeni ste kao <strong>{user.username}</strong>. Stanje računa: <strong>{user.balance} €</strong>
              </p>
              <form onSubmit={onTransfer} className="space-y-2">
                <input type="hidden" name="to" value="niko" />
                <input name="amount" type="number" min={1} defaultValue={50} aria-label="Iznos u eurima" className={inputCls} />
                {/* hidden CSRF token */}
                <input type="hidden" name="csrf_token" value={csrfToken} />
                <button type="submit" className={btnCls}>
                  Pošalji novac korisniku Niko
                </button>
              </form>
              <span className="text-xs text-gray-400">
                Skriveni CSRF token u obrascu: <strong>{csrfToken.slice(0, 8)}…</strong>{" "}
                {settings.csrfVulnerable ? "(poslužitelj ga ignorira)" : "(poslužitelj ga provjerava)"}
              </span>
              {transferMsg && (
                <p className={transferMsg.ok ? "text-green-400" : "text-red-400"}>{transferMsg.message}</p>
              )}
              <logoutFetcher.Form method="post">
                <input type="hidden" name="intent" value="logout" />
                <button type="submit" className="text-s mb-2 text-blue-400 underline">
                  Odjava
                </button>
              </logoutFetcher.Form>
              <div>
                <h4 className="mb-1 font-semibold">Prijenosi prijavljenog korisnika</h4>
                {transfers.length === 0 ? (
                  <p className="text-gray-400">Nema prijenosa.</p>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-1">Od</th>
                        <th>Prema</th>
                        <th>Iznos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((t) => (
                        <tr key={t.id} className="border-b border-gray-800">
                          <td className="py-1">{t.fromUser}</td>
                          <td>{t.toUser}</td>
                          <td>{t.amount} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* right section - malicious email and attackers site */}
        <div className="rounded-lg border border-red-900 p-4">
          <h3 className="mb-2 font-semibold">2) E-mail napadača i zlonamjerna stranica</h3>
          <div className="space-y-2 rounded border border-gray-800 bg-gray-950 p-3 text-sm">
            <div className="text-xs text-gray-400">Od: nagrade@promo.akcija | Predmet: Osvojili ste 500 €!</div>
            <p>Kliknite na poveznicu i preuzmite svoju nagradu…</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label>
                Tip zahtjeva:{" "}
                <select value={variant} onChange={(e) => setVariant(e.target.value as Variant)} className="rounded border px-1 py-0.5 bg-gray-950">
                  <option value="post">POST (skriveni obrazac)</option>
                  <option value="get">GET (nevidljiva slika)</option>
                </select>
              </label>
              <label>
                Iznos (€):{" "}
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-20 rounded border px-1 py-0.5 bg-gray-950"
                />
              </label>
            </div>
            <button type="button" onClick={openMaliciousLink} className="text-blue-400 underline">
              Preuzmi nagradu (žrtva klikne poveznicu)
            </button>
          </div>
          {attackSrc && (
            <div className="mt-3">
              <div className="mb-1 text-xs text-gray-400">Zlonamjerna stranica koju je žrtva otvorila:</div>
              <iframe
                key={attackSrc}
                src={attackSrc}
                title="Zlonamjerna stranica"
                className="h-40 w-full rounded border border-gray-700"
                onLoad={() => revalidator.revalidate()}
              />
              <button type="button" onClick={() => revalidator.revalidate()} className="mt-1 text-xs underline">
                Osvježi stanje (fallback)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* request log */}
      <div className="mt-4 text-xs">
        <h4 className="mb-1 font-semibold">Dnevnik zahtjeva prema /transfer (poslužitelj)</h4>
        {requestLog.length === 0 ? (
          <p className="text-gray-400">Još nema zahtjeva.</p>
        ) : (
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-1">Vrijeme (UTC)</th>
                <th>Metoda</th>
                <th>Korisnik</th>
                <th className="w-xl">Ishod</th>
              </tr>
            </thead>
            <tbody>
              {requestLog.map((l) => (
                <tr key={l.id} className="border-b border-gray-800 align-top">
                  <td className="py-1">{l.at.slice(11, 19)}</td>
                  <td>{l.method}</td>
                  <td>{l.user ?? "—"}</td>
                  <td>
                    <span className={l.outcome === "ACCEPTED" ? "font-semibold text-green-400" : "font-semibold text-red-400"}>
                      {l.outcome === "ACCEPTED" ? "IZVRŠENO" : "ODBIJENO"}
                    </span>
                    <div className="text-gray-400">{l.detail}</div>
                    <div className="text-gray-500">
                      Referer: {l.referer ? new URL(l.referer, "http://x").pathname + new URL(l.referer, "http://x").search : "—"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </SectionCard>
  );
}

const inputCls = "w-full rounded border border-gray-700 px-3 py-2 text-sm bg-gray-950";
const btnCls = "rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700";