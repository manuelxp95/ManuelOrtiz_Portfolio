import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manuel Ortiz",
  description: "Portfolio of Manuel Ortiz, game and software developer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
