import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "UNDERWRITE — Autonomous AI Payment Authority",
  description: "AI payment wallet whose spending authority is sized by adversarial exam, capped by contracts, and backed by a bond.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#05070b] text-slate-100 flex flex-row antialiased selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
        {/* Ambient Optical Chromatic Backdrops */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-[600px] h-[500px] rounded-full ambient-glow-cyan blur-[120px] opacity-40 animate-glow-float" />
          <div className="absolute top-1/3 -right-32 w-[550px] h-[550px] rounded-full ambient-glow-violet blur-[140px] opacity-30 animate-pulse-subtle" />
          <div className="absolute -bottom-32 left-1/3 w-[650px] h-[500px] rounded-full ambient-glow-emerald blur-[130px] opacity-25" />
        </div>

        {/* Primary Frosted Sidebar */}
        <Sidebar />

        {/* Application Stage */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
          {/* Top Floating visionOS Bar */}
          <header className="sticky top-0 z-30 h-14 border-b border-white/[0.08] bg-[#080d1a]/65 backdrop-blur-2xl px-6 md:px-8 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute opacity-75" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 relative shadow-glow-emerald" />
              </div>
              <span className="text-white font-semibold tracking-wider text-[11px] uppercase">UNDERWRITE VERIFIER</span>
              <span className="text-white/20">/</span>
              <span className="text-slate-400 text-[11px]">STATE: READ-ONLY SHADOW</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.08] text-slate-300 backdrop-blur-md shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
                INVARIANTS ACTIVE
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-400 font-semibold shadow-glow-emerald">
                SYSTEM NORMAL
              </span>
            </div>
          </header>

          {/* Main Page Canvas */}
          <main className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-10">
              {children}
            </div>
          </main>

          {/* Luxury Footer */}
          <footer className="border-t border-white/[0.06] bg-[#05070b]/80 backdrop-blur-xl py-5 px-6 md:px-10 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="tracking-wide">
              UNDERWRITE · FinTechathon 2026 Topic F · Collateralized Autonomous Agent Safety
            </p>
            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
              <span className="text-cyan-400">Clopper-Pearson 99% Exact</span>
              <span>·</span>
              <span className="text-emerald-400">BondPool Collateralized</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
