"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown } from "lucide-react";

type FAQItem = { id: string; question: string; answer: string; sort_order: number };

export default function FAQ() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("faq").select("*").order("sort_order")
      .then(({ data }) => { if (data) setItems(data); });
  }, []);

  return (
    <section id="faq" className="pb-24">
      {items.length === 0 ? (
        <div className="relative border border-cyan-500/10 bg-cyan-500/[0.02] py-28 flex flex-col items-center gap-4">
          <div className="absolute top-0 left-0 w-6 h-6" style={{ borderTop: "1px solid rgba(34,211,238,0.3)", borderLeft: "1px solid rgba(34,211,238,0.3)" }} />
          <div className="absolute top-0 right-0 w-6 h-6" style={{ borderTop: "1px solid rgba(34,211,238,0.3)", borderRight: "1px solid rgba(34,211,238,0.3)" }} />
          <div className="absolute bottom-0 left-0 w-6 h-6" style={{ borderBottom: "1px solid rgba(34,211,238,0.3)", borderLeft: "1px solid rgba(34,211,238,0.3)" }} />
          <div className="absolute bottom-0 right-0 w-6 h-6" style={{ borderBottom: "1px solid rgba(34,211,238,0.3)", borderRight: "1px solid rgba(34,211,238,0.3)" }} />
          <p className="text-cyan-400/30 text-4xl font-black tracking-widest">?</p>
          <p className="text-white/20 text-xs font-mono tracking-widest">// KNOWLEDGE BASE LOADING — CHECK BACK SOON</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={item.id}
              className="border border-white/8 hover:border-cyan-500/20 bg-white/[0.02] hover:bg-cyan-500/[0.02] transition-all overflow-hidden">
              <button
                onClick={() => setOpen(open === item.id ? null : item.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-cyan-400/25 font-mono text-xs tracking-widest flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-white/70 text-sm font-mono group-hover:text-white transition-colors">
                    {item.question}
                  </span>
                </div>
                <ChevronDown size={16}
                  className={`text-cyan-400/40 transition-transform flex-shrink-0 ml-4 ${open === item.id ? "rotate-180" : ""}`} />
              </button>
              {open === item.id && (
                <div className="px-5 pb-4 pt-2 border-t border-white/5">
                  <p className="text-white/40 text-sm leading-relaxed font-mono pl-10">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
