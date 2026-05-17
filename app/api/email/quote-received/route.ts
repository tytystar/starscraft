import { Resend } from "resend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY?.trim());
  const { name, email, model_url, quantity, color, material, nfc_chip, customizations, order_id } = await req.json();

  try {
    await resend.emails.send({
      from: "Starscraft <noreply@starscraft3d.com>",
      to: ["starscraft3d@gmail.com"],
      subject: `🖨️ New Quote Request — ${order_id}`,
      html: `
        <div style="font-family:monospace;background:#07070f;color:#e8eaf0;padding:32px;max-width:600px;margin:0 auto;border:1px solid rgba(251,146,60,0.3);">
          <div style="color:#f97316;font-size:11px;letter-spacing:0.2em;margin-bottom:24px;">STARSCRAFT // NEW QUOTE REQUEST</div>
          <h1 style="font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;">Order ${order_id}</h1>
          <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0 0 32px;">${new Date().toLocaleString()}</p>

          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:rgba(255,255,255,0.4);font-size:11px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">CUSTOMER</td><td style="color:#fff;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${name}</td></tr>
            <tr><td style="color:rgba(255,255,255,0.4);font-size:11px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">EMAIL</td><td style="color:#f97316;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${email}</td></tr>
            <tr><td style="color:rgba(255,255,255,0.4);font-size:11px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">MODEL URL</td><td style="font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><a href="${model_url}" style="color:#60a5fa;">${model_url}</a></td></tr>
            <tr><td style="color:rgba(255,255,255,0.4);font-size:11px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">QUANTITY</td><td style="color:#fff;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${quantity}</td></tr>
            <tr><td style="color:rgba(255,255,255,0.4);font-size:11px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">COLOR</td><td style="color:#fff;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${color}</td></tr>
            <tr><td style="color:rgba(255,255,255,0.4);font-size:11px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">MATERIAL</td><td style="color:#fff;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${material}</td></tr>
            <tr><td style="color:rgba(255,255,255,0.4);font-size:11px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">NFC CHIP</td><td style="color:${nfc_chip ? '#f97316' : 'rgba(255,255,255,0.4)'};font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">${nfc_chip ? "YES — contact customer" : "No"}</td></tr>
            ${customizations ? `<tr><td style="color:rgba(255,255,255,0.4);font-size:11px;padding:8px 0;">NOTES</td><td style="color:rgba(255,255,255,0.6);font-size:13px;padding:8px 0;font-style:italic;">${customizations}</td></tr>` : ""}
          </table>

          <a href="https://starscraft3d.com/admin" style="display:inline-block;margin-top:28px;padding:12px 24px;background:#f97316;color:#fff;font-weight:900;font-size:12px;letter-spacing:0.15em;text-decoration:none;">
            OPEN ADMIN DASHBOARD →
          </a>

          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:28px;">Starscraft 3D Printing · starscraft3d.com</p>
        </div>
      `,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Email error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
