import { profile } from "@/content";
import { sections } from "@/domain/sections";
import { ModeToggle } from "./ModeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-(--header-height) max-w-5xl items-center gap-4 px-4">
        <a href="#about" className="shrink-0 font-semibold hover:text-accent">
          {profile.name}
        </a>
        <nav aria-label="Sections" className="ml-auto min-w-0 overflow-x-auto">
          <ul className="flex gap-1 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-control px-2 py-1 whitespace-nowrap text-muted transition-colors duration-(--duration-fast) hover:bg-accent-soft hover:text-text"
                >
                  {section.classicLabel}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ModeToggle />
      </div>
    </header>
  );
}
