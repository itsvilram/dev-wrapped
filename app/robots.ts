import type { MetadataRoute } from "next";

// Serves /robots.txt. Without this file, /robots.txt would be treated as a
// GitHub username by app/[username].
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } };
}
