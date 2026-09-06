import type { Metadata } from "next";
import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/600.css";
import "./globals.css";
import "./polish.css";
import "./mandate-polish.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://oathline.xyz"),
  title: { default: "Oathline — Policy before execution. Evidence after.", template: "%s · Oathline" },
  description: "A zero-key runtime control and execution-evidence layer for Binance Agent OS.",
  applicationName: "Oathline",
  keywords: ["Binance Agent OS", "agentic trading", "signed mandate", "policy enforcement", "execution receipts", "reconciliation"],
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/brand/oathline-mark-light.png" },
  openGraph: {
    type: "website",
    url: "https://oathline.xyz",
    siteName: "Oathline",
    title: "Oathline — Policy before execution. Evidence after.",
    description: "A zero-key runtime control and execution-evidence layer for Binance Agent OS.",
    images: [{ url: "/brand/oathline-social.png", width: 1672, height: 941, alt: "Oathline — integrity by design" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oathline — Policy before execution. Evidence after.",
    description: "A zero-key runtime control and execution-evidence layer for Binance Agent OS.",
    images: ["/brand/oathline-social.png"],
  },
};

const links: ReadonlyArray<readonly [string, string]> = [
  ["Proof", "/judge"], ["Replay", "/replay"], ["Verify", "/verify"], ["Mandate", "/mandate"],
  ["Surface", "/surface"], ["Limits", "/limits"], ["Install", "/docs/install"],
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <header className="site-header">
          <Link href="/" className="brand-lockup" aria-label="Oathline home">
            <img className="brand-lockup-full" src="/brand/oathline-lockup-dark.png" alt="Oathline" width="1672" height="941" />
            <img className="brand-lockup-mark" src="/brand/oathline-mark-dark.png" alt="" width="1448" height="1086" />
          </Link>
          <nav aria-label="Primary navigation">
            {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </nav>
          <a className="repo-link" href="https://github.com/talk2francis/Oathline">GitHub ↗</a>
        </header>
        <main>{children}</main>
        <footer>
          <Link href="/" className="footer-brand" aria-label="Oathline home"><img src="/brand/oathline-lockup-dark.png" alt="Oathline" width="1672" height="941" /></Link>
          <span>Policy before execution. Evidence after.</span>
          <a href="https://github.com/talk2francis/Oathline">Source ↗</a>
        </footer>
      </body>
    </html>
  );
}
