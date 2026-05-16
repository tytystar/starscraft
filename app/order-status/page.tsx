"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Quote, QuoteStatus } from "@/lib/supabase";
import Link from "next/link";

const STATUS_STEPS: { key: QuoteStatus; label: string }[] = [
  { key: "received", label: "Quote Received" },
  { key: "approved", label: "Approved" },
  { key: "printing", label: "Printing" },
  { key: "quality_check", label: "Quality Check" },
  { key: "ready", label: "Ready / Shipped" },
];

export default function OrderStatusPage() {
  const [orderId, setOrderId] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setNotFound(false);
    setQuote(null);
    setLoading(true);

    const { data } = await supabase
      .from("quotes")
      .select("*")
      .eq("order_id", orderId.trim().toUpperCase())
      .single();

    setLoading(false);
    if (data) setQuote(data);
    else setNotFound(true);
  }

  const currentStep = quote
    ? STATUS_STEPS.findIndex((s) => s.key === quote.status)
    : -1;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] px-6 py-24 flex flex-col items-center">
      <Link href="/" className="text-orange-400 text-sm mb-10 hover:text-orange-300 self-start max-w-xl w-full">
        ← Back to home
      </Link>

      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-black text-white mb-2">Track Your Order</h1>
        <p className="text-white/50 mb-8 text-sm">Enter the order ID from your confirmation email.</p>

        <form onSubmit={lookup} className="flex gap-3 mb-10">
          <input
            required
            placeholder="e.g. SC-ABC123"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-orange-400/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
          >
            {loading ? "…" : "Look up"}
          </button>
        </form>

        {notFound && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            Order not found. Double-check your ID and try again.
          </p>
        )}

        {quote && (
          <div className="fade-in">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <p className="text-white/40 text-xs mb-1">Order ID</p>
              <p className="text-orange-400 font-black text-xl tracking-widest">{quote.order_id}</p>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              {STATUS_STEPS.map((step, i) => (
                <div
                  key={step.key}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-all ${
                    i < currentStep
                      ? "border-green-500/30 bg-green-500/5 text-green-400"
                      : i === currentStep
                      ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                      : "border-white/5 bg-white/2 text-white/20"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i < currentStep
                        ? "bg-green-500 text-white"
                        : i === currentStep
                        ? "bg-orange-500 text-white"
                        : "bg-white/10 text-white/30"
                    }`}
                  >
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <span className="font-medium text-sm">{step.label}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white/60 flex flex-col gap-2">
              <Row label="Model" value={<a href={quote.model_url} target="_blank" rel="noopener noreferrer" className="text-orange-400 underline truncate max-w-xs">{quote.model_url}</a>} />
              <Row label="Color" value={quote.color} />
              <Row label="Material" value={quote.material} />
              <Row label="Quantity" value={String(quote.quantity)} />
              {quote.nfc_chip && <Row label="NFC Chip" value="Yes" />}
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
      <span className="text-white/30 flex-shrink-0">{label}</span>
      <span className="text-white/70 text-right">{value}</span>
    </div>
  );
}
