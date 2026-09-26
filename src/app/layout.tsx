import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { siteUrl } from "@/config/site";
import { profile } from "@/content";
import { modeInitScript } from "@/state/mode-storage";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const description = `${profile.headline}. ${profile.summary[0]}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — Portfolio`,
    template: `%s · ${profile.name}`,
  },
  description,
  authors: [{ name: profile.name }],
  openGraph: {
    type: "profile",
    title: `${profile.name} — Portfolio`,
    description,
    url: "/",
    siteName: profile.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — Portfolio`,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <a
          href="#main"
          className="sr-only z-50 rounded-control bg-surface px-4 py-2 text-accent focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
