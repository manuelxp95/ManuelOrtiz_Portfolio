import Image from "next/image";
import type { ReactNode } from "react";
import { profile } from "@/content";

interface AboutBodyProps {
  /** Rendered above the headline: Classic passes the page h1; Card Mode's dialog has its own title. */
  heading?: ReactNode;
}

export function AboutBody({ heading }: AboutBodyProps) {
  return (
    <div className="flex flex-col-reverse gap-8 sm:flex-row sm:items-start">
      <div className="flex-1">
        {heading}
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
        // Lazy on purpose: not the LCP element, and a non-lazy image gets a React preload that a
        // stored Card Mode never uses.
        className="size-32 shrink-0 rounded-full border border-border object-cover sm:size-40"
      />
    </div>
  );
}
