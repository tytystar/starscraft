import { Resend } from "resend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getTrackingUrl(carrier: string, trackingNumber: string): string | null {
  const c = carrier.toUpperCase();
  if (c === "USPS") return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  if (c === "UPS") return `https://www.ups.com/track?tracknum=${trackingNumber}`;
  if (c === "FEDEX") return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`;
  if (c === "DHL") return `https://www.dhl.com/us-en/home/tracking/tracking-ecommerce.html?submit=1&tracking-id=${trackingNumber}`;
  return null;
}

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY?.trim());
  const { customer_email, customer_name, order_id, tracking_number, tracking_carrier } = await req.json();

  const trackingUrl = getTrackingUrl(tracking_carrier, tracking_number);

  const trackButton = trackingUrl
    ? `<a href="${trackingUrl}" style="display:inline-block;background:#f97316;color:#fff;font-family:monospace;font-size:14px;font-weight:900;padding:14px 32px;text-decoration:none;border-radius:4px;margin-top:16px;letter-spacing:0.05em;">Track with ${tracking_carrier} →</a>`
    : `<p style="color:rgba(255,255,255,0.5);font-size:13px;margin-top:12px;">Use your tracking number with ${tracking_carrier} to track your package.</p>`;

  try {
    await resend.emails.send({
      from: "Starscraft <noreply@starscraft3d.com>",
      replyTo: "starscraft3d@gmail.com",
      to: [customer_email],
      subject: `Your Starscraft Order is Shipped — ${order_id}`,
      html: `
        <div style="font-family:monospace;background:#07070f;color:#e8eaf0;padding:32px;max-width:600px;margin:0 auto;border:1px solid rgba(251,146,60,0.3);">
          <div style="color:#f97316;font-size:11px;letter-spacing:0.2em;margin-bottom:24px;">STARSCRAFT // ORDER SHIPPED</div>

          <h1 style="font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;">📦 Your package is on the way!</h1>
          <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 28px;">Order <strong style="color:#f97316;">${order_id}</strong> has shipped, ${customer_name}.</p>

          <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.3);padding:24px;margin-bottom:24px;text-align:center;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 8px;letter-spacing:0.15em;">TRACKING NUMBER</p>
            <p style="color:#f97316;font-size:28px;font-weight:900;margin:0 0 4px;letter-spacing:0.1em;">${tracking_number}</p>
            <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:0;">via ${tracking_carrier}</p>
            ${trackButton}
          </div>

          <p style="color:rgba(255,255,255,0.4);font-size:13px;line-height:1.7;">
            If you have any questions about your shipment, reply to this email and we'll help right away.
          </p>

          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
            Starscraft 3D Printing · starscraft3d.com · starscraft3d@gmail.com
          </p>
        </div>
      `,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Tracking email error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
