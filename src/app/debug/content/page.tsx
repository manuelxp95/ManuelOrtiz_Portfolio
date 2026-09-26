import type { Metadata } from "next";
import {
  contactLinks,
  cv,
  education,
  experience,
  profile,
  projects,
  skills,
} from "@/content";
import { sections } from "@/domain/sections";
import type { SectionId } from "@/domain/types";

// Temporary Roadmap P1 route proving server-side content consumption; removed in P2.
export const metadata: Metadata = {
  title: "Content debug",
  robots: { index: false, follow: false },
};

const contentBySection: Record<SectionId, unknown> = {
  about: profile,
  skills,
  experience,
  projects,
  education,
  contact: contactLinks,
  cv,
};

export default function ContentDebugPage() {
  return (
    <main className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Content debug</h1>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="mb-8">
          <h2 className="text-xl font-semibold">
            {section.classicLabel}{" "}
            <span className="text-sm font-normal">
              ({section.cardLabel} · {section.cardVariant})
            </span>
          </h2>
          <pre className="mt-2 overflow-x-auto text-xs">
            {JSON.stringify(contentBySection[section.id], null, 2)}
          </pre>
        </section>
      ))}
    </main>
  );
}
