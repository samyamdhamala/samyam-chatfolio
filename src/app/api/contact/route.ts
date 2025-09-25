import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message, originalQuestion } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const key = process.env.RESEND_API_KEY;     // optional in dev
    const to  = process.env.OWNER_EMAIL;        // must be set
    if (!to) return NextResponse.json({ error: "OWNER_EMAIL not set" }, { status: 500 });

    // Dev mode: if no API key, just log and return ok so the UI doesn't block
    if (!key) {
      console.log("[CONTACT - DEV MODE]", { name, email, message, originalQuestion });
      return NextResponse.json({ ok: true, dev: true });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Samyam Portfolio <onboarding@resend.dev>", // safe sender in dev
        to: [to],
        subject: `Portfolio chat message from ${name}`,
        text:
`From: ${name} <${email}>
Original question: ${originalQuestion || "(none)"}

Message:
${message}
`
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || "Send failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data.id || null });
  } catch (e: any) {
    console.error("[CONTACT ERROR]", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
