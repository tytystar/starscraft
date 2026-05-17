"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Quote, QuoteStatus } from "@/lib/supabase";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_STEPS: { key: QuoteStatus; label: string; icon: string }[] = [
  { key: "received",      label: "Quote Received",  icon: "📬" },
  { key: "approved",      label: "Price Sent",       icon: "💌" },
  { key: "printing",      label: "Printing",         icon: "🖨️" },
  { key: "quality_check", label: "Quality Check",    icon: "🔍" },
  { key: "ready",         label: "Ready to Ship",    icon: "📦" },
  { key: "shipped",       label: "Shipped",          icon: "🚚" },
];

const STATUS_COLORS: Record<QuoteStatus, { bg: string; text: string; border: string }> = {
  received:      { bg: "bg-blue-500/10",    text: "text-blue-300",    border: "border-blue-500/30" },
  approved:      { bg: "bg-violet-500/10",  text: "text-violet-300",  border: "border-violet-500/30" },
  printing:      { bg: "bg-orange-500/10",  text: "text-orange-300",  border: "border-orange-500/30" },
  quality_check: { bg: "bg-yellow-500/10",  text: "text-yellow-300",  border: "border-yellow-500/30" },
  ready:         { bg: "bg-green-500/10",   text: "text-green-300",   border: "border-green-500/30" },
  shipped:       { bg: "bg-white/8",        text: "text-white/50",    border: "border-white/10" },
};

function getTrackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
  if (!carrier || !trackingNumber) return null;
  const c = carrier.toUpperCase();
  if (c === "USPS")  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  if (c === "UPS")   return `https://www.ups.com/track?tracknum=${trackingNumber}`;
  if (c === "FEDEX") return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${trackingNumber}`;
  if (c === "DHL")   return `https://www.dhl.com/us-en/home/tracking/tracking-ecommerce.html?submit=1&tracking-id=${trackingNumber}`;
  return null;
}

function getHoursRemaining(paidAt: string | null, waitHours: number): number {
  if (!paidAt) return waitHours;
  const paid = new Date(paidAt).getTime();
  const ready = paid + waitHours * 60 * 60 * 1000;
  return Math.max(0, (ready - Date.now()) / (60 * 60 * 1000));
}

function formatHours(h: number): string {
  if (h < 1) return "less than 1 hour";
  if (h < 2) return "about 1 hour";
  return `about ${Math.ceil(h)} hours`;
}

// ── Order card ─────────────────────────────────────────────────────────────────
function OrderCard({ quote, waitHours }: { quote: Quote; waitHours: number }) {
  const [hoursLeft, setHoursLeft] = useState<number>(() =>
    getHoursRemaining(quote.paid_at, waitHours)
  );

  // Live countdown — tick every minute
  useEffect(() => {
    if (!quote.paid_at || quote.tracking_number) return;
    const tick = () => setHoursLeft(getHoursRemaining(quote.paid_at, waitHours));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [quote.paid_at, quote.tracking_number, waitHours]);

  const currentStep = STATUS_STEPS.findIndex(s => s.key === quote.status);
  const sc = STATUS_COLORS[quote.status] ?? STATUS_COLORS.received;
  const trackingUrl = getTrackingUrl(quote.tracking_carrier, quote.tracking_number);

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-orange-400 font-black tracking-widest text-sm mb-0.5">{quote.order_id}</p>
          <p className="text-white/30 text-xs">{new Date(quote.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          {quote.payment_status === "paid" && (
            <span className="px-2.5 py-1 bg-green-500/15 border border-green-500/25 text-green-400 text-[10px] font-black rounded-full tracking-widest">✓ PAID</span>
          )}
          <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
            {STATUS_STEPS.find(s => s.key === quote.status)?.label ?? quote.status}
          </span>
        </div>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5">
        {/* === Shipped: tracking === */}
        {quote.tracking_number ? (
          <div className="bg-green-500/6 border border-green-500/20 rounded-xl p-4">
            <p className="text-green-400 font-bold text-sm mb-1">📦 Your package is on the way!</p>
            <p className="text-white/40 text-xs mb-3">Shipped via {quote.tracking_carrier}</p>
            <div className="bg-black/30 rounded-lg px-4 py-3 mb-3">
              <p className="text-white/25 text-[10px] font-mono mb-1">TRACKING NUMBER</p>
              <p className="text-white font-black tracking-widest font-mono text-base">{quote.tracking_number}</p>
            </div>
            {trackingUrl && (
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors">
                Track with {quote.tracking_carrier} →
              </a>
            )}
          </div>

        /* === Paid: countdown === */
        ) : quote.payment_status === "paid" ? (
          <div className="bg-orange-500/6 border border-orange-500/20 rounded-xl p-4">
            <p className="text-orange-300 font-bold text-sm mb-1">⏱ Tracking number coming</p>
            <p className="text-white/50 text-xs">
              Your tracking number will be ready in{" "}
              <span className="text-orange-400 font-bold">{formatHours(hoursLeft)}</span>.
            </p>
          </div>

        /* === Awaiting payment === */
        ) : quote.status === "approved" ? (
          <div className="bg-violet-500/6 border border-violet-500/20 rounded-xl p-4">
            <p className="text-violet-300 font-bold text-sm mb-1">💌 Price quote sent</p>
            <p className="text-white/40 text-xs">Check your email for payment options. Once you pay, we'll start printing!</p>
          </div>
        ) : quote.status === "received" ? (
          <div className="bg-blue-500/6 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-300 font-bold text-sm mb-1">📬 Quote received</p>
            <p className="text-white/40 text-xs">We're reviewing your request and will send a price quote shortly.</p>
          </div>
        ) : null}

        {/* Progress steps */}
        <div className="flex flex-col gap-1.5">
          {STATUS_STEPS.map((step, i) => (
            <div key={step.key} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
              i < currentStep  ? "border-green-500/15 bg-green-500/4 text-green-400"
              : i === currentStep ? "border-orange-500/30 bg-orange-500/6 text-orange-300"
              : "border-white/4 bg-white/[0.01] text-white/15"
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                i < currentStep  ? "bg-green-500 text-white"
                : i === currentStep ? "bg-orange-500 text-white"
                : "bg-white/6 text-white/20"
              }`}>
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span className="text-xs font-medium">{step.label}</span>
              {i === currentStep && <span className="ml-auto text-[9px] font-mono text-orange-400/50 tracking-widest">NOW</span>}
            </div>
          ))}
        </div>

        {/* Order details */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/35 border-t border-white/6 pt-4">
          <span>Qty: <span className="text-white/60">{quote.quantity}</span></span>
          <span>Color: <span className="text-white/60">{quote.color || "—"}</span></span>
          <span>Material: <span className="text-white/60">{quote.material || "—"}</span></span>
          {quote.nfc_chip && <span className="text-orange-400">+ NFC Chip</span>}
          {quote.quoted_price && <span>Price: <span className="text-orange-400 font-bold">{quote.quoted_price}</span></span>}
        </div>

        {quote.model_url && (
          <a href={quote.model_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400/60 hover:text-blue-400 underline truncate transition-colors">
            {quote.model_url}
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [waitHours, setWaitHours] = useState(48);

  // Redirect to login if not signed in
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  // Fetch orders + wait time setting
  useEffect(() => {
    if (!user?.email) return;

    supabase.from("settings").select("value").eq("key", "wait_time_hours").single()
      .then(({ data }) => { if (data?.value) setWaitHours(Number(data.value)); });

    supabase.from("quotes").select("*")
      .eq("email", user.email)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setQuotes(data ?? []);
        setQuotesLoading(false);
      });

    // Real-time subscription for order updates
    const channel = supabase
      .channel(`orders-${user.email}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "quotes",
        filter: `email=eq.${user.email}`,
      }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setQuotes(prev => prev.map(q => q.id === payload.new.id ? { ...q, ...payload.new } as Quote : q));
        } else if (payload.eventType === "INSERT") {
          setQuotes(prev => [payload.new as Quote, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.email]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen bg-[#07070f]">
        {/* Header */}
        <div className="border-b border-white/5 bg-[#07070f]/80 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <p className="text-[10px] font-mono tracking-widest text-orange-400/60 uppercase mb-1">// My Account</p>
            <h1 className="text-2xl font-black text-white">My Orders</h1>
            <p className="text-white/30 text-sm mt-1">{user.email}</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-8">
          {quotesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>

          ) : quotes.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">📭</p>
              <h2 className="text-white font-bold text-lg mb-2">No orders yet</h2>
              <p className="text-white/30 text-sm mb-8">Submit a quote to get started.</p>
              <Link href="/#quote"
                className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl text-sm transition-colors">
                Get a Quote →
              </Link>
            </div>

          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-white/25 text-xs font-mono">{quotes.length} order{quotes.length !== 1 ? "s" : ""}</p>
              {quotes.map(q => (
                <OrderCard key={q.id} quote={q} waitHours={waitHours} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
