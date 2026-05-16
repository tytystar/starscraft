import Navbar from "@/components/Navbar";
import TimeLapses from "@/components/TimeLapses";

export default function WatchPage() {
  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen relative">
        {/* Orange-tinted glow for this page */}
        <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] z-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(251,146,60,0.1) 0%, transparent 65%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16">
          {/* Page header */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-500/30" />
              <span className="text-orange-400/60 text-xs font-mono tracking-widest px-3 py-1 border border-orange-500/20">
                ◉ LIVE FEED ARCHIVE
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-500/30" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-3">
              WATCH US <span className="text-orange-400 glow-orange">PRINT</span>
            </h1>
            <p className="text-white/25 font-mono text-sm">// real prints · real time · layer by layer</p>
          </div>

          <TimeLapses />
        </div>
      </main>
    </>
  );
}
