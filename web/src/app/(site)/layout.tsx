import type { Metadata, Viewport } from "next";
import "./site.css";

/**
 * Root layout for the PUBLIC site (route group "(site)").
 *
 * The workspace routes live in the sibling "(app)" group with their own root layout, so
 * nothing here (theme, fonts, CSS) can leak into them and nothing there can leak in here.
 * Fonts are committed files in public/fonts, served from this origin: no Google Fonts, no CDN.
 * That keeps the page working from mainland China and offline (plan.md §1.3 #9). They are declared
 * in site.css and the two the first screen needs are preloaded below. Licences: public/fonts/OFL-*.txt.
 * (next/font was tried first; with this route-group layout its preload manifest came out empty.)
 */

export const metadata: Metadata = {
  title: "UNDERWRITE — your AI clerk starts at $0",
  description:
    "An AI that pays supplier invoices within a limit it earned by passing a test. A contract enforces the limit and a bond covers mistakes. FinTechathon 2026, Topic F.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F4F0" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0E" },
  ],
};

// Applies a saved Light/Dark choice before first paint; defaults to light mode.
const THEME_INIT = `(function(){try{var t=window.localStorage.getItem('uw-theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}else if(t==='system'){document.documentElement.setAttribute('data-theme','system');}else{document.documentElement.setAttribute('data-theme','light');}}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function SiteRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/BricolageGrotesque-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/AtkinsonHyperlegibleNext-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="uw-site">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
