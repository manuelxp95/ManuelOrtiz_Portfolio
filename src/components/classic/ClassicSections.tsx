import { AboutSection } from "./AboutSection";
import { ContactSection } from "./ContactSection";
import { CvSection } from "./CvSection";
import { EducationSection } from "./EducationSection";
import { ExperienceSection } from "./ExperienceSection";
import { ProjectsSection } from "./ProjectsSection";
import { SkillsSection } from "./SkillsSection";

/** Classic renderer: every section, in registry order, as server-rendered HTML. */
export function ClassicSections() {
  return (
    <>
      <AboutSection />
      <SkillsSection />
      <ExperienceSection />
      <ProjectsSection />
      <EducationSection />
      <ContactSection />
      <CvSection />
    </>
  );
}
