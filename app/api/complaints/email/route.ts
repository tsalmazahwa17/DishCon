import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ComplaintEmailPayload = {
  complaint_id?: string;
  subject?: string;
  message?: string;
  role?: string;
  user_name?: string;
  user_email?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function authenticatedEmail(request: Request, fallbackEmail?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return fallbackEmail || "demo-local@dishcon.invalid";

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.email || fallbackEmail || null;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as ComplaintEmailPayload;
  const subject = payload.subject?.trim();
  const message = payload.message?.trim();
  if (!subject || !message) {
    return NextResponse.json({ status: "failed", error: "Subjek dan pesan wajib diisi." }, { status: 400 });
  }

  const verifiedUserEmail = await authenticatedEmail(request, payload.user_email);
  if (!verifiedUserEmail) {
    return NextResponse.json({ status: "failed", error: "Sesi pengguna tidak valid." }, { status: 401 });
  }

  const recipient = process.env.COMPLAINT_EMAIL_TO?.trim();
  const sender = process.env.COMPLAINT_EMAIL_FROM?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (!recipient || !sender || !resendKey) {
    return NextResponse.json({
      status: "not_configured",
      recipient: recipient || null,
      message: "Email pengaduan belum dikonfigurasi. Isi RESEND_API_KEY, COMPLAINT_EMAIL_FROM, dan COMPLAINT_EMAIL_TO."
    });
  }

  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
  const safeName = escapeHtml(payload.user_name || "Pengguna DishCon");
  const safeEmail = escapeHtml(verifiedUserEmail);
  const safeRole = escapeHtml(payload.role || "pengguna");
  const safeId = escapeHtml(payload.complaint_id || "-");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: verifiedUserEmail,
        subject: `[DishCon Pengaduan] ${subject}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17211d;max-width:680px;margin:auto">
            <h2 style="color:#0c6b45">Pengaduan Baru DishCon</h2>
            <p><strong>ID:</strong> ${safeId}</p>
            <p><strong>Pelapor:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Role:</strong> ${safeRole}</p>
            <p><strong>Subjek:</strong> ${safeSubject}</p>
            <div style="margin-top:16px;padding:16px;border:1px solid #d8dfda;border-radius:14px;background:#f7faf8">${safeMessage}</div>
          </div>
        `
      }),
      signal: AbortSignal.timeout(20_000)
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return NextResponse.json({ status: "failed", recipient, error: detail || "Provider email menolak permintaan." }, { status: 502 });
    }

    return NextResponse.json({ status: "sent", recipient });
  } catch (error) {
    return NextResponse.json({ status: "failed", recipient, error: error instanceof Error ? error.message : "Pengiriman email gagal." }, { status: 502 });
  }
}
