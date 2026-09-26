import { education } from "@/content";
import { formatYearRange } from "@/domain/dates";
import type { Education } from "@/domain/types";

function EducationEntry({ entry }: { entry: Education }) {
  return (
    <li>
      <p className="font-medium">{entry.title}</p>
      <p className="text-sm text-muted">
        {entry.institution} · {formatYearRange(entry.startYear, entry.endYear)}
      </p>
      {entry.status && <p className="mt-1 text-sm">{entry.status}</p>}
      {entry.details && <p className="mt-1 text-sm">{entry.details}</p>}
    </li>
  );
}

export function EducationBody() {
  const degrees = education.filter((entry) => entry.kind === "degree");
  const courses = education.filter((entry) => entry.kind === "course");
  return (
    <>
      <ul className="space-y-4">
        {degrees.map((entry) => (
          <EducationEntry key={entry.id} entry={entry} />
        ))}
      </ul>
      <h3 className="mt-8 mb-4 text-lg font-semibold">Courses and training</h3>
      <ul className="grid gap-4 sm:grid-cols-2">
        {courses.map((entry) => (
          <EducationEntry key={entry.id} entry={entry} />
        ))}
      </ul>
    </>
  );
}
