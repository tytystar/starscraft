"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Quote, QuoteStatus, TimeLapse, AdminOption } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "orders" | "timelapses" | "options" | "reviews" | "faq" | "gallery" | "settings";
type Stage = "loading" | "login" | "pin" | "dashboard";

type Review = { id: string; name: string; rating: number; comment: string; approved: boolean; created_at: string };
type FaqItem = { id: string; question: string; answer: string; sort_order: number };
type GalleryItem = { id: string; title: string; image_url: string; material: string | null; category: string | null; visible: boolean; sort_order: number };

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_ORDER: QuoteStatus[] = ["received","approved","printing","quality_check","ready","shipped"];
const STATUS_META: Record<QuoteStatus, { label: string; color: string; dot: string }> = {
  received:      { label: "Received",      color: "bg-blue-500/15 text-blue-300 border-blue-500/30",    dot: "bg-blue-400" },
  approved:      { label: "Approved",      color: "bg-violet-500/15 text-violet-300 border-violet-500/30", dot: "bg-violet-400" },
  printing:      { label: "Printing",      color: "bg-orange-500/15 text-orange-300 border-orange-500/30", dot: "bg-orange-400" },
  quality_check: { label: "Quality Check", color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30", dot: "bg-yellow-400" },
  ready:         { label: "Ready",         color: "bg-green-500/15 text-green-300 border-green-500/30",  dot: "bg-green-400" },
  shipped:       { label: "Shipped",       color: "bg-white/10 text-white/40 border-white/10",           dot: "bg-white/30" },
};

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "orders",     label: "Orders",            icon: "📦" },
  { key: "timelapses", label: "Time Lapses",        icon: "🎬" },
  { key: "options",    label: "Colors & Materials", icon: "🎨" },
  { key: "reviews",    label: "Reviews",            icon: "⭐" },
  { key: "faq",        label: "FAQ",                icon: "❓" },
  { key: "gallery",    label: "Gallery",            icon: "🖼️" },
  { key: "settings",   label: "Settings",           icon: "⚙️" },
];

// ── Input style ───────────────────────────────────────────────────────────────
const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[#ededed] text-sm outline-none focus:border-orange-400/50 transition-colors placeholder:text-white/25";
const btn = "px-5 py-2.5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-semibold rounded-xl text-sm transition-all";

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [user,  setUser]  = useState<User | null>(null);
  const [tab,   setTab]   = useState<Tab>("orders");

  // login
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  // pin
  const [pin,    setPin]    = useState("");
  const [pinErr, setPinErr] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) { setUser(data.session.user); setStage("pin"); }
      else setStage("login");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) { setUser(s.user); setStage("pin"); }
      else { setUser(null); setStage("login"); setPin(""); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr(""); setLoginBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginErr(error.message);
    setLoginBusy(false);
  }

  function handlePin(e: React.FormEvent) {
    e.preventDefault();
    if (pin === process.env.NEXT_PUBLIC_ADMIN_PIN) { setPinErr(false); setStage("dashboard"); }
    else { setPinErr(true); setPin(""); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setStage("login"); setPin("");
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (stage === "loading") return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Login ────────────────────────────────────────────────────────────────────
  if (stage === "login") return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-400/20 mb-5">
            <span className="text-2xl">🛸</span>
          </div>
          <p className="text-orange-400 font-black tracking-widest text-xs uppercase mb-1">Starscraft</p>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-white/35 text-sm mt-1">Restricted access only</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-3">
          <input type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" className={inp} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" className={inp} />
          {loginErr && <p className="text-red-400 text-xs bg-red-400/8 border border-red-400/20 rounded-xl px-4 py-2.5">{loginErr}</p>}
          <button type="submit" disabled={loginBusy} className={`${btn} w-full mt-1`}>
            {loginBusy ? <span className="inline-flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in…</span> : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );

  // ── PIN ──────────────────────────────────────────────────────────────────────
  if (stage === "pin") return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-500/10 border border-orange-400/20 mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <p className="text-white/40 text-xs mb-1">Signed in as</p>
          <p className="text-white text-sm font-medium">{user?.email}</p>
          <h1 className="text-xl font-bold text-white mt-5">Admin PIN</h1>
          <p className="text-white/35 text-sm mt-1">Enter your 5-digit PIN to continue</p>
        </div>
        <form onSubmit={handlePin} className="space-y-3">
          <input
            type="password" inputMode="numeric" placeholder="• • • • •" maxLength={10}
            value={pin} onChange={e => setPin(e.target.value)} autoFocus
            className={`${inp} text-center tracking-[0.4em] text-lg font-mono ${pinErr ? "border-red-400/50" : ""}`}
          />
          {pinErr && <p className="text-red-400 text-xs text-center">Incorrect PIN — try again.</p>}
          <button type="submit" className={`${btn} w-full`}>Enter Dashboard</button>
          <button type="button" onClick={signOut} className="w-full py-2 text-white/25 hover:text-white/50 text-sm transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  // ── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07070f] text-[#ededed] flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-white/8 flex flex-col">
        <div className="px-5 py-5 border-b border-white/8">
          <p className="text-orange-400 font-black tracking-widest text-[10px] uppercase mb-0.5">Starscraft</p>
          <p className="text-white font-bold text-base leading-tight">Admin</p>
        </div>
        <nav className="flex-1 py-3 px-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all ${
                tab === t.key
                  ? "bg-orange-500/12 text-orange-300 border border-orange-500/20"
                  : "text-white/40 hover:text-white/70 hover:bg-white/4"
              }`}>
              <span className="text-base leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/8">
          <p className="text-white/25 text-xs truncate mb-2">{user?.email}</p>
          <button onClick={signOut} className="w-full text-xs py-2 px-3 rounded-xl border border-white/10 text-white/35 hover:text-white/60 hover:border-white/20 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl">
          {tab === "orders"     && <OrdersTab />}
          {tab === "timelapses" && <TimeLapsesTab />}
          {tab === "options"    && <OptionsTab />}
          {tab === "reviews"    && <ReviewsTab />}
          {tab === "faq"        && <FaqTab />}
          {tab === "gallery"    && <GalleryTab />}
          {tab === "settings"   && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-7">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {count !== undefined && <p className="text-white/35 text-sm mt-0.5">{count} total</p>}
      </div>
      {action}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white/4 border border-white/8 rounded-2xl ${className}`}>{children}</div>;
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
function OrdersTab() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filter, setFilter] = useState<QuoteStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [priceModal, setPriceModal] = useState<Quote | null>(null);
  const [priceValue, setPriceValue] = useState("");
  const [priceMsg, setPriceMsg] = useState("");
  const [sendingPrice, setSendingPrice] = useState(false);
  const [priceSent, setPriceSent] = useState(false);
  const [waitTime, setWaitTime] = useState("48");

  useEffect(() => {
    supabase.from("quotes").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setQuotes(data); setLoading(false); });
    supabase.from("settings").select("value").eq("key", "wait_time_hours").single()
      .then(({ data }) => { if (data?.value) setWaitTime(data.value); });
  }, []);

  async function updateStatus(id: string, status: QuoteStatus) {
    await supabase.from("quotes").update({ status }).eq("id", id);
    setQuotes(q => q.map(x => x.id === id ? { ...x, status } : x));
  }

  async function sendPrice() {
    if (!priceModal || !priceValue) return;
    setSendingPrice(true);
    await fetch("/api/email/send-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_email: priceModal.email,
        customer_name: priceModal.name,
        order_id: priceModal.order_id,
        price: priceValue,
        message: priceMsg,
        wait_time_hours: waitTime,
      }),
    });
    // Advance status to approved
    await updateStatus(priceModal.id, "approved");
    setSendingPrice(false);
    setPriceSent(true);
    setTimeout(() => { setPriceModal(null); setPriceSent(false); setPriceValue(""); setPriceMsg(""); }, 1800);
  }

  const filtered = quotes.filter(q => {
    if (filter !== "all" && q.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return q.name.toLowerCase().includes(s) || q.email.toLowerCase().includes(s) || q.order_id.toLowerCase().includes(s);
    }
    return true;
  });

  // counts
  const counts = STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: quotes.filter(q => q.status === s).length }), {} as Record<QuoteStatus, number>);

  return (
    <div>
      <SectionHead title="Orders" count={quotes.length} />

      {/* Status pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filter === "all" ? "bg-white/10 text-white border-white/20" : "text-white/35 border-white/10 hover:border-white/20"}`}>
          All ({quotes.length})
        </button>
        {STATUS_ORDER.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filter === s ? `${STATUS_META[s].color}` : "text-white/35 border-white/10 hover:border-white/20"}`}>
            {STATUS_META[s].label} {counts[s] > 0 && `(${counts[s]})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <input placeholder="Search by name, email, or order ID…" value={search} onChange={e => setSearch(e.target.value)} className={`${inp} mb-5`} />

      {loading && <p className="text-white/30 text-sm">Loading…</p>}
      {!loading && filtered.length === 0 && <p className="text-white/30 text-sm">No orders match.</p>}

      <div className="flex flex-col gap-3">
        {filtered.map(q => {
          const m = STATUS_META[q.status];
          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-orange-400 font-black tracking-widest text-xs">{q.order_id || "NO-ID"}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${m.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                      {m.label}
                    </span>
                  </div>
                  <p className="text-white font-semibold">{q.name}</p>
                  <p className="text-white/40 text-xs">{q.email}</p>
                </div>
                <select value={q.status} onChange={e => updateStatus(q.id, e.target.value as QuoteStatus)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-white/80 text-xs outline-none cursor-pointer flex-shrink-0">
                  {STATUS_ORDER.map(s => <option key={s} value={s} className="bg-[#111]">{STATUS_META[s].label}</option>)}
                </select>
              </div>
              <div className="mt-3 pt-3 border-t border-white/6 flex flex-wrap gap-4 text-xs text-white/45">
                <span>Qty: <span className="text-white/70">{q.quantity}</span></span>
                <span>Color: <span className="text-white/70">{q.color || "—"}</span></span>
                <span>Material: <span className="text-white/70">{q.material || "—"}</span></span>
                {q.nfc_chip && <span className="text-orange-400 font-medium">+ NFC Chip</span>}
                <span className="text-white/25">{new Date(q.created_at).toLocaleDateString()}</span>
              </div>
              {q.model_url && (
                <a href={q.model_url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline block truncate transition-colors">
                  {q.model_url}
                </a>
              )}
              {q.customizations && (
                <p className="mt-2 text-xs text-white/35 italic bg-white/3 rounded-lg px-3 py-2">{q.customizations}</p>
              )}
              <div className="mt-3 pt-3 border-t border-white/6">
                <button onClick={() => { setPriceModal(q); setPriceSent(false); }}
                  className="px-4 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-xs font-semibold rounded-xl transition-all">
                  💌 Send Price Quote
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Send Price Modal ───────────────────────────────────────────────── */}
      {priceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-bold text-lg">Send Price Quote</h3>
                <p className="text-white/40 text-xs mt-0.5">{priceModal.name} · {priceModal.order_id}</p>
              </div>
              <button onClick={() => setPriceModal(null)} className="text-white/30 hover:text-white text-xl transition-colors">×</button>
            </div>
            {priceSent ? (
              <div className="text-center py-8">
                <p className="text-green-400 text-2xl mb-2">✓</p>
                <p className="text-white font-semibold">Price quote sent!</p>
                <p className="text-white/40 text-sm mt-1">Order marked as Approved.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Quoted Price *</label>
                  <input placeholder="e.g. $24.99" value={priceValue} onChange={e => setPriceValue(e.target.value)}
                    className={inp} autoFocus />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Message to customer (optional)</label>
                  <textarea rows={3} placeholder="Add any notes about the quote…" value={priceMsg}
                    onChange={e => setPriceMsg(e.target.value)} className={`${inp} resize-none`} />
                </div>
                <p className="text-white/30 text-xs">
                  Email will be sent to <span className="text-white/60">{priceModal.email}</span> with {waitTime}h tracking estimate.
                </p>
                <button onClick={sendPrice} disabled={sendingPrice || !priceValue}
                  className={`${btn} w-full mt-1 disabled:opacity-40`}>
                  {sendingPrice ? "Sending…" : "Send Price Quote →"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TIME LAPSES ──────────────────────────────────────────────────────────────
function TimeLapsesTab() {
  const [items, setItems] = useState<TimeLapse[]>([]);
  const [form, setForm] = useState({ title: "", caption: "", video_url: "", material_tag: "", color_tag: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("time_lapses").select("*").order("sort_order")
      .then(({ data }) => { if (data) setItems(data); });
  }, []);

  async function add() {
    if (!form.title || !form.video_url) return;
    setBusy(true);
    const { data } = await supabase.from("time_lapses").insert({ ...form, visible: true, sort_order: items.length }).select().single();
    if (data) setItems(i => [...i, data]);
    setForm({ title: "", caption: "", video_url: "", material_tag: "", color_tag: "" });
    setBusy(false);
  }

  async function toggle(id: string, visible: boolean) {
    await supabase.from("time_lapses").update({ visible }).eq("id", id);
    setItems(i => i.map(x => x.id === id ? { ...x, visible } : x));
  }

  async function remove(id: string) {
    await supabase.from("time_lapses").delete().eq("id", id);
    setItems(i => i.filter(x => x.id !== id));
  }

  return (
    <div>
      <SectionHead title="Time Lapses" count={items.length} />
      <Card className="p-5 mb-6">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-4 font-semibold">Add new video</p>
        <div className="flex flex-col gap-3">
          <input placeholder="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inp} />
          <input placeholder="Caption (optional)" value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} className={inp} />
          <input placeholder="Video URL (MP4 / YouTube) *" value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} className={inp} />
          <div className="flex gap-3">
            <input placeholder="Material tag" value={form.material_tag} onChange={e => setForm(p => ({ ...p, material_tag: e.target.value }))} className={inp} />
            <input placeholder="Color tag" value={form.color_tag} onChange={e => setForm(p => ({ ...p, color_tag: e.target.value }))} className={inp} />
          </div>
          <button onClick={add} disabled={busy} className={`${btn} self-start`}>
            {busy ? "Adding…" : "Add Video"}
          </button>
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        {items.map(item => (
          <Card key={item.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{item.title}</p>
              {item.caption && <p className="text-white/35 text-xs mt-0.5">{item.caption}</p>}
              <p className="text-white/20 text-xs truncate mt-1">{item.video_url}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {item.material_tag && <span className="text-xs px-2 py-0.5 rounded-full bg-white/6 text-white/40">{item.material_tag}</span>}
              {item.color_tag    && <span className="text-xs px-2 py-0.5 rounded-full bg-white/6 text-white/40">{item.color_tag}</span>}
              <button onClick={() => toggle(item.id, !item.visible)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${item.visible ? "bg-green-500/15 text-green-400 border border-green-500/25" : "bg-white/6 text-white/30 border border-white/10"}`}>
                {item.visible ? "Visible" : "Hidden"}
              </button>
              <button onClick={() => remove(item.id)} className="text-white/20 hover:text-red-400 text-sm transition-colors">×</button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="text-white/25 text-sm">No videos yet.</p>}
      </div>
    </div>
  );
}

// ─── COLORS & MATERIALS ───────────────────────────────────────────────────────
function OptionsTab() {
  const [options, setOptions] = useState<AdminOption[]>([]);
  const [label, setLabel] = useState("");
  const [type, setType]   = useState<"color" | "material">("color");

  useEffect(() => {
    supabase.from("admin_options").select("*").order("label")
      .then(({ data }) => { if (data) setOptions(data); });
  }, []);

  async function add() {
    if (!label.trim()) return;
    const value = label.toLowerCase().replace(/\s+/g, "-");
    const { data } = await supabase.from("admin_options").insert({ label, value, type }).select().single();
    if (data) setOptions(o => [...o, data]);
    setLabel("");
  }

  async function remove(id: string) {
    await supabase.from("admin_options").delete().eq("id", id);
    setOptions(o => o.filter(x => x.id !== id));
  }

  const colors    = options.filter(o => o.type === "color");
  const materials = options.filter(o => o.type === "material");

  return (
    <div>
      <SectionHead title="Colors & Materials" />
      <Card className="p-5 mb-8">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-4 font-semibold">Add option</p>
        <div className="flex gap-3">
          <select value={type} onChange={e => setType(e.target.value as "color" | "material")}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-orange-400/50 transition-colors">
            <option value="color" className="bg-[#111]">Color</option>
            <option value="material" className="bg-[#111]">Material</option>
          </select>
          <input placeholder="Label (e.g. Matte Black)" value={label} onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()} className={`${inp} flex-1`} />
          <button onClick={add} className={btn}>Add</button>
        </div>
      </Card>

      {[{ label: "Colors", items: colors }, { label: "Materials", items: materials }].map(({ label: g, items }) => (
        <div key={g} className="mb-7">
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">{g} ({items.length})</p>
          <div className="flex flex-wrap gap-2">
            {items.map(o => (
              <div key={o.id} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 group">
                <span className="text-white/75 text-sm">{o.label}</span>
                <button onClick={() => remove(o.id)} className="text-white/20 group-hover:text-red-400 transition-colors text-xs leading-none ml-1">×</button>
              </div>
            ))}
            {items.length === 0 && <p className="text-white/25 text-sm">None added yet.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  useEffect(() => {
    supabase.from("reviews").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setReviews(data); });
  }, []);

  async function approve(id: string, approved: boolean) {
    await supabase.from("reviews").update({ approved }).eq("id", id);
    setReviews(r => r.map(x => x.id === id ? { ...x, approved } : x));
  }

  async function remove(id: string) {
    await supabase.from("reviews").delete().eq("id", id);
    setReviews(r => r.filter(x => x.id !== id));
  }

  const filtered = reviews.filter(r =>
    filter === "all" ? true : filter === "pending" ? !r.approved : r.approved
  );

  const pending  = reviews.filter(r => !r.approved).length;
  const approved = reviews.filter(r => r.approved).length;

  return (
    <div>
      <SectionHead title="Reviews" count={reviews.length} />

      <div className="flex gap-2 mb-5">
        {([["all", `All (${reviews.length})`], ["pending", `Pending (${pending})`], ["approved", `Approved (${approved})`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filter === k ? "bg-orange-500/15 text-orange-300 border-orange-500/25" : "text-white/35 border-white/10 hover:border-white/20"}`}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-white/25 text-sm">No reviews here.</p>}
      <div className="flex flex-col gap-3">
        {filtered.map(r => (
          <Card key={r.id} className="p-5 flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-medium text-sm">{r.name}</p>
                <span className="text-orange-400 text-xs">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              <p className="text-white/55 text-sm leading-relaxed">{r.comment}</p>
              <p className="text-white/20 text-xs mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => approve(r.id, !r.approved)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-all ${r.approved ? "bg-green-500/15 text-green-400 border-green-500/25" : "bg-white/6 text-white/40 border-white/10 hover:border-green-500/25 hover:text-green-400"}`}>
                {r.approved ? "✓ Approved" : "Approve"}
              </button>
              <button onClick={() => remove(r.id)} className="text-xs px-3 py-1.5 rounded-xl border border-white/8 text-white/25 hover:text-red-400 hover:border-red-400/25 transition-all">
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FaqTab() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [q, setQ] = useState(""); const [a, setA] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("faq").select("*").order("sort_order").then(({ data }) => { if (data) setItems(data); });
  }, []);

  async function add() {
    if (!q.trim() || !a.trim()) return;
    setBusy(true);
    const { data } = await supabase.from("faq").insert({ question: q, answer: a, sort_order: items.length }).select().single();
    if (data) setItems(i => [...i, data]);
    setQ(""); setA(""); setBusy(false);
  }

  async function remove(id: string) {
    await supabase.from("faq").delete().eq("id", id);
    setItems(i => i.filter(x => x.id !== id));
  }

  return (
    <div>
      <SectionHead title="FAQ" count={items.length} />
      <Card className="p-5 mb-6">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-4 font-semibold">New entry</p>
        <div className="flex flex-col gap-3">
          <input placeholder="Question *" value={q} onChange={e => setQ(e.target.value)} className={inp} />
          <textarea placeholder="Answer *" rows={3} value={a} onChange={e => setA(e.target.value)}
            className={`${inp} resize-none`} />
          <button onClick={add} disabled={busy} className={`${btn} self-start`}>{busy ? "Adding…" : "Add Entry"}</button>
        </div>
      </Card>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <Card key={item.id} className="p-5 flex gap-4">
            <span className="text-white/20 text-sm font-mono flex-shrink-0 mt-0.5">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{item.question}</p>
              <p className="text-white/45 text-sm mt-1.5 leading-relaxed">{item.answer}</p>
            </div>
            <button onClick={() => remove(item.id)} className="text-white/20 hover:text-red-400 text-sm transition-colors flex-shrink-0 self-start">×</button>
          </Card>
        ))}
        {items.length === 0 && <p className="text-white/25 text-sm">No FAQ entries yet.</p>}
      </div>
    </div>
  );
}

// ─── GALLERY ──────────────────────────────────────────────────────────────────
const CATEGORIES = ["Toys", "Tools", "Décor", "Art", "Other"];

function GalleryTab() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [form, setForm] = useState({ title: "", image_url: "", material: "", category: "Other" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("gallery").select("*").order("sort_order").then(({ data }) => { if (data) setItems(data); });
  }, []);

  async function add() {
    if (!form.title || !form.image_url) return;
    setBusy(true);
    const { data } = await supabase.from("gallery").insert({ ...form, visible: true, sort_order: items.length }).select().single();
    if (data) setItems(i => [...i, data]);
    setForm({ title: "", image_url: "", material: "", category: "Other" });
    setBusy(false);
  }

  async function toggle(id: string, visible: boolean) {
    await supabase.from("gallery").update({ visible }).eq("id", id);
    setItems(i => i.map(x => x.id === id ? { ...x, visible } : x));
  }

  async function remove(id: string) {
    await supabase.from("gallery").delete().eq("id", id);
    setItems(i => i.filter(x => x.id !== id));
  }

  return (
    <div>
      <SectionHead title="Gallery" count={items.length} />
      <Card className="p-5 mb-6">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-4 font-semibold">Add item</p>
        <div className="flex flex-col gap-3">
          <input placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} />
          <input placeholder="Image URL *" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className={inp} />
          <div className="flex gap-3">
            <input placeholder="Material" value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} className={`${inp} flex-1`} />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-orange-400/50 transition-colors">
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
            </select>
          </div>
          <button onClick={add} disabled={busy} className={`${btn} self-start`}>{busy ? "Adding…" : "Add Item"}</button>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt={item.title} className="w-full aspect-square object-cover" />
            <div className="p-3">
              <p className="text-white text-xs font-medium truncate">{item.title}</p>
              {item.category && <p className="text-white/30 text-xs">{item.category}{item.material ? ` · ${item.material}` : ""}</p>}
              <div className="flex gap-2 mt-2">
                <button onClick={() => toggle(item.id, !item.visible)}
                  className={`flex-1 text-xs py-1 rounded-lg font-medium transition-all ${item.visible ? "bg-green-500/15 text-green-400" : "bg-white/6 text-white/30"}`}>
                  {item.visible ? "Visible" : "Hidden"}
                </button>
                <button onClick={() => remove(item.id)} className="text-xs px-2 py-1 rounded-lg bg-white/4 text-white/25 hover:text-red-400 transition-colors">×</button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-white/25 text-sm col-span-3">No gallery items yet.</p>}
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsTab() {
  const [waitTime, setWaitTime] = useState("48");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("value").eq("key", "wait_time_hours").single()
      .then(({ data }) => { if (data?.value) setWaitTime(data.value); });
  }, []);

  async function save() {
    setBusy(true);
    await supabase.from("settings").upsert({ key: "wait_time_hours", value: waitTime });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <SectionHead title="Settings" />

      <Card className="p-6 max-w-lg">
        <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-5">Order Fulfillment</p>

        <div className="mb-5">
          <label className="text-white/70 text-sm font-medium block mb-2">
            Tracking Wait Time (hours)
          </label>
          <p className="text-white/35 text-xs mb-3">
            Shown to customers after they submit a quote and receive a price. Displayed as:<br/>
            <span className="text-orange-400/70 italic">"You will receive your tracking order in X hours"</span>
          </p>
          <div className="flex gap-3 items-center">
            <input
              type="number" min={1} max={999} value={waitTime}
              onChange={e => setWaitTime(e.target.value)}
              className={`${inp} w-32`}
            />
            <span className="text-white/40 text-sm">hours</span>
          </div>
        </div>

        <button onClick={save} disabled={busy} className={`${btn} ${saved ? "bg-green-500 hover:bg-green-400" : ""}`}>
          {saved ? "✓ Saved!" : busy ? "Saving…" : "Save Settings"}
        </button>
      </Card>

      {/* Email info */}
      <Card className="p-6 max-w-lg mt-6">
        <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-4">Email Configuration</p>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-white/6">
            <span className="text-white/40">Admin notifications to</span>
            <span className="text-white/80 font-mono text-xs">starscraft3d@gmail.com</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/6">
            <span className="text-white/40">Emails sent from</span>
            <span className="text-white/80 font-mono text-xs">noreply@starscraft3d.com</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-white/40">Reply-to</span>
            <span className="text-white/80 font-mono text-xs">starscraft3d@gmail.com</span>
          </div>
        </div>
        <p className="text-white/25 text-xs mt-4">
          To change email settings, update your Resend API key and domain in environment variables.
        </p>
      </Card>
    </div>
  );
}
