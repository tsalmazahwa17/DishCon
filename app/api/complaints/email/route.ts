import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.COMPLAINT_EMAIL_TO;
  const from = process.env.COMPLAINT_EMAIL_FROM || "DishCon <onboarding@resend.dev>";

  if (!apiKey || !to) {
    return NextResponse.json({ ok: true, email: "skipped", reason: "RESEND_API_KEY atau COMPLAINT_EMAIL_TO belum diisi" }, { status: 202 });
  }

  const subject = String(body.subject || "Pengaduan DishCon").slice(0, 180);
  const message = String(body.message || "");
  const role = String(body.role || "pengguna");
  const userName = String(body.userName || "Pengguna DishCon");
  const userEmail = String(body.userEmail || "-");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: `[DishCon] ${subject}`,
      text: [
        "Pengaduan baru dari website DishCon.",
        "",
        `Pelapor: ${userName}`,
        `Email: ${userEmail}`,
        `Role: ${role}`,
        `Subjek: ${subject}`,
        "",
        "Isi pengaduan:",
        message
      ].join("\n")
    })
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }

  const data = await response.json().catch(() => ({}));
  return NextResponse.json({ ok: true, email: "sent", data });
}
