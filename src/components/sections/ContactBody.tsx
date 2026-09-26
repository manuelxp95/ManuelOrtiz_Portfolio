import { contactKindLabels, contactLinks } from "@/content";

export function ContactBody() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {contactLinks.map((link) => {
        const external = link.kind !== "email";
        return (
          <li key={link.id}>
            <a
              href={link.href}
              {...(external && {
                target: "_blank",
                rel: "noopener noreferrer",
              })}
              className="flex flex-col rounded-card border border-border bg-surface p-4 transition-colors duration-(--duration-fast) hover:border-accent"
            >
              <span className="text-sm text-muted">
                {contactKindLabels[link.kind]}
              </span>
              <span className="font-medium break-all">{link.label}</span>
              {external && (
                <span className="sr-only"> (opens in a new tab)</span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
