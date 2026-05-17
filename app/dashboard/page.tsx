"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Quote, QuoteStatus, TimeLapse, AdminOption } from "@/lib/supabase";

const ADMIN_EMAIL = "starscraft3d@gmail.com";
const PIN_KEY = "sc_pin_ok";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  received: "Received",
  approved: "Approved",
  printing: "Printing",
  quality_check: "Quality Check",
  ready: "Ready",
  shipped: "Shipped",
};

const STATUS_COLORS: Record<QuoteStatus, string> = {
  received: "bg-blue-500/20 text-blue-300",
  approved: "bg-purple-500/20 text-purple-300",
  printing: "bg-orange-500/20 text-orange-300",
  quality_check: "bg-yellow-500/20 text-yellow-300",
  ready: "bg-green-500/20 text-green-300",
  shipped: "bg-white/10 text-white/40",
};

type Tab = "orders" | "timelapses" | "options" | "reviews" | "faq" | "gallery";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [pinVerified, setPinVerified] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<Tab>("orders");
  const [otherSession, setOtherSession] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Redirect non-admins
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [user, isAdmin, loading, router]);

  // Check sessionStorage for PIN
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(PIN_KEY) === "true") {
      setPinVerified(true);
    }
  }, []);

  // Concurrent session detection via Realtime presence
  useEffect(() => {
    if (!pinVerified || !user) return;

    const channel = supabase.channel("admin-presence", {
      config: { presence: { key: user.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      setOtherSession(count > 1);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ user_id: user.id, joined_at: Date.now() });
      }
    });

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [pinVerified, user]);

  function handlePin(e: React.FormEvent) {
    e.preventDefault();
    if (pin === (process.env.NEXT_PUBLIC_ADMIN_PIN ?? "").replace(/^﻿/, "").trim()) {
      sessionStorage.setItem(PIN_KEY, "true");
      setPinVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  // ── PIN overlay
  if (!pinVerified) {
    return (
      <>
        <div className="pointer-events-none fixed inset-0 z-0 grid-bg" />
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] z-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(251,146,60,0.07) 0%, transparent 65%)" }}
        />
        <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 border border-orange-400/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-400 text-xl">🔒</span>
              </div>
              <p className="text-white/40 text-sm">Signed in as</p>
              <p className="text-white text-sm font-medium mt-0.5">{user?.email}</p>
              <h1 className="text-2xl font-bold text-white mt-4">Dashboard PIN</h1>
              <p className="text-white/40 text-sm mt-1">One more step to access the dashboard</p>
            </div>
            <form onSubmit={handlePin} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={e => setPin(e.target.value)}
                autoFocus
                inputMode="numeric"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors text-center tracking-widest text-lg font-mono ${
                  pinError ? "border-red-400/50" : "border-white/10 focus:border-orange-400/50"
                }`}
              />
              {pinError && (
                <p className="text-red-400 text-xs text-center">Incorrect PIN. Try again.</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-colors"
              >
                Unlock Dashboard
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full py-2 text-white/30 hover:text-white/60 text-sm transition-colors"
              >
                Back to site
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ── Full dashboard
  const tabs: { key: Tab; label: string }[] = [
    { key: "orders", label: "Orders" },
    { key: "timelapses", label: "Time Lapses" },
    { key: "options", label: "Colors & Materials" },
    { key: "reviews", label: "Reviews" },
    { key: "faq", label: "FAQ" },
    { key: "gallery", label: "Gallery" },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen">
        {/* Concurrent session warning */}
        {otherSession && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-yellow-500/10 border border-yellow-400/30 text-yellow-300 text-xs font-mono px-5 py-2.5 rounded-full backdrop-blur-xl flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping inline-block" />
            Another session is active on this account
          </div>
        )}

        {/* Dashboard header */}
        <div className="border-b border-white/5 bg-[#05050a]/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 pt-8 pb-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-mono tracking-widest text-orange-400/70 uppercase mb-1">// Admin</p>
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 overflow-x-auto pb-px scrollbar-none">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2.5 text-xs font-mono tracking-wide whitespace-nowrap transition-all border-b-2 ${
                    tab === t.key
                      ? "text-orange-400 border-orange-400"
                      : "text-white/40 border-transparent hover:text-white/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {tab === "orders"     && <OrdersTab />}
          {tab === "timelapses" && <TimeLapsesTab />}
          {tab === "options"    && <OptionsTab />}
          {tab === "reviews"    && <ReviewsTab />}
          {tab === "faq"        && <FaqTab />}
          {tab === "gallery"    && <GalleryTab />}
        </div>
      </main>
    </>
  );
}

// ─── Shared input style ────────────────────────────────────────────────────────
const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[#e8eaf0] text-sm outline-none focus:border-orange-400/40 transition-colors";

// ─── Orders ───────────────────────────────────────────────────────────────────
function OrdersTab() {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    supabase.from("quotes").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setQuotes(data);
    });
  }, []);

  async function updateStatus(id: string, status: QuoteStatus) {
    await supabase.from("quotes").update({ status }).eq("id", id);
    setQuotes(q => q.map(x => x.id === id ? { ...x, status } : x));
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-6">All Orders ({quotes.length})</h2>
      {quotes.length === 0 && <p className="text-white/30 text-sm">No orders yet.</p>}
      <div className="flex flex-col gap-4">
        {quotes.map(q => (
          <div key={q.id} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-orange-400 font-black tracking-widest text-sm">{q.order_id}</p>
                <p className="text-white font-semibold">{q.name}</p>
                <p className="text-white/40 text-xs">{q.email}</p>
              </div>
              <select
                value={q.status}
                onChange={e => updateStatus(q.id, e.target.value as QuoteStatus)}
                className={`text-xs px-3 py-1.5 rounded-full border-0 outline-none font-medium cursor-pointer ${STATUS_COLORS[q.status]}`}
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-[#1a1a1a] text-white">{v}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
              <span>Qty: {q.quantity}</span>
              <span>Color: {q.color}</span>
              <span>Material: {q.material}</span>
              {q.nfc_chip && <span className="text-orange-400">+ NFC Chip</span>}
            </div>
            <a href={q.model_url} target="_blank" rel="noopener noreferrer"
              className="mt-2 text-xs text-blue-400 underline block truncate">{q.model_url}</a>
            {q.customizations && <p className="mt-2 text-xs text-white/40 italic">{q.customizations}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Time Lapses ──────────────────────────────────────────────────────────────
function TimeLapsesTab() {
  const [items, setItems] = useState<TimeLapse[]>([]);
  const [form, setForm] = useState({ title: "", caption: "", video_url: "", material_tag: "", color_tag: "" });

  useEffect(() => {
    supabase.from("time_lapses").select("*").order("sort_order").then(({ data }) => {
      if (data) setItems(data);
    });
  }, []);

  async function add() {
    if (!form.title || !form.video_url) return;
    const { data } = await supabase.from("time_lapses").insert({ ...form, visible: true, sort_order: items.length }).select().single();
    if (data) setItems(i => [...i, data]);
    setForm({ title: "", caption: "", video_url: "", material_tag: "", color_tag: "" });
  }

  async function toggleVisible(id: string, visible: boolean) {
    await supabase.from("time_lapses").update({ visible }).eq("id", id);
    setItems(i => i.map(x => x.id === id ? { ...x, visible } : x));
  }

  async function remove(id: string) {
    await supabase.from("time_lapses").delete().eq("id", id);
    setItems(i => i.filter(x => x.id !== id));
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-6">Time Lapses</h2>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6 flex flex-col gap-3">
        <p className="text-white/50 text-sm font-medium">Add new video</p>
        {[
          { key: "title",     placeholder: "Title" },
          { key: "caption",   placeholder: "Caption (optional)" },
          { key: "video_url", placeholder: "Video URL (MP4 or YouTube)" },
        ].map(f => (
          <input key={f.key} placeholder={f.placeholder} value={form[f.key as keyof typeof form]}
            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className={inp} />
        ))}
        <div className="flex gap-3">
          <input placeholder="Material tag (e.g. PLA)" value={form.material_tag}
            onChange={e => setForm(p => ({ ...p, material_tag: e.target.value }))} className={`${inp} flex-1`} />
          <input placeholder="Color tag (e.g. Black)" value={form.color_tag}
            onChange={e => setForm(p => ({ ...p, color_tag: e.target.value }))} className={`${inp} flex-1`} />
        </div>
        <button onClick={add} className="self-start px-5 py-2 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl text-sm transition-colors">
          Add Video
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-3">
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{item.title}</p>
              {item.caption && <p className="text-white/40 text-xs">{item.caption}</p>}
              <p className="text-white/30 text-xs truncate mt-1">{item.video_url}</p>
            </div>
            <button onClick={() => toggleVisible(item.id, !item.visible)}
              className={`text-xs px-3 py-1 rounded-full font-medium ${item.visible ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/30"}`}>
              {item.visible ? "Visible" : "Hidden"}
            </button>
            <button onClick={() => remove(item.id)} className="text-red-400/60 hover:text-red-400 text-xs">Remove</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-white/30 text-sm">No videos added yet.</p>}
      </div>
    </div>
  );
}

// ─── Colors & Materials ───────────────────────────────────────────────────────
function OptionsTab() {
  const [options, setOptions] = useState<AdminOption[]>([]);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<"color" | "material">("color");

  useEffect(() => {
    supabase.from("admin_options").select("*").order("label").then(({ data }) => {
      if (data) setOptions(data);
    });
  }, []);

  async function add() {
    if (!label) return;
    const { data } = await supabase.from("admin_options").insert({ label, value: value || label.toLowerCase().replace(/\s+/g, "-"), type }).select().single();
    if (data) setOptions(o => [...o, data]);
    setLabel(""); setValue("");
  }

  async function remove(id: string) {
    await supabase.from("admin_options").delete().eq("id", id);
    setOptions(o => o.filter(x => x.id !== id));
  }

  const colors = options.filter(o => o.type === "color");
  const materials = options.filter(o => o.type === "material");

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col gap-3">
        <p className="text-white/50 text-sm font-medium">Add option</p>
        <div className="flex gap-3">
          <select value={type} onChange={e => setType(e.target.value as "color" | "material")}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none">
            <option value="color" className="bg-[#1a1a1a]">Color</option>
            <option value="material" className="bg-[#1a1a1a]">Material</option>
          </select>
          <input placeholder="Label (e.g. Matte Black)" value={label} onChange={e => setLabel(e.target.value)}
            className={`${inp} flex-1`} />
          <button onClick={add} className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl text-sm transition-colors whitespace-nowrap">
            Add
          </button>
        </div>
      </div>
      {[{ label: "Colors", items: colors }, { label: "Materials", items: materials }].map(({ label: g, items }) => (
        <div key={g}>
          <h3 className="text-white font-semibold mb-3">{g}</h3>
          <div className="flex flex-wrap gap-2">
            {items.map(o => (
              <div key={o.id} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-full px-4 py-1.5">
                <span className="text-white/80 text-sm">{o.label}</span>
                <button onClick={() => remove(o.id)} className="text-white/30 hover:text-red-400 text-xs leading-none">×</button>
              </div>
            ))}
            {items.length === 0 && <p className="text-white/30 text-sm">None added yet.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews] = useState<{ id: string; name: string; rating: number; comment: string; approved: boolean }[]>([]);

  useEffect(() => {
    supabase.from("reviews").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setReviews(data);
    });
  }, []);

  async function approve(id: string, approved: boolean) {
    await supabase.from("reviews").update({ approved }).eq("id", id);
    setReviews(r => r.map(x => x.id === id ? { ...x, approved } : x));
  }

  async function remove(id: string) {
    await supabase.from("reviews").delete().eq("id", id);
    setReviews(r => r.filter(x => x.id !== id));
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-6">Reviews</h2>
      {reviews.length === 0 && <p className="text-white/30 text-sm">No reviews yet.</p>}
      <div className="flex flex-col gap-3">
        {reviews.map(r => (
          <div key={r.id} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex gap-4 items-start">
            <div className="flex-1">
              <p className="text-white font-medium">{r.name} — {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
              <p className="text-white/60 text-sm mt-1">{r.comment}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => approve(r.id, !r.approved)}
                className={`text-xs px-3 py-1 rounded-full font-medium ${r.approved ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>
                {r.approved ? "Approved" : "Approve"}
              </button>
              <button onClick={() => remove(r.id)} className="text-xs text-red-400/60 hover:text-red-400">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FaqTab() {
  const [items, setItems] = useState<{ id: string; question: string; answer: string; sort_order: number }[]>([]);
  const [q, setQ] = useState(""); const [a, setA] = useState("");

  useEffect(() => {
    supabase.from("faq").select("*").order("sort_order").then(({ data }) => { if (data) setItems(data); });
  }, []);

  async function add() {
    if (!q || !a) return;
    const { data } = await supabase.from("faq").insert({ question: q, answer: a, sort_order: items.length }).select().single();
    if (data) setItems(i => [...i, data]);
    setQ(""); setA("");
  }

  async function remove(id: string) {
    await supabase.from("faq").delete().eq("id", id);
    setItems(i => i.filter(x => x.id !== id));
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-6">FAQ</h2>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6 flex flex-col gap-3">
        <input placeholder="Question" value={q} onChange={e => setQ(e.target.value)} className={inp} />
        <textarea placeholder="Answer" rows={3} value={a} onChange={e => setA(e.target.value)}
          className={`${inp} resize-none`} />
        <button onClick={add} className="self-start px-5 py-2 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl text-sm transition-colors">
          Add
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(item => (
          <div key={item.id} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex gap-4">
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{item.question}</p>
              <p className="text-white/50 text-sm mt-1">{item.answer}</p>
            </div>
            <button onClick={() => remove(item.id)} className="text-red-400/60 hover:text-red-400 text-xs self-start">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
function GalleryTab() {
  const [items, setItems] = useState<{ id: string; title: string; image_url: string; material: string | null; category: string | null; visible: boolean; sort_order: number }[]>([]);
  const [form, setForm] = useState({ title: "", image_url: "", material: "", category: "Other" });

  useEffect(() => {
    supabase.from("gallery").select("*").order("sort_order").then(({ data }) => { if (data) setItems(data); });
  }, []);

  async function add() {
    if (!form.title || !form.image_url) return;
    const { data } = await supabase.from("gallery").insert({ ...form, visible: true, sort_order: items.length }).select().single();
    if (data) setItems(i => [...i, data]);
    setForm({ title: "", image_url: "", material: "", category: "Other" });
  }

  async function toggleVisible(id: string, visible: boolean) {
    await supabase.from("gallery").update({ visible }).eq("id", id);
    setItems(i => i.map(x => x.id === id ? { ...x, visible } : x));
  }

  async function remove(id: string) {
    await supabase.from("gallery").delete().eq("id", id);
    setItems(i => i.filter(x => x.id !== id));
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-6">Gallery</h2>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6 flex flex-col gap-3">
        <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} />
        <input placeholder="Image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className={inp} />
        <div className="flex gap-3">
          <input placeholder="Material (optional)" value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} className={`${inp} flex-1`} />
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
            {["Toys", "Tools", "Décor", "Other"].map(c => <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>)}
          </select>
        </div>
        <button onClick={add} className="self-start px-5 py-2 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl text-sm transition-colors">
          Add Item
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image_url} alt={item.title} className="w-full aspect-square object-cover" />
            <div className="p-3 flex items-center justify-between gap-2">
              <p className="text-white text-xs font-medium truncate">{item.title}</p>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggleVisible(item.id, !item.visible)}
                  className={`text-xs px-2 py-0.5 rounded-full ${item.visible ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/30"}`}>
                  {item.visible ? "On" : "Off"}
                </button>
                <button onClick={() => remove(item.id)} className="text-red-400/60 hover:text-red-400 text-xs">×</button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-white/30 text-sm col-span-3">No gallery items yet.</p>}
      </div>
    </div>
  );
}
