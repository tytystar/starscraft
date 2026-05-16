import Navbar from "@/components/Navbar";
import Link from "next/link";

const values = [
  {
    emoji: "🖨️",
    title: "We live to print",
    description:
      "3D printing isn't just a service for us — it's a passion. There's nothing like watching a design come to life layer by layer. We pour that excitement into every single order.",
  },
  {
    emoji: "🎁",
    title: "Products for the world",
    description:
      "Whether it's a toy for your kid, a tool for your garage, or a gift for someone you love — we believe great things should be accessible to everyone. If you can dream it, we can print it.",
  },
  {
    emoji: "🌟",
    title: "Joy in every layer",
    description:
      "We genuinely get excited about what people create. Every quote we receive is someone's idea becoming real. That energy keeps us going — and we hope it shows in the work.",
  },
  {
    emoji: "🤝",
    title: "A community of makers",
    description:
      "We're fans of the MakerWorld community, the designers who share their work freely, and the people who find creative uses for every model. We're proud to be part of that world.",
  },
];

const communityPrints = [
  { label: "Toys & figures", emoji: "🧸" },
  { label: "Tools & organizers", emoji: "🔧" },
  { label: "Décor & art", emoji: "🎨" },
  { label: "Gifts & keepsakes", emoji: "💝" },
  { label: "NFC-powered items", emoji: "📡" },
  { label: "Whatever you imagine", emoji: "✨" },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24">

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 py-24 text-center fade-in">
          <p className="inline-block px-4 py-1.5 rounded-full bg-orange-500/15 text-orange-400 text-sm font-semibold mb-6 border border-orange-500/20">
            About Starscraft
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
            We print things.<br />
            <span className="text-orange-400">We love doing it.</span>
          </h1>
          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Starscraft started with a simple idea — 3D printing is magical, and more people should get to experience it. So we made it easy. You find the model. We handle the rest.
          </p>
        </section>

        {/* Values */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-4"
              >
                <span className="text-4xl">{v.emoji}</span>
                <h3 className="text-xl font-bold text-white">{v.title}</h3>
                <p className="text-white/55 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What we've printed */}
        <section className="bg-white/3 border-y border-white/8 py-24">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-orange-400 text-sm font-semibold tracking-widest uppercase mb-4">What people bring us</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Every order is someone&apos;s story
            </h2>
            <p className="text-white/50 mb-12 max-w-xl mx-auto leading-relaxed">
              We&apos;ve printed birthday presents, workshop tools, holiday decorations, and things we never could have imagined. That variety is what makes this job so special.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {communityPrints.map((item) => (
                <div
                  key={item.label}
                  className="bg-white/5 border border-white/10 rounded-2xl py-6 px-4 flex flex-col items-center gap-3"
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <p className="text-white/70 font-medium text-sm">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Share your print */}
        <section className="max-w-3xl mx-auto px-6 py-24 text-center">
          <p className="text-orange-400 text-sm font-semibold tracking-widest uppercase mb-4">Share the joy</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
            Got a print from us?<br />Show the world. 🌍
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-8">
            We love seeing what people do with their prints. If you&apos;d like your photo featured in our gallery, send it our way. Nothing makes us happier than seeing something we made out in the world — being used, displayed, gifted, or just showing off.
          </p>
          <p className="text-white/30 text-sm mb-10">
            Share your photo and we&apos;ll reach out about adding it to the gallery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#quote"
              className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-colors"
            >
              Get something printed
            </Link>
            <Link
              href="/#how-it-works"
              className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-colors"
            >
              How it works
            </Link>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm">
          © {new Date().getFullYear()} Starscraft. All rights reserved.
        </footer>
      </main>
    </>
  );
}
