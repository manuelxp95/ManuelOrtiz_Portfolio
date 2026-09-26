export const SECTION_IDS = [
  "about",
  "skills",
  "experience",
  "projects",
  "education",
  "contact",
  "cv",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export type PortfolioMode = "classic" | "rogue";

/** Card Mode presentation of a section; identifiers only, never styling values. */
export type CardVariant =
  | "character"
  | "deck"
  | "quest-map"
  | "relic-collection"
  | "codex"
  | "merchant"
  | "scroll";

export type IconId =
  "user" | "layers" | "map" | "gem" | "book" | "mail" | "file";

export interface SectionMeta {
  id: SectionId;
  classicLabel: string;
  cardLabel: string;
  cardVariant: CardVariant;
  icon: IconId;
}

/** Cross-cutting domains; game-dev, backend, etc. are tags, not sections. */
export type DomainTag =
  "backend" | "web" | "testing" | "game-dev" | "cinematics" | "xr" | "ai";

/** Image under `public/`. Dimensions are intrinsic pixels, for layout without CLS. */
export interface Media {
  src: `/${string}`;
  alt: string;
  width: number;
  height: number;
}

export type LinkKind =
  "repo" | "store" | "itch" | "web-build" | "video" | "notebook";

export interface ExternalLink {
  kind: LinkKind;
  label: string;
  url: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface Profile {
  name: string;
  headline: string;
  location: string;
  summary: string[];
  languages: Language[];
  photo: Media;
}

export type SkillCategory =
  | "language"
  | "backend"
  | "frontend"
  | "testing"
  | "practice"
  | "engine"
  | "xr"
  | "ai"
  | "tool";

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  tags: DomainTag[];
  /** Where the skill comes from when that qualifies the claim (e.g. coursework only). */
  context?: string;
}

export type EmploymentType = "internship" | "freelance" | "contract";

export interface Experience {
  id: string;
  organization: string;
  role: string;
  employment: EmploymentType;
  location?: string;
  startYear: number;
  /** Absent while the role is ongoing. */
  endYear?: number;
  summary: string;
  highlights: string[];
  stack: string[];
  tags: DomainTag[];
  /** Projects in `projects.ts` produced in this role. */
  projectIds: string[];
}

export type ProjectContext =
  "professional" | "game-jam" | "coursework" | "personal";

export interface Project {
  id: string;
  name: string;
  year?: number;
  context: ProjectContext;
  summary: string;
  description: string;
  role?: string;
  responsibilities: string[];
  stack: string[];
  genres: string[];
  platforms: string[];
  links: ExternalLink[];
  thumbnail?: Media;
  media: Media[];
  tags: DomainTag[];
  impact?: string;
  featured: boolean;
}

export type EducationKind = "degree" | "course";

export interface Education {
  id: string;
  title: string;
  institution: string;
  kind: EducationKind;
  startYear: number;
  /** Absent while in progress. */
  endYear?: number;
  status?: string;
  details?: string;
}

export type ContactKind = "email" | "linkedin" | "github" | "itch";

export interface ContactLink {
  id: string;
  kind: ContactKind;
  label: string;
  href: string;
}

export interface CvMeta {
  href: `/${string}`;
  fileName: string;
  lastUpdated: string;
}
