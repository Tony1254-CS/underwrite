import type { Metadata, Viewport } from "next";
import "./app.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { AuthProvider } from "@/context/AuthContext";
import { CommandPalette } from "@/components/ui/CommandPalette";

export const metadata: Metadata = {
  title: "UNDERWRITE — Autonomous AI Payment Authority",
  description: "AI payment wallet whose spending authority is sized by adversarial exam, capped by contracts, and backed by a bond.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F4F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0E" },
  ],
};

// Same key as the public site, so a Light/Dark choice carries across both. Applied before first paint.
const THEME_INIT = `(function(){try{var t=window.localStorage.getItem('uw-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/BricolageGrotesque-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/AtkinsonHyperlegibleNext-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="app">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AuthProvider>
          <AuthModal />
          <CommandPalette />
          <div className="shell">
            <Sidebar />
            <div className="shell__main">
              <Header />
              <main id="main" className="page">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
