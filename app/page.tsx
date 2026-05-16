import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import QuoteForm from "@/components/QuoteForm";
import Reviews from "@/components/Reviews";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col">
        <Hero />
        <HowItWorks />
        <QuoteForm />
        <Reviews />
        <footer className="border-t border-white/5 mt-8 py-10 text-center">
          <div className="neon-line mb-6" />
          <p className="text-white/15 text-xs font-mono tracking-widest">
            © {new Date().getFullYear()} STARSCRAFT // ALL RIGHTS RESERVED
          </p>
        </footer>
      </main>
    </>
  );
}
