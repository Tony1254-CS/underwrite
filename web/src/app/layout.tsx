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
      <body className="min-h-screen bg-[#030610] text-slate-100 flex flex-row antialiased selection:bg-cyan-500/40 selection:text-white relative overflow-x-hidden">
        {/* Dynamic Aurora Borealis Optical Light Mesh */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Subtle high-tech dot matrix */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
          
          {/* Aurora Light Sources */}
          <div className="absolute -top-40 left-1/4 w-[750px] h-[650px] rounded-full ambient-aurora-cyan blur-[130px] opacity-70 animate-glow-float" />
          <div className="absolute top-1/4 -right-40 w-[700px] h-[700px] rounded-full ambient-aurora-violet blur-[150px] opacity-60 animate-pulse-subtle" />
          <div className="absolute -bottom-40 left-1/3 w-[800px] h-[600px] rounded-full ambient-aurora-emerald blur-[140px] opacity-50" />
          <div className="absolute top-2/3 -left-32 w-[600px] h-[600px] rounded-full ambient-aurora-amber blur-[160px] opacity-35" />
        </div>

        {/* Floating visionOS Acrylic Sidebar */}
        <Sidebar />

        {/* Application Stage */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
          {/* Top Floating visionOS Status Bar */}
          <header className="sticky top-0 z-30 h-16 border-b border-white/[0.08] bg-[#050914]/70 backdrop-blur-3xl px-8 flex items-center justify-between text-xs font-mono shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-cyan-400 radar-ring absolute opacity-75" />
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 relative shadow-[0_0_12px_#06b6d4]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-black tracking-wider text-xs uppercase text-gradient-cyan">
                  UNDERWRITE ENCLAVE
                </span>
                <span className="text-white/20">|</span>
                <span className="text-slate-400 text-[11px] font-medium tracking-wide">
                  READ-ONLY SHADOW MIRROR
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:inline-flex items-center gap-2 text-[11px] bg-white/[0.04] px-3.5 py-1.5 rounded-full border border-white/[0.1] text-slate-300 backdrop-blur-xl shadow-inner">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
                <span className="font-semibold text-white tracking-wide">CHAIN: ANVIL 31337</span>
              </div>
              <div className="inline-flex items-center gap-2 text-[11px] bg-emerald-500/15 px-3.5 py-1.5 rounded-full border border-emerald-500/40 text-emerald-300 font-bold shadow-[0_0_16px_rgba(16,185,129,0.35)] backdrop-blur-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span>INVARIANTS ACTIVE (INV1–INV14)</span>
              </div>
            </div>
          </header>

          {/* Main Page Canvas */}
          <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
            <div className="max-w-7xl mx-auto space-y-12">
              {children}
            </div>
          </main>

          {/* Luxury visionOS Footer */}
          <footer className="border-t border-white/[0.08] bg-[#030610]/85 backdrop-blur-2xl py-6 px-8 md:px-12 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-sm" />
              <p className="font-medium tracking-wide text-slate-300">
                UNDERWRITE · FinTechathon 2026 Topic F · Autonomous Agent Safety &amp; Sized Authority
              </p>
            </div>
            <div className="flex items-center gap-5 text-[11px] font-mono">
              <span className="text-cyan-400 hover:text-cyan-300 transition-colors">Clopper-Pearson 99% Exact</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 hover:text-emerald-300 transition-colors">BondPool Collateralized</span>
              <span className="text-slate-600">·</span>
              <span className="text-indigo-400 hover:text-indigo-300 transition-colors">EIP-712 Attested</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
