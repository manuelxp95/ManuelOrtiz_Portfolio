import type { EmploymentType, Experience } from "@/domain/types";

/** Most recent first. */
export const experience: Experience[] = [
  {
    id: "atp",
    organization: "Administración Tributaria Provincial (ATP)",
    role: "Software Development Intern",
    employment: "internship",
    location: "Resistencia, Argentina",
    startYear: 2026,
    summary:
      "Develops and maintains modules of the institutional portal: a modular web application of several dozen projects on .NET and Blazor Server, with unified authentication and permissions, PostgreSQL through Entity Framework Core and legacy SQL Server databases.",
    highlights: [
      "Designs and builds new modules and maintains existing ones within the project's layered architecture and conventions.",
      "Builds Blazor Server interfaces with MudBlazor and Radzen: forms, dialogs, searchable and filterable tables, history dashboards with charts.",
      "Evolves the schema with EF Core Code First migrations, versioned in the repository and applied per environment.",
      "Replaced string-concatenated SQL with parameterized queries, removing an injection risk, and moved hard-coded mail credentials to environment variables.",
      "Found a test project that existed on disk but was never registered in the solution — it had never compiled or run — and restored it with aligned package versions.",
      "Replaced values hard-coded in source with administrable, versioned reference tables, so generated documents keep the rate in force at the time of each operation.",
      "Works through feature branches and peer-reviewed pull requests, and coordinates releases across development, test and production.",
    ],
    stack: [
      "C#",
      ".NET",
      "Blazor Server",
      "MudBlazor",
      "Radzen",
      "Entity Framework Core",
      "PostgreSQL",
      "SQL Server",
      "xUnit",
      "bUnit",
      "Git",
    ],
    tags: ["backend", "web", "testing"],
    projectIds: [],
  },
  {
    id: "unne",
    organization: "Rectorado UNNE",
    role: "External Technical Developer",
    employment: "contract",
    startYear: 2024,
    endYear: 2025,
    summary:
      "Optimized reporting and data-validation processes using APIs and Postman.",
    highlights: [],
    stack: ["REST APIs", "Postman"],
    tags: ["backend"],
    projectIds: [],
  },
  {
    id: "studio-bando",
    organization: "Studio Bando",
    role: "Unity Developer (Intern)",
    employment: "internship",
    location: "Colombia",
    startYear: 2023,
    endYear: 2024,
    summary:
      "Worked on SOPA — Tale of the Stolen Potato, a narrative puzzle adventure published by Studio Bando for PC, Xbox, PlayStation and Nintendo Switch.",
    highlights: [
      "Sped up production by implementing new features.",
      "Credited on a commercial title that shipped on four platforms.",
    ],
    stack: ["Unity", "C#"],
    tags: ["game-dev"],
    projectIds: ["sopa"],
  },
  {
    id: "studio-soup",
    organization: "Studio Soup",
    role: "Cinematic Artist",
    employment: "freelance",
    location: "Argentina",
    startYear: 2023,
    endYear: 2023,
    summary:
      "Built real-time cinematics in Unity: sequence assembly and camera work.",
    highlights: ["Cut production time with camera-control tooling."],
    stack: ["Unity"],
    tags: ["cinematics", "game-dev"],
    projectIds: [],
  },
  {
    id: "3dar",
    organization: "3DAR",
    role: "AR Developer",
    employment: "freelance",
    location: "Argentina",
    startYear: 2022,
    endYear: 2022,
    summary:
      "Improved the scoring system of an augmented reality game for Snapchat, built with Lens Studio, the platform's native AR lens toolchain.",
    highlights: [],
    stack: ["Lens Studio"],
    tags: ["xr", "game-dev"],
    projectIds: [],
  },
];

export const employmentLabels: Record<EmploymentType, string> = {
  internship: "Internship",
  freelance: "Freelance",
  contract: "Contract",
};
