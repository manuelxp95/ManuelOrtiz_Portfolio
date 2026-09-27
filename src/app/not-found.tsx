import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-4 px-4 py-24 focus:outline-none"
    >
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted">This page does not exist.</p>
      <Link href="/" className="text-accent underline underline-offset-2">
        Back to the portfolio
      </Link>
    </main>
  );
}
