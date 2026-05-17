import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pathfinder",
  description: "Plan childhood adventures and track family experiences",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2d7d52",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
