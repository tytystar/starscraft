"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type GalleryItem = {
  id: string; title: string; image_url: string;
  material: string | null; category: string | null;
};

const CATEGORIES = ["All", "Toys", "Tools", "Décor", "Other"];

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    supabase.from("gallery").select("*").eq("visible", true).order("sort_order")
      .then(({ data }) => { if (data) setItems(data); });
  }, []);

  const filtered = filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <section id="gallery" className="pb-24">
      {/* Filter bar */}
      <div className="flex gap-2 mb-10 flex-wrap">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-1.5 text-xs font-mono tracking-widest uppercase transition-all ${
              filter === c
                ? "bg-violet-500/20 border border-violet-500/50 text-violet-300"
                : "border border-white/8 text-white/30 hover:text-white/60 hover:border-white/20"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="relative border border-violet-500/10 bg-violet-500/[0.02] py-28 flex flex-col items-center gap-4">
          <div className="absolute top-0 left-0 w-6 h-6" style={{ borderTop: "1px solid rgba(139,92,246,0.3)", borderLeft: "1px solid rgba(139,92,246,0.3)" }} />
          <div className="absolute top-0 right-0 w-6 h-6" style={{ borderTop: "1px solid rgba(139,92,246,0.3)", borderRight: "1px solid rgba(139,92,246,0.3)" }} />
          <div className="absolute bottom-0 left-0 w-6 h-6" style={{ borderBottom: "1px solid rgba(139,92,246,0.3)", borderLeft: "1px solid rgba(139,92,246,0.3)" }} />
          <div className="absolute bottom-0 right-0 w-6 h-6" style={{ borderBottom: "1px solid rgba(139,92,246,0.3)", borderRight: "1px solid rgba(139,92,246,0.3)" }} />
          <p className="text-violet-400/30 text-4xl font-black tracking-widest">◈</p>
          <p className="text-white/20 text-xs font-mono tracking-widest">// DATABASE EMPTY — PRINTS INCOMING</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <div key={item.id}
              className="group relative aspect-square overflow-hidden border border-white/8 hover:border-violet-500/30 transition-all"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div>
                  <p className="text-white font-mono text-xs font-bold tracking-wide">{item.title}</p>
                  {item.material && <p className="text-white/50 text-xs font-mono">{item.material}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
