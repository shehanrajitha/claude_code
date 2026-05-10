import { test, expect } from "vitest";
import { countComponents } from "@/lib/project-stats";

test("counts .jsx files only", () => {
  const vfs = {
    "/App.jsx": { type: "file", path: "/App.jsx" },
    "/styles.css": { type: "file", path: "/styles.css" },
  };
  expect(countComponents(vfs)).toBe(1);
});

test("counts .tsx files only", () => {
  const vfs = {
    "/Button.tsx": { type: "file", path: "/Button.tsx" },
    "/index.ts": { type: "file", path: "/index.ts" },
  };
  expect(countComponents(vfs)).toBe(1);
});

test("counts both .jsx and .tsx files", () => {
  const vfs = {
    "/App.jsx": { type: "file", path: "/App.jsx" },
    "/Button.tsx": { type: "file", path: "/Button.tsx" },
    "/utils.ts": { type: "file", path: "/utils.ts" },
    "/styles.css": { type: "file", path: "/styles.css" },
  };
  expect(countComponents(vfs)).toBe(2);
});

test("ignores directory nodes even if path ends in .jsx", () => {
  const vfs = {
    "/components": { type: "directory", path: "/components" },
    "/components/Card.jsx": { type: "file", path: "/components/Card.jsx" },
  };
  expect(countComponents(vfs)).toBe(1);
});

test("returns 0 for empty VFS", () => {
  expect(countComponents({})).toBe(0);
});

test("returns 0 when no jsx/tsx files exist", () => {
  const vfs = {
    "/index.ts": { type: "file", path: "/index.ts" },
    "/README.md": { type: "file", path: "/README.md" },
    "/styles.css": { type: "file", path: "/styles.css" },
  };
  expect(countComponents(vfs)).toBe(0);
});

test("is case-insensitive for extensions (.JSX, .TSX)", () => {
  const vfs = {
    "/App.JSX": { type: "file", path: "/App.JSX" },
    "/Card.TSX": { type: "file", path: "/Card.TSX" },
  };
  expect(countComponents(vfs)).toBe(2);
});

test("counts multiple nested component files", () => {
  const vfs = {
    "/": { type: "directory", path: "/" },
    "/App.jsx": { type: "file", path: "/App.jsx" },
    "/components": { type: "directory", path: "/components" },
    "/components/Button.tsx": { type: "file", path: "/components/Button.tsx" },
    "/components/Card.tsx": { type: "file", path: "/components/Card.tsx" },
    "/lib/utils.ts": { type: "file", path: "/lib/utils.ts" },
  };
  expect(countComponents(vfs)).toBe(3);
});

test("handles nodes with missing path gracefully", () => {
  const vfs = {
    "/App.jsx": { type: "file" },
  };
  expect(countComponents(vfs)).toBe(0);
});
