import type { Skill, SkillCategory } from "@/domain/types";

export const skills: Skill[] = [
  {
    id: "csharp",
    name: "C#",
    category: "language",
    tags: ["backend", "game-dev"],
  },
  { id: "python", name: "Python", category: "language", tags: ["ai"] },
  { id: "javascript", name: "JavaScript", category: "language", tags: ["web"] },
  { id: "sql", name: "SQL", category: "language", tags: ["backend"] },
  {
    id: "cpp",
    name: "C++",
    category: "language",
    tags: ["game-dev"],
    context: "Coursework (Gamedev.tv, 2024)",
  },

  { id: "dotnet", name: ".NET", category: "backend", tags: ["backend"] },
  {
    id: "ef-core",
    name: "Entity Framework Core",
    category: "backend",
    tags: ["backend"],
    context: "Code First, versioned migrations",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "backend",
    tags: ["backend"],
  },
  {
    id: "sql-server",
    name: "SQL Server",
    category: "backend",
    tags: ["backend"],
    context: "Legacy systems",
  },
  {
    id: "api-integration",
    name: "API design and service integration",
    category: "backend",
    tags: ["backend"],
  },

  {
    id: "blazor-server",
    name: "Blazor Server",
    category: "frontend",
    tags: ["web"],
  },
  { id: "mudblazor", name: "MudBlazor", category: "frontend", tags: ["web"] },
  { id: "radzen", name: "Radzen", category: "frontend", tags: ["web"] },

  {
    id: "xunit",
    name: "xUnit",
    category: "testing",
    tags: ["testing", "backend"],
  },
  {
    id: "bunit",
    name: "bUnit",
    category: "testing",
    tags: ["testing", "web"],
    context: "Blazor component tests",
  },
  {
    id: "e2e-verification",
    name: "End-to-end functional verification",
    category: "testing",
    tags: ["testing"],
  },
  {
    id: "root-cause-analysis",
    name: "Root-cause analysis and defect documentation",
    category: "testing",
    tags: ["testing"],
  },

  {
    id: "git-workflow",
    name: "Git and GitHub: feature branches, pull requests, code review",
    category: "practice",
    tags: ["backend"],
  },
  {
    id: "release-coordination",
    name: "Versioning and release coordination across dev, QA and production",
    category: "practice",
    tags: ["backend"],
  },
  {
    id: "secrets-management",
    name: "Environment-based configuration and secrets management",
    category: "practice",
    tags: ["backend"],
  },
  {
    id: "parameterized-queries",
    name: "Parameterized queries (SQL injection prevention)",
    category: "practice",
    tags: ["backend"],
  },

  { id: "unity", name: "Unity", category: "engine", tags: ["game-dev"] },
  {
    id: "unreal",
    name: "Unreal Engine 4 / 5",
    category: "engine",
    tags: ["game-dev"],
    context: "Training and personal projects",
  },
  { id: "godot", name: "Godot", category: "engine", tags: ["game-dev"] },
  {
    id: "real-time-cinematics",
    name: "Real-time cinematics and camera work",
    category: "engine",
    tags: ["cinematics"],
    context: "Unity (Studio Soup); Unreal (Epic Bootcamp 2023)",
  },

  {
    id: "meta-quest",
    name: "Meta Quest 2 development and testing",
    category: "xr",
    tags: ["xr"],
  },
  { id: "ar-foundation", name: "AR Foundation", category: "xr", tags: ["xr"] },
  {
    id: "lens-studio",
    name: "Lens Studio",
    category: "xr",
    tags: ["xr"],
    context: "Snapchat AR lenses",
  },

  {
    id: "yolov8",
    name: "YOLOv8 object detection",
    category: "ai",
    tags: ["ai"],
    context: "Computer vision with Python",
  },
  {
    id: "comfyui",
    name: "ComfyUI",
    category: "ai",
    tags: ["ai"],
    context: "Local image and video generation workflows (personal projects)",
  },
  {
    id: "diffusion-models",
    name: "Diffusion models: SDXL checkpoints, LoRAs, ControlNet",
    category: "ai",
    tags: ["ai"],
    context: "Using existing models in local workflows",
  },
  {
    id: "wan-video",
    name: "Wan 2.2 video generation",
    category: "ai",
    tags: ["ai"],
    context: "On own hardware",
  },
  {
    id: "ai-assistants",
    name: "AI coding assistants and automation tools",
    category: "ai",
    tags: ["ai"],
  },

  {
    id: "visual-studio",
    name: "Visual Studio",
    category: "tool",
    tags: ["backend"],
  },
  { id: "postman", name: "Postman", category: "tool", tags: ["backend"] },
  { id: "nodejs", name: "Node.js", category: "tool", tags: ["web"] },
];

/** Display order and labels for skill groups. */
export const skillCategoryLabels: Record<SkillCategory, string> = {
  language: "Languages",
  backend: "Backend and data",
  frontend: "Web frontend",
  testing: "Testing and quality",
  practice: "Engineering practice",
  engine: "Game engines and cinematics",
  xr: "VR and AR",
  ai: "Artificial intelligence",
  tool: "Tools",
};
