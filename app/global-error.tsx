"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="legal-shell">
          <article className="legal-content">
            <p className="eyebrow">Panurgic Flow</p>
            <h1>The application could not finish loading.</h1>
            <p>Reload the product. Device-local project data is not sent with this error.</p>
            <button className="primary-action" type="button" onClick={reset}>Reload application</button>
          </article>
        </main>
      </body>
    </html>
  );
}
