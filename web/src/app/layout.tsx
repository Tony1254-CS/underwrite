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
      <body className="min-h-screen bg-[#090c13] text-slate-100 flex flex-row antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Top Read-Only Banner */}
          <header className="h-12 border-b border-slate-800 bg-[#0d121c]/70 backdrop-blur px-6 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-semibold">UNDERWRITE VERIFIER</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">STATE: READ-ONLY SHADOW</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="text-[11px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 text-slate-300">
                INVARIANTS ACTIVE
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                SYSTEM NORMAL
              </span>
            </div>
          </header>

          {/* Main Page Area */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>

          <footer className="border-t border-slate-800/80 bg-[#090c13] py-4 text-center text-xs text-slate-500">
            <p>UNDERWRITE · FinTechathon 2026 Topic F · Collateralized Autonomous Agent Safety</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
