import Navbar from "@/components/Navbar";
import FAQ from "@/components/FAQ";

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen relative">
        {/* Corner brackets */}
        <div className="pointer-events-none fixed top-20 left-6 w-8 h-8 corner-tl z-0" />
        <div className="pointer-events-none fixed top-20 right-6 w-8 h-8 corner-tr z-0" />
        <div className="pointer-events-none fixed bottom-6 left-6 w-8 h-8 corner-bl z-0" />
        <div className="pointer-events-none fixed bottom-6 right-6 w-8 h-8 corner-br z-0" />

        <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] z-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.06) 0%, transparent 65%)" }} />

        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/30" />
              <span className="text-cyan-400/60 text-xs font-mono tracking-widest px-3 py-1 border border-cyan-500/20">
                ⟁ KNOWLEDGE BASE
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/30" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-3">
              FREQ.{" "}
              <span style={{ color: "#22d3ee", textShadow: "0 0 40px rgba(34,211,238,0.35)" }}>
                ASKED
              </span>
            </h1>
            <p className="text-white/25 font-mono text-sm">// queries · answers · clarity</p>
          </div>

          <FAQ />
        </div>
      </main>
    </>
  );
}
