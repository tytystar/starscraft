"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const links = [
  { label: "How It Works",  href: "/#how-it-works" },
  { label: "Get a Quote",   href: "/#quote" },
  { label: "Watch Us Print", href: "/watch" },
  { label: "Gallery",       href: "/gallery" },
  { label: "FAQ",           href: "/faq" },
  { label: "Reviews",       href: "/#reviews" },
  { label: "About",         href: "/about" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* top neon line */}
      <div className="h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />

      <div className="bg-[#05050a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded border border-orange-500/60 flex items-center justify-center group-hover:border-orange-400 transition-colors">
              <div className="w-2 h-2 bg-orange-500 rounded-sm group-hover:bg-orange-400 transition-colors" />
            </div>
            <span className="text-sm font-bold tracking-widest uppercase text-white/90 group-hover:text-white transition-colors">
              Starscraft
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 text-xs font-mono tracking-wide text-white/40 hover:text-orange-400 hover:bg-orange-500/5 rounded transition-all"
              >
                {l.label}
              </a>
            ))}

            {/* Admin links */}
            {isAdmin && (
              <>
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-xs font-mono tracking-wide text-orange-400/70 hover:text-orange-400 hover:bg-orange-500/5 rounded transition-all flex items-center gap-1.5"
                >
                  <LayoutDashboard size={12} />
                  Dashboard
                </Link>
                <Link
                  href="/admin"
                  className="px-3 py-1.5 text-xs font-mono tracking-wide text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded transition-all border border-orange-500/30 hover:border-orange-400/50"
                >
                  ⚙️ Admin
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/order-status"
              className="relative px-4 py-1.5 text-xs font-mono tracking-widest text-orange-400 border border-orange-500/50 rounded hover:bg-orange-500/10 hover:border-orange-400 transition-all group"
            >
              <span className="absolute -top-px left-2 right-2 h-px bg-orange-500/40 group-hover:bg-orange-400/60 transition-colors" />
              TRACK ORDER
              <span className="absolute -bottom-px left-2 right-2 h-px bg-orange-500/40 group-hover:bg-orange-400/60 transition-colors" />
            </Link>

            {/* User + sign out */}
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/20 font-mono max-w-[120px] truncate hidden lg:block">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  title="Sign out"
                  className="w-7 h-7 flex items-center justify-center rounded border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-colors"
                >
                  <LogOut size={12} />
                </button>
              </div>
            )}
          </div>

          <button className="md:hidden text-white/60 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#05050a]/95 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex flex-col gap-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-xs font-mono tracking-wide text-white/50 hover:text-orange-400 transition-colors"
            >
              {l.label}
            </a>
          ))}
          {isAdmin && (
            <>
              <Link href="/dashboard" onClick={() => setOpen(false)}
                className="text-xs font-mono tracking-wide text-orange-400/70 hover:text-orange-400 flex items-center gap-1.5 transition-colors">
                <LayoutDashboard size={12} />
                Dashboard
              </Link>
              <Link href="/admin" onClick={() => setOpen(false)}
                className="text-xs font-mono tracking-wide text-orange-400 hover:text-orange-300 transition-colors">
                ⚙️ Admin Portal
              </Link>
            </>
          )}
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
            <Link href="/order-status" className="text-xs font-mono tracking-widest text-orange-400">
              TRACK ORDER →
            </Link>
            {user && (
              <button onClick={signOut} className="text-xs text-white/30 hover:text-white flex items-center gap-1.5 transition-colors">
                <LogOut size={12} /> Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
