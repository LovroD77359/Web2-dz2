// shared card component for vulnerability sections

import type { ReactNode } from "react";
import { useFetcher } from "react-router";

export function SectionCard(props: {
  title: string;
  switchName: "sqli" | "csrf";
  enabled: boolean;
  instructions: ReactNode;
  children: ReactNode;
}) {
  const fetcher = useFetcher();
  const pending = fetcher.formData?.get("enabled");
  const enabled = pending !== undefined && pending !== null ? pending === "true" : props.enabled;

    return (
    <section className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm">
      <h2 className="text-xl font-semibold">{props.title}</h2>
      <div className="mt-2 space-y-2 text-sm italic text-gray-400">{props.instructions}</div>

      <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-sm font-medium">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={enabled}
          onChange={(e) =>
            fetcher.submit(
              { intent: "set-vulnerability", name: props.switchName, enabled: String(e.target.checked) },
              { method: "post" },
            )
          }
        />
        Ranjivost
        <span
          className={`rounded px-2 py-0.5 text-xs ${enabled ? "bg-red-900 text-red-200" : "bg-green-900 text-green-200"}`}
        >
          {enabled ? "RANJIVO" : "ZAŠTIĆENO"}
        </span>
      </label>

      <div className="mt-4">{props.children}</div>
    </section>
  );
}
