import type { Metadata } from "next";
import { PublicPage } from "../_components/public-page";

export const metadata: Metadata = { title: "Privacy · Panurgic Flow" };

export default function PrivacyPage() {
  return (
    <PublicPage eyebrow="Privacy" title="Your project record stays on your device.">
      <p>The hosted Panurgic Flow workspace does not upload evidence, packets, project names, or generated artifacts. There are no visitor analytics, advertising trackers, cloud accounts, or hosted model calls.</p>
      <h2>Device-local storage</h2>
      <p>Projects and up to ten recent packet versions are stored in your browser&apos;s IndexedDB. If that storage is unavailable, the product falls back to temporary session memory and displays a warning.</p>
      <h2>Exports</h2>
      <p>Files leave the browser only when you explicitly download them. A Codex forge request is intended to be processed in your trusted local Codex environment, outside the hosted site.</p>
      <h2>Delete local data</h2>
      <p>Use Clear local data in the project rail to remove all Panurgic Flow projects and version history from the current browser profile.</p>
    </PublicPage>
  );
}
