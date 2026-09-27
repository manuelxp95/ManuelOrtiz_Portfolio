import { AboutBody } from "@/components/sections/AboutBody";
import { profile } from "@/content";

export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-heading" className="py-12">
      <AboutBody
        heading={
          <h1
            id="about-heading"
            tabIndex={-1}
            className="text-4xl font-bold tracking-tight"
          >
            {profile.name}
          </h1>
        }
      />
    </section>
  );
}
