import type { ComponentType } from "react";
import { AboutBody } from "@/components/sections/AboutBody";
import { ContactBody } from "@/components/sections/ContactBody";
import { CvBody } from "@/components/sections/CvBody";
import { EducationBody } from "@/components/sections/EducationBody";
import { ExperienceBody } from "@/components/sections/ExperienceBody";
import { ProjectsBody } from "@/components/sections/ProjectsBody";
import { SkillsBody } from "@/components/sections/SkillsBody";
import type { SectionId } from "@/domain/types";

/** Same section bodies Classic renders — Card Mode never has its own copy of the content. */
const bodies: Record<SectionId, ComponentType> = {
  about: AboutBody,
  skills: SkillsBody,
  experience: ExperienceBody,
  projects: ProjectsBody,
  education: EducationBody,
  contact: ContactBody,
  cv: CvBody,
};

export function GenericSectionPanel({ section }: { section: SectionId }) {
  const Body = bodies[section];
  return <Body />;
}
