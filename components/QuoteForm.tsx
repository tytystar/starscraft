"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { AdminOption } from "@/lib/supabase";

export default function QuoteForm() {
  const [colors, setColors] = useState<AdminOption[]>([]);
  const [materials, setMaterials] = useState<AdminOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState("");
  const [waitTime, setWaitTime] = useState("48");

  const [form, setForm] = useState({
    name: "", email: "", model_url: "", quantity: 1,
    color: "", material: "", nfc_chip: false, customizations: "",
  });

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("United States");

  useEffect(() => {
    supabase.from("admin_options").select("*").order("label").then(({ data }) => {
      if (data) {
        setColors(data.filter((o: AdminOption) => o.type === "color"));
        setMaterials(data.filter((o: AdminOption) => o.type === "material"));
      }
    });
    supabase.from("settings").select("value").eq("key", "wait_time_hours").single()
      .then(({ data }) => { if (data?.value) setWaitTime(data.value); });
  }, []);

  const set = (field: string, value: string | number | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const id = `SC-${Date.now().toString(36).toUpperCase()}`;
    const shipping_address = `${address}, ${city}, ${state} ${zip}, ${country}`;
    const { error: err } = await supabase.from("quotes").insert({
      ...form,
      order_id: id,
      status: "received",
      shipping_address,
      payment_status: "unpaid",
    });
    if (err) { setError("Something went wrong. Please try again."); setLoading(false); return; }
    // Notify admin via email
    await fetch("/api/email/quote-received", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, order_id: id, shipping_address }),
    }).catch(() => {}); // don't block on email failure
    setOrderId(id); setSubmitted(true); setLoading(false);
  }

  if (submitted) {
    return (
      <section id="quote" className="max-w-2xl mx-auto px-6 py-28 text-center fade-in">
        {/* Main confirmation card */}
        <div className="relative border border-green-500/30 bg-green-500/5 p-10 mb-6">
          <div className="absolute top-0 left-0 w-4 h-4 corner-tl" style={{ borderColor: "rgba(34,197,94,0.4)" }} />
          <div className="absolute top-0 right-0 w-4 h-4 corner-tr" style={{ borderColor: "rgba(34,197,94,0.4)" }} />
          <div className="absolute bottom-0 left-0 w-4 h-4 corner-bl" style={{ borderColor: "rgba(34,197,94,0.4)" }} />
          <div className="absolute bottom-0 right-0 w-4 h-4 corner-br" style={{ borderColor: "rgba(34,197,94,0.4)" }} />
          <p className="text-xs font-mono text-green-400/60 tracking-widest mb-6">// SUBMISSION ACCEPTED</p>
          <h2 className="text-2xl font-black text-white mb-2 tracking-wide">QUOTE RECEIVED</h2>
          <p className="text-white/40 font-mono text-sm mb-6">Your order ID:</p>
          <p className="text-4xl font-black text-orange-400 tracking-widest mb-6 glow-orange">{orderId}</p>
          <p className="text-white/30 text-xs font-mono">
            Save this ID. Updates will be sent to{" "}
            <span className="text-white/60">{form.email}</span>
          </p>
        </div>

        {/* Delivery time popup */}
        <div className="relative border border-orange-500/40 bg-orange-500/8 p-6">
          <div className="absolute top-0 left-0 w-3 h-3 corner-tl" style={{ borderColor: "rgba(249,115,22,0.5)" }} />
          <div className="absolute top-0 right-0 w-3 h-3 corner-tr" style={{ borderColor: "rgba(249,115,22,0.5)" }} />
          <div className="absolute bottom-0 left-0 w-3 h-3 corner-bl" style={{ borderColor: "rgba(249,115,22,0.5)" }} />
          <div className="absolute bottom-0 right-0 w-3 h-3 corner-br" style={{ borderColor: "rgba(249,115,22,0.5)" }} />
          <p className="text-xs font-mono text-orange-400/60 tracking-widest mb-3">// WHAT HAPPENS NEXT</p>
          <p className="text-lg font-black text-white mb-1">
            ⏱ You will receive your tracking order in{" "}
            <span className="text-orange-400">{waitTime} hours</span>
          </p>
          <p className="text-white/40 text-xs font-mono mt-2">
            We'll review your request and email you a price quote shortly.
            Once confirmed, tracking info arrives within {waitTime} hours.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="quote" className="max-w-2xl mx-auto px-6 py-28">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-mono text-orange-400/60 tracking-widest mb-3">// INITIATE REQUEST</p>
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">GET A QUOTE</h2>
        <p className="text-white/30 font-mono text-sm">
          Paste your MakerWorld link. Configure. Submit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="NAME" required>
            <input type="text" required placeholder="John Doe" value={form.name}
              onChange={(e) => set("name", e.target.value)} className="sc-input" />
          </Field>
          <Field label="EMAIL" required>
            <input type="email" required placeholder="you@email.com" value={form.email}
              onChange={(e) => set("email", e.target.value)} className="sc-input" />
          </Field>
        </div>

        <Field label="MAKERWORLD MODEL URL" required>
          <input type="url" required placeholder="https://makerworld.com/en/models/..."
            value={form.model_url} onChange={(e) => set("model_url", e.target.value)} className="sc-input" />
        </Field>

        <Field label="QUANTITY" required>
          <input type="number" required min={1} max={999} value={form.quantity}
            onChange={(e) => set("quantity", parseInt(e.target.value))} className="sc-input w-28" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="COLOR" required>
            <select required value={form.color} onChange={(e) => set("color", e.target.value)} className="sc-input">
              <option value="">— Select —</option>
              {colors.map((c) => <option key={c.id} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="MATERIAL" required>
            <select required value={form.material} onChange={(e) => set("material", e.target.value)} className="sc-input">
              <option value="">— Select —</option>
              {materials.map((m) => <option key={m.id} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="ADDRESS LINE 1" required>
          <input type="text" required placeholder="123 Main St"
            value={address} onChange={(e) => setAddress(e.target.value)} className="sc-input" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="CITY" required>
            <input type="text" required placeholder="New York"
              value={city} onChange={(e) => setCity(e.target.value)} className="sc-input" />
          </Field>
          <Field label="STATE" required>
            <input type="text" required placeholder="NY"
              value={state} onChange={(e) => setState(e.target.value)} className="sc-input" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="ZIP CODE" required>
            <input type="text" required placeholder="10001"
              value={zip} onChange={(e) => setZip(e.target.value)} className="sc-input" />
          </Field>
          <Field label="COUNTRY" required>
            <input type="text" required placeholder="United States"
              value={country} onChange={(e) => setCountry(e.target.value)} className="sc-input" />
          </Field>
        </div>

        <Field label="ADDITIONAL NOTES (OPTIONAL)">
          <textarea rows={3} placeholder="Special requests, dimensions, notes..."
            value={form.customizations} onChange={(e) => set("customizations", e.target.value)}
            className="sc-input resize-none" />
        </Field>

        {/* NFC toggle */}
        <label className="flex items-center gap-3 cursor-pointer group border border-white/8 hover:border-orange-500/20 p-4 transition-all bg-white/[0.01]">
          <div className={`w-10 h-5 rounded-sm border transition-all flex items-center px-0.5 ${form.nfc_chip ? "border-orange-500/60 bg-orange-500/10" : "border-white/10 bg-transparent"}`}>
            <div className={`w-4 h-3.5 rounded-sm transition-all duration-300 ${form.nfc_chip ? "bg-orange-400 translate-x-5" : "bg-white/20 translate-x-0"}`} />
          </div>
          <input type="checkbox" checked={form.nfc_chip}
            onChange={(e) => set("nfc_chip", e.target.checked)} className="sr-only" />
          <div>
            <p className="text-white/70 text-xs font-mono tracking-wide group-hover:text-white transition-colors">NFC CHIP EMBED</p>
            <p className="text-white/25 text-xs">Optional — we will contact you about programming</p>
          </div>
          {form.nfc_chip && (
            <span className="ml-auto text-xs font-mono text-orange-400 tracking-widest">ENABLED</span>
          )}
        </label>

        {error && (
          <p className="text-red-400 text-xs font-mono border border-red-500/20 bg-red-500/5 px-4 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="relative mt-2 w-full py-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black tracking-widest uppercase text-sm transition-all"
          style={{ clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}
        >
          {loading ? "PROCESSING…" : "SUBMIT QUOTE REQUEST"}
        </button>
      </form>

      <style jsx>{`
        .sc-input {
          width: 100%;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 0.75rem 1rem;
          color: #e8eaf0;
          font-size: 0.8rem;
          font-family: monospace;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .sc-input:focus {
          border-color: rgba(251,146,60,0.5);
          background: rgba(251,146,60,0.03);
        }
        .sc-input option { background: #0d0d14; }
      `}</style>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono text-white/30 tracking-widest">
        {label}{required && <span className="text-orange-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
