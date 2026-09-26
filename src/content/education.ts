import type { Education } from "@/domain/types";

/** Degree first, then courses, most recent first. */
export const education: Education[] = [
  {
    id: "utn-frre-isi",
    title: "Information Systems Engineering",
    institution:
      "Universidad Tecnológica Nacional, Facultad Regional Resistencia (UTN-FRRe)",
    kind: "degree",
    startYear: 2013,
    status: "Advanced student, completing the supervised professional practice",
  },
  {
    id: "gamedevtv-unreal-cpp-multiplayer",
    title: "Unreal 4 C++ Multiplayer Master",
    institution: "Gamedev.tv",
    kind: "course",
    startYear: 2024,
    endYear: 2024,
  },
  {
    id: "epic-bootcamp-2023-animation",
    title: "Epic Bootcamp 2023: Animation (LATAM edition)",
    institution: "UT-HUB, Unreal Authorized Training Partner, with Epic Games",
    kind: "course",
    startYear: 2023,
    endYear: 2023,
    details:
      "Four weeks; capstone: PSXRobbery, a short film made entirely in Unreal Engine.",
  },
  {
    id: "unity-junior-programmer",
    title: "Unity Junior Programmer",
    institution: "Unity",
    kind: "course",
    startYear: 2022,
    endYear: 2022,
  },
  {
    id: "utn-frre-python",
    title: "Introduction to Programming with Python",
    institution: "UTN-FRRe",
    kind: "course",
    startYear: 2021,
    endYear: 2021,
  },
  {
    id: "pixelab",
    title: "PIXELAB",
    institution: "Government of Chaco",
    kind: "course",
    startYear: 2021,
    endYear: 2021,
  },
];
