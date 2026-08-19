import { NextResponse } from "next/server";

/**
 * Subscription intake.
 *
 * The storage seam is deliberately thin: point SUBSCRIBE_WEBHOOK_URL at
 * whichever list provider you end up on (Resend audiences, Buttondown, Loops,
 * a Marketplace database, a Google Sheet) and this route forwards to it.
 * Until that env var is set the route reports honestly instead of pretending.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, message: "Malformed request." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL.test(email.trim()) || email.length > 254) {
    return NextResponse.json(
      { ok: false, message: "That doesn't look like an email address." },
      { status: 400 },
    );
  }

  const endpoint = process.env.SUBSCRIBE_WEBHOOK_URL;
  if (!endpoint) {
    return NextResponse.json(
      {
        ok: false,
        message: "Signups aren't wired up yet. Check back shortly.",
      },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SUBSCRIBE_WEBHOOK_TOKEN
          ? { authorization: `Bearer ${process.env.SUBSCRIBE_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), source: "worldmodels101.com" }),
    });
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    return NextResponse.json(
      { ok: false, message: "Couldn't reach the list right now. Try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, message: "You're on the list. One email per chapter." });
}
