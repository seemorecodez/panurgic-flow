import type { MetadataRoute } from "next";

const base = "https://codex-flight-recorder.seemoreas0-0.chatgpt.site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/docs", "/privacy", "/security"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path ? "monthly" : "weekly",
    priority: path ? 0.6 : 1,
  }));
}
