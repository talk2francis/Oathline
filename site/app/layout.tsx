import type { Metadata } from "next";
import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/600.css";
import "./globals.css";
import "./polish.css";

export const metadata: Metadata = {
  title: { default: "Oathline — Policy before execution. Evidence after.", template: "%s · Oathline" },
  description: "A zero-key runtime control and execution-evidence layer for Binance Agent OS.",
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
          <Link href="/" className="receipt-mark" aria-label="Oathline home"><span>OATH</span><span>LINE</span></Link>
          <nav aria-label="Primary navigation">
            {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </nav>
          <a className="repo-link" href="https://github.com/talk2francis/Oathline">GitHub ↗</a>
        </header>
        <main>{children}</main>
        <footer>
          <span>Oathline</span>
          <span>Policy before execution. Evidence after.</span>
          <a href="https://github.com/talk2francis/Oathline">Source ↗</a>
        </footer>
      </body>
    </html>
  );
}
