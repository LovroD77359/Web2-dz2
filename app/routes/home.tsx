// home page component

import { Form } from "react-router";
import type { Route } from "./+types/home";
import { CsrfSection } from "../components/CsrfSection";
import { SqlInjectionSection } from "../components/SqlInjectionSection";
import { homeAction, homeLoader } from "../server/home.server";

// GET and POST logic handled in home.server
export async function loader({ request }: Route.LoaderArgs) {
  return homeLoader(request);
}
export async function action({ request }: Route.ActionArgs) {
  return homeAction(request);
}

// exported component
export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Drugi projekt</h1>
        </div>
        <Form method="post">
          <input type="hidden" name="intent" value="reset" />
          <button className="rounded border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800">
            Resetiraj bazu podataka
          </button>
        </Form>
      </header>

      <SqlInjectionSection enabled={loaderData.settings.sqliVulnerable} />
      <CsrfSection data={loaderData} />
    </main>
  );
}
