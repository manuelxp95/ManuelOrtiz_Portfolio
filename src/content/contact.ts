import type { ContactKind, ContactLink } from "@/domain/types";

export const contactLinks: ContactLink[] = [
  {
    id: "email",
    kind: "email",
    label: "ortizmanuel@pm.me",
    href: "mailto:ortizmanuel@pm.me",
  },
  {
    id: "linkedin",
    kind: "linkedin",
    label: "linkedin.com/in/manuel-enrique-ortiz",
    href: "https://www.linkedin.com/in/manuel-enrique-ortiz/",
  },
  {
    id: "github",
    kind: "github",
    label: "github.com/manuelxp95",
    href: "https://github.com/manuelxp95",
  },
  {
    id: "itch",
    kind: "itch",
    label: "ortizmanuel.itch.io",
    href: "https://ortizmanuel.itch.io",
  },
];

export const contactKindLabels: Record<ContactKind, string> = {
  email: "Email",
  linkedin: "LinkedIn",
  github: "GitHub",
  itch: "itch.io",
};
