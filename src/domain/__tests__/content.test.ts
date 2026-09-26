import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
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
import { SECTION_IDS, type Media } from "@/domain/types";

const publicDir = path.resolve(__dirname, "../../../public");

/** Intrinsic size of a PNG or baseline/progressive JPEG. */
function imageSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  let offset = 2;
  while (offset < buf.length) {
    const marker = buf[offset + 1];
    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isStartOfFrame) {
      return {
        width: buf.readUInt16BE(offset + 7),
        height: buf.readUInt16BE(offset + 5),
      };
    }
    offset += 2 + buf.readUInt16BE(offset + 2);
  }
  throw new Error(`Unsupported image format: ${file}`);
}

function expectUniqueIds(items: readonly { id: string }[]) {
  const ids = items.map((item) => item.id);
  expect(new Set(ids).size).toBe(ids.length);
}

function expectHttpsUrl(url: string) {
  expect(new URL(url).protocol).toBe("https:");
}

const allMedia: Media[] = [
  profile.photo,
  ...projects.flatMap((project) => [
    ...(project.thumbnail ? [project.thumbnail] : []),
    ...project.media,
  ]),
];

describe("section registry", () => {
  it("lists exactly the section ids, in order", () => {
    expect(sections.map((section) => section.id)).toEqual([...SECTION_IDS]);
  });

  it("gives every section both mode labels", () => {
    for (const section of sections) {
      expect(section.classicLabel.trim()).not.toBe("");
      expect(section.cardLabel.trim()).not.toBe("");
    }
  });
});

describe("ids", () => {
  it.each([
    ["skills", skills],
    ["experience", experience],
    ["projects", projects],
    ["education", education],
    ["contact links", contactLinks],
  ])("are unique within %s", (_name, items) => {
    expectUniqueIds(items);
  });

  it("experience entries only reference existing projects", () => {
    const projectIds = new Set(projects.map((project) => project.id));
    for (const entry of experience) {
      for (const id of entry.projectIds) expect(projectIds).toContain(id);
    }
  });
});

describe("media", () => {
  it.each(allMedia.map((media) => [media.src, media] as const))(
    "%s exists with matching dimensions",
    (src, media) => {
      const file = path.join(publicDir, src);
      expect(existsSync(file)).toBe(true);
      expect(imageSize(file)).toEqual({
        width: media.width,
        height: media.height,
      });
    },
  );

  it("has descriptive alt text", () => {
    for (const media of allMedia) {
      expect(media.alt.trim().length).toBeGreaterThan(10);
      expect(media.alt).not.toMatch(/\bsample\b/i);
    }
  });

  it("gives featured projects a thumbnail", () => {
    for (const project of projects.filter((p) => p.featured)) {
      expect(project.thumbnail).toBeDefined();
    }
  });
});

describe("links", () => {
  it("project links are absolute https URLs with a label", () => {
    for (const link of projects.flatMap((project) => project.links)) {
      expectHttpsUrl(link.url);
      expect(link.label.trim()).not.toBe("");
    }
  });

  it("project links carry no access tokens", () => {
    for (const link of projects.flatMap((project) => project.links)) {
      expect(new URL(link.url).searchParams.has("secret")).toBe(false);
    }
  });

  it("contact links are mailto or absolute https", () => {
    for (const link of contactLinks) {
      if (link.kind === "email")
        expect(link.href).toMatch(/^mailto:[^@\s]+@[^@\s]+$/);
      else expectHttpsUrl(link.href);
      expect(link.label.trim()).not.toBe("");
    }
  });

  it.runIf(cv !== null)("CV file exists in public/", () => {
    if (cv === null) return;
    expect(existsSync(path.join(publicDir, cv.href))).toBe(true);
    expect(cv.href.endsWith(cv.fileName)).toBe(true);
  });
});

describe("required fields", () => {
  it("profile is complete", () => {
    expect(profile.name.trim()).not.toBe("");
    expect(profile.headline.trim()).not.toBe("");
    expect(profile.summary.length).toBeGreaterThan(0);
  });

  it("projects have name, summary, description and stack", () => {
    for (const project of projects) {
      expect(project.name.trim()).not.toBe("");
      expect(project.summary.trim()).not.toBe("");
      expect(project.description.trim()).not.toBe("");
      expect(project.stack.length).toBeGreaterThan(0);
    }
  });

  it("experience entries are complete and chronologically valid", () => {
    for (const entry of experience) {
      expect(entry.organization.trim()).not.toBe("");
      expect(entry.role.trim()).not.toBe("");
      expect(entry.summary.trim()).not.toBe("");
      if (entry.endYear !== undefined) {
        expect(entry.endYear).toBeGreaterThanOrEqual(entry.startYear);
      }
    }
  });

  it("education entries are complete and chronologically valid", () => {
    for (const entry of education) {
      expect(entry.title.trim()).not.toBe("");
      expect(entry.institution.trim()).not.toBe("");
      if (entry.endYear !== undefined) {
        expect(entry.endYear).toBeGreaterThanOrEqual(entry.startYear);
      }
    }
  });

  it("skills have a name", () => {
    for (const skill of skills) expect(skill.name.trim()).not.toBe("");
  });
});
