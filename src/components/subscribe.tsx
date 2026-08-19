"use client";

import { useState } from "react";
import { useT } from "./locale-provider";

type State = "idle" | "sending" | "done" | "error";

export function Subscribe() {
  const [state, setState] = useState<State>("idle");
  const t = useT();
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        setState("done");
        setMessage(data.message ?? "You're on the list.");
      } else {
        setState("error");
        setMessage(data.message ?? "That didn't work. Try again in a moment.");
      }
    } catch {
      setState("error");
      setMessage("Network trouble. Try again in a moment.");
    }
  }

  return (
    <section className="mx-auto mt-32 max-w-[84rem] px-6 md:px-10">
      <div className="border border-ink bg-paper-raised">
        <div className="ticks" />
        <div className="grid gap-x-16 gap-y-8 p-8 md:grid-cols-[minmax(0,34rem)_minmax(0,26rem)] md:p-12">
          <div>
            <h2 className="display text-[clamp(1.9rem,4vw,2.9rem)] leading-none">
              {t("sub.title")}
            </h2>
            <p className="mt-5 max-w-[46ch] text-ink-muted">{t("sub.body")}</p>
          </div>

          <div className="self-center">
            {state === "done" ? (
              <p className="border-l-2 border-imagine pl-4 text-ink">{message}</p>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-3">
                <label htmlFor="email" className="label">
                  {t("sub.email")}
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@somewhere.edu"
                    className="min-w-0 flex-1 border border-rule-strong bg-paper px-4 py-3 font-mono text-sm text-ink transition-colors placeholder:text-ink-faint focus:border-imagine"
                  />
                  <button
                    type="submit"
                    disabled={state === "sending"}
                    className="border border-ink bg-ink px-6 py-3 text-paper transition-colors hover:border-imagine hover:bg-imagine disabled:opacity-50"
                  >
                    <span className="label !text-paper">
                      {state === "sending" ? t("sub.sending") : t("sub.subscribe")}
                    </span>
                  </button>
                </div>
                {state === "error" && (
                  <p className="font-mono text-[0.78rem] leading-relaxed text-imagine">
                    {message}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
