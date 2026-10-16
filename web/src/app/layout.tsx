import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UNDERWRITE — Autonomous AI Payment Authority",
  description: "AI payment wallet whose spending authority is sized by adversarial exam, capped by contracts, and backed by a bond.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased flex flex-col min-h-screen">
        <header className="border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
                  U
                </div>
                <span className="font-bold tracking-wider text-lg bg-gradient-to-r from-sky-400 via-indigo-300 to-slate-200 bg-clip-text text-transparent">
                  UNDERWRITE
                </span>
              </Link>
              <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/exam"
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  Policy Card
                </Link>
                <Link
                  href="/traces"
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  Run Traces
                </Link>
                <Link
                  href="/attack-lab"
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  Attack Lab
                </Link>
                <Link
                  href="/claims"
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  Claims
                </Link>
                <Link
                  href="/verify"
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  Verify
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-mono">Chain: Local Anvil (31337)</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-[#090d16] py-6 text-center text-xs text-slate-500">
          <p>UNDERWRITE · FinTechathon 2026 Topic F · Collateralized Autonomous Agent Safety</p>
        </footer>
      </body>
    </html>
  );
}
