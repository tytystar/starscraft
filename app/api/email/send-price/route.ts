import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { customer_email, customer_name, order_id, price, message, wait_time_hours } = await req.json();

  try {
    await resend.emails.send({
      from: "Starscraft <noreply@starscraft3d.com>",
      replyTo: "starscraft3d@gmail.com",
      to: [customer_email],
      subject: `Your Starscraft Quote — ${order_id}`,
      html: `
        <div style="font-family:monospace;background:#07070f;color:#e8eaf0;padding:32px;max-width:600px;margin:0 auto;border:1px solid rgba(251,146,60,0.3);">
          <div style="color:#f97316;font-size:11px;letter-spacing:0.2em;margin-bottom:24px;">STARSCRAFT // QUOTE READY</div>

          <h1 style="font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;">Hi ${customer_name},</h1>
          <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 28px;">Your quote for order <strong style="color:#f97316;">${order_id}</strong> is ready.</p>

          <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.3);padding:24px;margin-bottom:24px;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 8px;letter-spacing:0.15em;">QUOTED PRICE</p>
            <p style="color:#f97316;font-size:36px;font-weight:900;margin:0;">${price}</p>
          </div>

          ${message ? `<p style="color:rgba(255,255,255,0.65);font-size:14px;line-height:1.7;margin-bottom:24px;">${message}</p>` : ""}

          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:16px;margin-bottom:28px;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 4px;">⏱ ESTIMATED DELIVERY</p>
            <p style="color:#fff;font-size:14px;font-weight:700;margin:0;">Tracking details within ${wait_time_hours} hours of order confirmation</p>
          </div>

          <p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.7;">
            To confirm this order, simply reply to this email. If you have any questions,
            reply directly and we'll get back to you right away.
          </p>

          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
            Starscraft 3D Printing · starscraft3d.com · starscraft3d@gmail.com
          </p>
        </div>
      `,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Email error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
