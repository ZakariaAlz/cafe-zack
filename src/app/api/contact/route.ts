import { contactSchema } from "@/lib/contact";

// Edge-safe: Web Fetch API only (no node:* imports), per the backend rule.
export const runtime = "edge";

/**
 * Contact form endpoint. Validates with the shared zod schema, then emails via
 * Resend's HTTP API (fetch — no SDK). When the mail env isn't configured ($0 /
 * local), it accepts and logs instead of failing the visitor; wire the env to
 * go live: RESEND_API_KEY, CONTACT_TO, optional RESEND_FROM.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const { name, email, message } = parsed.data;

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.RESEND_FROM ?? "Café Zack <onboarding@resend.dev>";

  if (!key || !to) {
    console.log(`[contact] received from ${email} (mail not configured — not sent)`);
    return Response.json({ ok: true });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `Café Zack — message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
  });

  if (!res.ok) {
    return Response.json({ ok: false, error: "send-failed" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
