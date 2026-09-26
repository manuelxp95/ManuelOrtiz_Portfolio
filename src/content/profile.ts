import type { Profile } from "@/domain/types";

export const profile: Profile = {
  name: "Manuel Ortiz",
  headline:
    "Full Stack .NET Developer · Advanced Information Systems Engineering student",
  location: "Resistencia, Chaco, Argentina",
  summary: [
    "Full stack .NET developer building and maintaining modules of a production web portal for the Provincial Tax Administration (ATP) of Chaco: .NET, Blazor Server, Entity Framework Core and PostgreSQL.",
    "Before that, three years in games and AR: a Unity developer credit on SOPA — Tale of the Stolen Potato, released on PC and all three consoles; real-time cinematics in Unity and Unreal Engine; and an augmented reality game for Snapchat built in Lens Studio.",
    "In parallel I work on applied AI projects: object detection with YOLOv8 and local generative image and video workflows in ComfyUI.",
    "I like making existing systems safer and easier to maintain without breaking their patterns — understanding why a pattern exists before fixing what is silently broken underneath.",
  ],
  languages: [
    { name: "Spanish", level: "Native" },
    { name: "English", level: "Technical, intermediate to advanced" },
  ],
  photo: {
    src: "/manuel.jpeg",
    alt: "Portrait of Manuel Ortiz, smiling slightly, wearing a dark striped sweater",
    width: 800,
    height: 800,
  },
};
