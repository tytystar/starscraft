import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Starscraft 3D Printing",
  description: "Custom 3D printing service — bring your own model, we handle the rest.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#05050a] text-[#e8eaf0]">
        {/* Global grid bg */}
        <div className="pointer-events-none fixed inset-0 z-0 grid-bg" />
        {/* Global top glow */}
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] z-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(251,146,60,0.07) 0%, transparent 65%)" }}
        />
        <AuthProvider>
          <div className="relative z-10 flex flex-col min-h-screen">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
