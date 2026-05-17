"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Quote, QuoteStatus } from "@/lib/supabase";
import Link from "next/link";

const STATUS_STEPS: { key: QuoteStatus; label: string; icon: string }[] = [
  { key: "received",      label: "Quote Received",  icon: "📬" },
  { key: "approved",      label: "Price Sent",       icon: "💌" },
  { key: "printing",      label: "Printing",         icon: "🖨️" },
  { key: "quality_check", label: "Quality Check",    icon: "🔍" },
  { key: "ready",         label: "Ready to Ship",    icon: "📦" },
  { key: "shipped",       label: "Shipped",          icon: "🚚" },
];

function getTrackingUrl(carrier: string, trackingNumber: string): string | null {
  const c = carrier.toUpperCase();
  if (c === "USPS")  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  if (c === "UPS")   return `https://www.ups.com/track?tracknum=${trackingNumber}`;
  if (c === "FEDEX") return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`;
  if (c === "DHL")   return `https://www.dhl.com/us-en/home/tracking/tracking-ecommerce.html?submit=1&tracking-id=${trackingNumber}`;
  return null;
}

function getHoursRemaining(paidAt: string, waitHours: number): number {
  const paid = new Date(paidAt).getTime();
  const ready = paid + waitHours * 60 * 60 * 1000;
  const remaining = (ready - Date.now()) / (60 * 60 * 1000);
  return Math.max(0, remaining);
}

export default function OrderStatusPage() {
  const [orderId, setOrderId]   = useState("");
  const [quote, setQuote]       = useState<Quote | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [waitHours, setWaitHours] = useState(48);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);

  // Fetch wait_time_hours setting
  useEffect(() => {
    supabase.from("settings").select("value").eq("key", "wait_time_hours").single()
      .then(({ data }) => { if (data?.value) setWaitHours(Number(data.value)); });
  }, []);

  // Live countdown tick every minute
  useEffect(() => {
    if (!quote?.paid_at || quote.tracking_number) return;
    const update = () => setHoursLeft(getHoursRemaining(quote.paid_at!, waitHours));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [quote, waitHours]);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setNotFound(false);
    setQuote(null);
    setHoursLeft(null);
    setLoading(true);
    const { data } = await supabase
      .from("quotes").select("*")
      .eq("order_id", orderId.trim().toUpperCase()).single();
    setLoading(false);
    if (data) setQuote(data);
    else setNotFound(true);
  }

  const currentStep = quote ? STATUS_STEPS.findIndex(s => s.key === quote.status) : -1;

  const hoursDisplay = hoursLeft !== null
    ? hoursLeft < 1
      ? "less than 1 hour"
      : hoursLeft < 2
      ? "about 1 hour"
      : `about ${Math.ceil(hoursLeft)} hours`
    : `${waitHours} hours`;

  return (
    <div className="min-h-screen bg-[#07070f] text-[#ededed] px-6 py-24 flex flex-col items-center">
      <Link href="/" className="text-orange-400/60 text-sm mb-10 hover:text-orange-400 self-start max-w-xl w-full transition-colors">
        ← Back to home
      </Link>

      <div className="w-full max-w-xl">
        <p className="text-xs font-mono text-orange-400/60 tracking-widest mb-2">// ORDER STATUS</p>
        <h1 className="text-3xl font-black text-white mb-2">Track Your Order</h1>
        <p className="text-white/40 mb-8 text-sm">Enter your order ID from your confirmation email.</p>

        <form onSubmit={lookup} className="flex gap-3 mb-10">
          <input
            required
            placeholder="e.g. SC-ABC123"
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/20 font-mono tracking-wider"
          />
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-sm">
            {loading ? "…" : "Look up"}
          </button>
        </form>

        {notFound && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            Order not found. Double-check your ID and try again.
          </p>
        )}

        {quote && (
          <div className="flex flex-col gap-4 fade-in">

            {/* Order ID header */}
            <div className="bg-white/4 border border-white/8 rounded-2xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white/30 text-xs mb-1 font-mono tracking-widest">ORDER ID</p>
                <p className="text-orange-400 font-black text-xl tracking-widest">{quote.order_id}</p>
              </div>
              {quote.payment_status === "paid" && (
                <span className="px-3 py-1.5 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-black rounded-full tracking-widest">
                  ✓ PAID
                </span>
              )}
            </div>

            {/* === SHIPPED — tracking info === */}
            {quote.tracking_number ? (
              <div className="bg-green-500/6 border border-green-500/25 rounded-2xl p-6">
                <p className="text-xs font-mono text-green-400/60 tracking-widest mb-3">// SHIPPED</p>
                <p className="text-white font-black text-lg mb-1">📦 Your package is on the way!</p>
                <p className="text-white/40 text-xs mb-5">Shipped via <span className="text-white/70">{quote.tracking_carrier}</span></p>
                <div className="bg-black/30 border border-white/8 rounded-xl px-5 py-4 mb-4">
                  <p className="text-white/30 text-[10px] font-mono tracking-widest mb-1">TRACKING NUMBER</p>
                  <p className="text-white font-black text-lg tracking-widest font-mono">{quote.tracking_number}</p>
                </div>
                {getTrackingUrl(quote.tracking_carrier!, quote.tracking_number) && (
                  <a href={getTrackingUrl(quote.tracking_carrier!, quote.tracking_number)!}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                    Track with {quote.tracking_carrier} →
                  </a>
                )}
              </div>

            /* === PAID — countdown === */
            ) : quote.payment_status === "paid" ? (
              <div className="bg-orange-500/6 border border-orange-500/25 rounded-2xl p-6">
                <p className="text-xs font-mono text-orange-400/60 tracking-widest mb-3">// PAYMENT CONFIRMED</p>
                <p className="text-white font-black text-lg mb-1">⏱ Tracking number coming soon</p>
                <p className="text-white/40 text-sm mb-4">
                  Your tracking number for this order will be available in{" "}
                  <span className="text-orange-400 font-bold">{hoursDisplay}</span>.
                </p>
                <div className="bg-black/30 border border-white/8 rounded-xl px-5 py-3">
                  <p className="text-white/25 text-xs font-mono">
                    {quote.color} · {quote.material} · Qty {quote.quantity}
                    {quote.nfc_chip ? " · NFC Chip" : ""}
                  </p>
                  <a href={quote.model_url} target="_blank" rel="noopener noreferrer"
                    className="text-orange-400/60 text-xs hover:text-orange-400 transition-colors truncate block mt-1">
                    {quote.model_url}
                  </a>
                </div>
              </div>
            ) : null}

            {/* === Status steps === */}
            <div className="flex flex-col gap-2">
              {STATUS_STEPS.map((step, i) => (
                <div key={step.key}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-all ${
                    i < currentStep  ? "border-green-500/20 bg-green-500/5 text-green-400"
                    : i === currentStep ? "border-orange-500/40 bg-orange-500/8 text-orange-300"
                    : "border-white/5 bg-white/[0.01] text-white/20"
                  }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    i < currentStep  ? "bg-green-500 text-white"
                    : i === currentStep ? "bg-orange-500 text-white"
                    : "bg-white/8 text-white/25"
                  }`}>
                    {i < currentStep ? "✓" : step.icon}
                  </div>
                  <span className="font-semibold text-sm">{step.label}</span>
                  {i === currentStep && (
                    <span className="ml-auto text-[10px] font-mono text-orange-400/60 tracking-widest">CURRENT</span>
                  )}
                </div>
              ))}
            </div>

            {/* === Order details === */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col gap-2.5 text-sm">
              <p className="text-white/25 text-[10px] font-mono tracking-widest mb-1">ORDER DETAILS</p>
              <Row label="Model" value={
                <a href={quote.model_url} target="_blank" rel="noopener noreferrer"
                  className="text-orange-400/80 hover:text-orange-400 underline truncate max-w-[220px] block transition-colors">
                  {quote.model_url}
                </a>
              } />
              <Row label="Color"    value={quote.color} />
              <Row label="Material" value={quote.material} />
              <Row label="Quantity" value={String(quote.quantity)} />
              {quote.nfc_chip && <Row label="NFC Chip" value="Yes" />}
              {quote.quoted_price && <Row label="Quoted Price" value={<span className="text-orange-400 font-bold">{quote.quoted_price}</span>} />}
              {quote.shipping_address && <Row label="Ship To" value={quote.shipping_address} />}
              {quote.customizations && <Row label="Notes" value={quote.customizations} />}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/30 flex-shrink-0 text-xs font-mono tracking-wide">{label}</span>
      <span className="text-white/70 text-right text-xs">{value}</span>
    </div>
  );
}
