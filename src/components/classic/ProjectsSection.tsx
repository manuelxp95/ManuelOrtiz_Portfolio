import { projects } from "@/content";
import { ClassicSection } from "./ClassicSection";
import { ProjectCard } from "./ProjectCard";

const featured = projects.filter((project) => project.featured);
const others = projects.filter((project) => !project.featured);

export function ProjectsSection() {
  return (
    <ClassicSection id="projects">
      <h3 className="mb-4 text-lg font-semibold">Featured</h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <h3 className="mt-12 mb-4 text-lg font-semibold">More projects</h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </ClassicSection>
  );
}
