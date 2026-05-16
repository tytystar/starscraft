import Navbar from "@/components/Navbar";
import Gallery from "@/components/Gallery";

export default function GalleryPage() {
  return (
    <>
      <Navbar />
      <main className="pt-14 min-h-screen relative">
        <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] z-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 65%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-500/30" />
              <span className="text-violet-400/60 text-xs font-mono tracking-widest px-3 py-1 border border-violet-500/20">
                ◈ PRINT DATABASE
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-500/30" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-3">
              THE{" "}
              <span style={{ color: "#a78bfa", textShadow: "0 0 40px rgba(139,92,246,0.4)" }}>
                GALLERY
              </span>
            </h1>
            <p className="text-white/25 font-mono text-sm">// every print tells a story</p>
          </div>

          <Gallery />
        </div>
      </main>
    </>
  );
}
