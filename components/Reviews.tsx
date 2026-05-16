"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Star } from "lucide-react";

type Review = { id: string; name: string; rating: number; comment: string; created_at: string };

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", rating: 5, comment: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.from("reviews").select("*").eq("approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setReviews(data); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("reviews").insert({ ...form, approved: false });
    setSubmitted(true);
  }

  return (
    <section id="reviews" className="max-w-7xl mx-auto px-6 py-28">
      {/* Header */}
      <div className="flex items-center gap-4 mb-16">
        <div className="neon-line flex-1" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-orange-400/60 text-xs font-mono tracking-widest uppercase">Transmissions</p>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">WHAT THEY SAY</h2>
        </div>
        <div className="neon-line flex-1" />
      </div>

      {/* Leave review toggle */}
      {!submitted && (
        <div className="mb-10 flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs font-mono tracking-widest text-orange-400/60 hover:text-orange-400 border border-orange-500/20 hover:border-orange-500/50 px-4 py-2 transition-all"
          >
            {showForm ? "— CANCEL" : "+ LEAVE REVIEW"}
          </button>
        </div>
      )}

      {showForm && !submitted && (
        <form onSubmit={handleSubmit}
          className="mb-10 border border-white/8 bg-white/[0.02] p-6 flex flex-col gap-4">
          <p className="text-xs font-mono text-orange-400/50 tracking-widest">// NEW TRANSMISSION</p>
          <input required placeholder="Your name" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-transparent border-b border-white/10 focus:border-orange-500/40 py-2 text-white text-sm font-mono outline-none transition-colors placeholder:text-white/20" />
          <div className="flex items-center gap-3">
            <span className="text-white/25 text-xs font-mono">RATING</span>
            {[1,2,3,4,5].map((n) => (
              <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, rating: n }))}>
                <Star size={18} className={n <= form.rating ? "text-orange-400 fill-orange-400" : "text-white/10"} />
              </button>
            ))}
          </div>
          <textarea required rows={3} placeholder="Your experience..."
            value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            className="bg-transparent border-b border-white/10 focus:border-orange-500/40 py-2 text-white text-sm font-mono outline-none transition-colors resize-none placeholder:text-white/20" />
          <button type="submit"
            className="self-start px-6 py-2 bg-orange-500 hover:bg-orange-400 text-white font-mono text-xs tracking-widest uppercase transition-colors">
            TRANSMIT
          </button>
        </form>
      )}

      {submitted && (
        <p className="mb-10 text-green-400 text-xs font-mono border border-green-500/20 bg-green-500/5 px-4 py-3 tracking-wide">
          // RECEIVED — Your review is pending approval.
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-16 border border-white/5 bg-white/[0.01]">
          <p className="text-white/20 text-xs font-mono tracking-widest">// NO TRANSMISSIONS YET — BE THE FIRST</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r) => (
            <div key={r.id}
              className="relative border border-white/8 bg-white/[0.02] hover:border-orange-500/20 p-5 flex flex-col gap-3 transition-all group"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-b border-l border-orange-500/20 group-hover:border-orange-500/40 transition-colors" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className={i < r.rating ? "text-orange-400 fill-orange-400" : "text-white/10"} />
                ))}
              </div>
              <p className="text-white/50 text-sm leading-relaxed flex-1">&ldquo;{r.comment}&rdquo;</p>
              <p className="text-orange-400/50 text-xs font-mono tracking-wide">{r.name}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
