import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://codex-flight-recorder.seemoreas0-0.chatgpt.site/sitemap.xml",
  };
}
