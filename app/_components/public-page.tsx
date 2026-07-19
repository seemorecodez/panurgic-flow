import Link from "next/link";
import type { ReactNode } from "react";

export function PublicPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <main className="legal-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="Panurgic Flow home"><span aria-hidden="true">PF</span>Panurgic Flow</Link>
        <div className="nav-links"><Link href="/docs">Docs</Link><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link></div>
      </nav>
      <article className="legal-content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </article>
    </main>
  );
}
