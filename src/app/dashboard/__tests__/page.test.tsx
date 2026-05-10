import { test, expect, vi, afterEach } from "vitest";

// Must mock server-only before anything that transitively imports it
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
}));

// Mock next/navigation redirect so we can assert it was called
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    // Throw to stop execution, matching Next.js behavior
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

// Mock auth — tested unit here, not the real JWT machinery
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

// Mock prisma — dashboard page does DB queries we don't need to exercise here
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({
        _sum: { componentCount: null },
        _max: { lastActiveAt: null },
      }),
    },
  },
}));

// Mock Dashboard component — we only care about the redirect logic here
vi.mock("@/components/dashboard/Dashboard", () => ({
  Dashboard: (props: any) => <div data-testid="dashboard">{props.email}</div>,
}));

import { getSession } from "@/lib/auth";
import DashboardPage from "../page";

afterEach(() => {
  vi.clearAllMocks();
});

test("redirects unauthenticated users to /", async () => {
  (getSession as any).mockResolvedValue(null);

  await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT:/");
  expect(mockRedirect).toHaveBeenCalledWith("/");
});

test("renders Dashboard for authenticated users", async () => {
  (getSession as any).mockResolvedValue({
    userId: "user-123",
    email: "user@example.com",
  });

  // Should not throw
  const result = await DashboardPage();
  // A JSX element is returned
  expect(result).toBeTruthy();
  expect(mockRedirect).not.toHaveBeenCalled();
});
