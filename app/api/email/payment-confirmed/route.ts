import { Resend } from "resend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY?.trim());
  const { customer_email, customer_name, order_id, model_url, quantity, color, material, wait_time_hours } = await req.json();

  try {
    await resend.emails.send({
      from: "Starscraft <noreply@starscraft3d.com>",
      replyTo: "starscraft3d@gmail.com",
      to: [customer_email],
      subject: `Payment Confirmed — ${order_id}`,
      html: `
        <div style="font-family:monospace;background:#07070f;color:#e8eaf0;padding:32px;max-width:600px;margin:0 auto;border:1px solid rgba(251,146,60,0.3);">
          <div style="color:#f97316;font-size:11px;letter-spacing:0.2em;margin-bottom:24px;">STARSCRAFT // PAYMENT CONFIRMED</div>

          <h1 style="font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;">Payment Received ✓</h1>
          <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 28px;">Thanks ${customer_name}! We've received your payment for order <strong style="color:#f97316;">${order_id}</strong>.</p>

          <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);padding:20px;margin-bottom:24px;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 6px;letter-spacing:0.15em;">ORDER CONFIRMED</p>
            <p style="color:#4ade80;font-size:16px;font-weight:900;margin:0;">✓ Payment accepted — we're on it!</p>
          </div>

          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:16px;margin-bottom:24px;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 10px;letter-spacing:0.15em;">ORDER DETAILS</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:rgba(255,255,255,0.4);font-size:12px;padding:5px 0;">Order ID</td><td style="color:#f97316;font-size:12px;font-weight:900;padding:5px 0;">${order_id}</td></tr>
              <tr><td style="color:rgba(255,255,255,0.4);font-size:12px;padding:5px 0;">Quantity</td><td style="color:#fff;font-size:12px;padding:5px 0;">${quantity}</td></tr>
              <tr><td style="color:rgba(255,255,255,0.4);font-size:12px;padding:5px 0;">Color</td><td style="color:#fff;font-size:12px;padding:5px 0;">${color}</td></tr>
              <tr><td style="color:rgba(255,255,255,0.4);font-size:12px;padding:5px 0;">Material</td><td style="color:#fff;font-size:12px;padding:5px 0;">${material}</td></tr>
              <tr><td style="color:rgba(255,255,255,0.4);font-size:12px;padding:5px 0;">Model</td><td style="font-size:12px;padding:5px 0;"><a href="${model_url}" style="color:#60a5fa;">${model_url}</a></td></tr>
            </table>
          </div>

          <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.3);padding:20px;margin-bottom:28px;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 8px;letter-spacing:0.15em;">⏱ TRACKING NUMBER</p>
            <p style="color:#f97316;font-size:18px;font-weight:900;margin:0 0 6px;">Available within ${wait_time_hours} hours</p>
            <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;">We'll email you your tracking number as soon as your order ships. You can also check your order status anytime at starscraft3d.com/order-status using your order ID.</p>
          </div>

          <a href="https://starscraft3d.com/order-status" style="display:inline-block;margin-bottom:28px;padding:12px 24px;background:#f97316;color:#fff;font-weight:900;font-size:12px;letter-spacing:0.15em;text-decoration:none;">
            TRACK ORDER STATUS →
          </a>

          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:16px;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
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
