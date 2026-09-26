import { skillCategoryLabels, skills } from "@/content";
import type { SkillCategory } from "@/domain/types";
import { ClassicSection } from "./ClassicSection";

const categories = Object.keys(skillCategoryLabels) as SkillCategory[];

export function SkillsSection() {
  return (
    <ClassicSection id="skills">
      <div className="grid gap-8 sm:grid-cols-2">
        {categories.map((category) => {
          const group = skills.filter((skill) => skill.category === category);
          if (group.length === 0) return null;
          return (
            <div key={category}>
              <h3 className="mb-2 font-semibold">
                {skillCategoryLabels[category]}
              </h3>
              <ul className="space-y-1">
                {group.map((skill) => (
                  <li key={skill.id}>
                    {skill.name}
                    {skill.context && (
                      <span className="text-sm text-muted">
                        {" "}
                        — {skill.context}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </ClassicSection>
  );
}
