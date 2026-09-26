import { profile } from "@/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <p className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
        © {new Date().getFullYear()} {profile.name}
      </p>
    </footer>
  );
}
