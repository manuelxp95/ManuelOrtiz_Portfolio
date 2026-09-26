import { cv, experience, profile } from "@/content";

export function CvBody() {
  const current = experience.find((entry) => entry.endYear === undefined);
  return (
    <div className="rounded-card border border-border bg-surface p-6">
      <p className="font-medium">{profile.headline}</p>
      {current && (
        <p className="mt-1 text-sm text-muted">
          Currently {current.role} at {current.organization}
        </p>
      )}
      {cv ? (
        <a
          href={cv.href}
          download={cv.fileName}
          className="mt-4 inline-block rounded-control bg-accent px-4 py-2 font-medium text-bg"
        >
          Download CV (PDF, updated {cv.lastUpdated})
        </a>
      ) : (
        <p className="mt-4 text-sm">
          A downloadable PDF is coming soon. Meanwhile, the full experience and
          education are on this page, and you can reach me through{" "}
          <a
            href="#contact"
            className="text-accent underline underline-offset-2"
          >
            Contact
          </a>
          .
        </p>
      )}
    </div>
  );
}
