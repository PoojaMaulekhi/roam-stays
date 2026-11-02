import type { Metadata } from "next";
import "./globals.css";
import "./marketplace.css";

export const metadata: Metadata = {
  title: { default: "Roam Stays | Find your somewhere", template: "%s | Roam Stays" },
  description: "Thoughtfully chosen stays across India. Find a cabin, a view, or a place to make your own for a while.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: { title: "Roam Stays | Find your somewhere", description: "Thoughtfully chosen stays across India.", type: "website" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
