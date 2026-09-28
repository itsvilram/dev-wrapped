import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Link previews need full URLs for images. Vercel sets this variable in
// production; locally we fall back to the dev server.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Dev Wrapped",
  description: "Your last 12 months on GitHub, as an animated story.",
};

// viewport-fit=cover lets the story use the full screen on notched phones;
// the story adds safe-area padding itself.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#1e1b4b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
