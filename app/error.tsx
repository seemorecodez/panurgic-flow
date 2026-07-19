"use client";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  function downloadDiagnostics() {
    const diagnostic = {
      product: "Panurgic Flow",
      occurredAt: new Date().toISOString(),
      path: window.location.pathname,
      browser: navigator.userAgent,
      digest: error.digest ?? null,
      note: "Project evidence and error stack were intentionally excluded.",
    };
    const href = URL.createObjectURL(new Blob([`${JSON.stringify(diagnostic, null, 2)}\n`], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = "panurgic-flow-diagnostic.json";
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <main className="legal-shell">
      <article className="legal-content">
        <p className="eyebrow">Recovery</p>
        <h1>The workspace hit an unexpected error.</h1>
        <p>Your project remains in device-local storage. Retry the current view or download a redacted diagnostic that excludes evidence and stack details.</p>
        <div className="hero-actions">
          <button className="primary-action" type="button" onClick={reset}>Try again</button>
          <button className="secondary-action" type="button" onClick={downloadDiagnostics}>Download diagnostic</button>
        </div>
      </article>
    </main>
  );
}
