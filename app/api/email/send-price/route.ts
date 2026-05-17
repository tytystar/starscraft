import { Resend } from "resend";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY?.trim());
  const { customer_email, customer_name, order_id, price, message, wait_time_hours } = await req.json();

  // Fetch payment method settings
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: settingsRows } = await admin
    .from("settings")
    .select("key,value")
    .in("key", ["paypal_username", "cashapp_tag", "venmo_username", "stripe_link"]);

  const settings: Record<string, string> = {};
  if (settingsRows) {
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }
  }

  const { paypal_username, cashapp_tag, venmo_username, stripe_link } = settings;

  // Extract numeric amount from price string (strip $ and commas)
  const amount = price ? price.replace(/[$,]/g, "").trim() : "0";

  // Build payment buttons HTML
  const paymentButtons: string[] = [];

  if (paypal_username) {
    paymentButtons.push(
      `<a href="https://paypal.me/${paypal_username}/${amount}" style="display:inline-block;background:#003087;color:#fff;font-family:monospace;font-size:13px;font-weight:700;padding:12px 24px;text-decoration:none;border-radius:4px;margin:4px;">Pay with PayPal</a>`
    );
  }
  if (cashapp_tag) {
    paymentButtons.push(
      `<a href="https://cash.app/${cashapp_tag}/${amount}" style="display:inline-block;background:#00D64F;color:#000;font-family:monospace;font-size:13px;font-weight:700;padding:12px 24px;text-decoration:none;border-radius:4px;margin:4px;">Pay with Cash App</a>`
    );
  }
  if (venmo_username) {
    paymentButtons.push(
      `<a href="https://venmo.com/${venmo_username}?txn=pay&amount=${amount}&note=${order_id}" style="display:inline-block;background:#3D95CE;color:#fff;font-family:monospace;font-size:13px;font-weight:700;padding:12px 24px;text-decoration:none;border-radius:4px;margin:4px;">Pay with Venmo</a>`
    );
  }
  if (stripe_link) {
    paymentButtons.push(
      `<a href="${stripe_link}" style="display:inline-block;background:#635BFF;color:#fff;font-family:monospace;font-size:13px;font-weight:700;padding:12px 24px;text-decoration:none;border-radius:4px;margin:4px;">Pay with Card (Stripe)</a>`
    );
  }

  const paymentSection = paymentButtons.length > 0
    ? `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:20px;margin-bottom:24px;">
        <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 12px;letter-spacing:0.15em;">PAYMENT OPTIONS</p>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${paymentButtons.join("")}</div>
      </div>`
    : `<div style="background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.2);padding:16px;margin-bottom:24px;">
        <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 6px;letter-spacing:0.15em;">PAYMENT</p>
        <p style="color:#fb923c;font-size:13px;font-weight:700;margin:0;">Reply to this email to pay by card</p>
      </div>`;

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

          ${paymentSection}

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
