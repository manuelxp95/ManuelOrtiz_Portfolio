import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Loading-tier fences (ADR-005): nothing outside Card Mode may statically pull Card Mode code
    // (only its preload entry), and Three.js/R3F stay behind the 3D seam.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/features/rogue/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/rogue/*", "!@/features/rogue/preload"],
              message:
                "Card Mode is a lazy chunk: import it only through @/features/rogue/preload.",
            },
            {
              group: ["three", "three/*", "@react-three/*"],
              message:
                "Three.js/R3F load only behind src/features/rogue/three (ADR-006).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/rogue/**/*.{ts,tsx}"],
    ignores: ["src/features/rogue/three/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["three", "three/*", "@react-three/*"],
              message:
                "Three.js/R3F load only behind src/features/rogue/three (ADR-006).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
