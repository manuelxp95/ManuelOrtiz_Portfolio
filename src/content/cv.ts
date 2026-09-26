import type { CvDocument } from "@/domain/types";

/**
 * Downloadable CV, or null while none is published. The 2024 PDF in `public/` predates the
 * current experience and stays unlinked until the owner provides a portfolio CV (Roadmap P10).
 */
export const cv: CvDocument | null = null;
