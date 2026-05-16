"use client";
import { useEffect, useState } from "react";

const TAGLINES = [
  "Layer by layer. Dream by dream.",
  "Your idea. Materialized.",
  "From MakerWorld to your world.",
  "Precision. Color. Speed.",
];

export default function Hero() {
  const [tagline, setTagline] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTagline((n) => (n + 1) % TAGLINES.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-[95vh] flex flex-col items-center justify-center text-center px-6 pt-14 overflow-hidden">

      {/* Corner brackets */}
      <div className="absolute top-20 left-8 w-10 h-10 corner-tl" />
      <div className="absolute top-20 right-8 w-10 h-10 corner-tr" />
      <div className="absolute bottom-8 left-8 w-10 h-10 corner-bl" />
      <div className="absolute bottom-8 right-8 w-10 h-10 corner-br" />

      {/* Vertical side lines */}
      <div className="absolute left-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-orange-500/20 to-transparent" />
      <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-orange-500/20 to-transparent" />

      <div className="relative max-w-4xl fade-in">
        {/* System tag */}
        <div className="inline-flex items-center gap-2 mb-10 px-4 py-2 border border-orange-500/20 rounded-sm bg-orange-500/5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flicker" />
          <span className="text-orange-400/80 text-xs font-mono tracking-widest uppercase">
            SYS // Custom 3D Print Service // Online
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tight mb-4">
          <span className="block text-white/90">YOUR IDEA.</span>
          <span
            className="block glow-orange"
            style={{ color: "#fb923c" }}
          >
            PRINTED.
          </span>
        </h1>

        {/* Rotating tagline */}
        <div className="h-8 flex items-center justify-center mb-10">
          <p key={tagline} className="text-white/30 font-mono text-sm tracking-widest fade-in">
            // {TAGLINES[tagline]}
          </p>
        </div>

        <p className="text-white/50 text-base md:text-lg max-w-lg mx-auto mb-12 leading-relaxed">
          Find any model on MakerWorld. We print it in the color and material you choose — NFC chips optional.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#quote"
            className="relative group px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold tracking-widest uppercase text-sm transition-all"
            style={{ clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}
          >
            <span className="relative z-10">Get a Quote</span>
          </a>
          <a
            href="#how-it-works"
            className="px-8 py-4 border border-white/10 hover:border-orange-500/40 text-white/60 hover:text-white font-mono text-sm tracking-widest uppercase transition-all hover:bg-orange-500/5"
          >
            How It Works
          </a>
        </div>

        {/* Bottom stats bar */}
        <div className="mt-20 flex items-center justify-center gap-8 flex-wrap">
          {[
            { val: "PLA · PETG · TPU", label: "Materials" },
            { val: "NFC", label: "Chip Optional" },
            { val: "MakerWorld", label: "Powered By" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-orange-400 font-mono text-sm font-bold">{s.val}</span>
              <span className="text-white/25 text-xs tracking-widest uppercase font-mono">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom neon line */}
      <div className="absolute bottom-0 left-0 right-0 neon-line" />
    </section>
  );
}
