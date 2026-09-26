import Image from "next/image";
import { profile } from "@/content";

export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="flex flex-col-reverse gap-8 py-12 sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <h1 id="about-heading" className="text-4xl font-bold tracking-tight">
          {profile.name}
        </h1>
        <p className="mt-2 text-lg text-accent">{profile.headline}</p>
        <p className="mt-1 text-sm text-muted">{profile.location}</p>
        <div className="mt-6 space-y-4 leading-relaxed">
          {profile.summary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {profile.languages.map((language) => (
            <div key={language.name} className="flex gap-1">
              <dt className="font-medium">{language.name}:</dt>
              <dd className="text-muted">{language.level}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Image
        src={profile.photo.src}
        alt={profile.photo.alt}
        width={profile.photo.width}
        height={profile.photo.height}
        sizes="160px"
        loading="eager"
        fetchPriority="high"
        className="size-32 shrink-0 rounded-full border border-border object-cover sm:size-40"
      />
    </section>
  );
}
