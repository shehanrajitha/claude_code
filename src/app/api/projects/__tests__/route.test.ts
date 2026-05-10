import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
import { NextRequest } from "next/server";
import { PrismaClient } from "@/generated/prisma";

// Must mock server-only before any imports that use it
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
}));

// Mock auth — we control session in tests, Prisma stays real
vi.mock("@/lib/auth", () => ({
  verifySession: vi.fn(),
  getSession: vi.fn(),
}));

import { verifySession } from "@/lib/auth";
import { GET as getProjects } from "../route";
import { GET as getStats } from "../stats/route";
import { PATCH, DELETE } from "../[id]/route";

// Use a separate prisma instance for test data seeding/cleanup
const prisma = new PrismaClient();

const TEST_USER_A = "test-user-a-" + Date.now();
const TEST_USER_B = "test-user-b-" + Date.now();

let projectAId: string;
let projectBId: string;
let deletedProjectId: string;

beforeAll(async () => {
  // Create test users
  await prisma.user.createMany({
    data: [
      { id: TEST_USER_A, email: `${TEST_USER_A}@test.com`, password: "x" },
      { id: TEST_USER_B, email: `${TEST_USER_B}@test.com`, password: "x" },
    ],
  });

  // Create projects for user A
  const pA = await prisma.project.create({
    data: {
      name: "Project Alpha",
      userId: TEST_USER_A,
      componentCount: 3,
      lastActiveAt: new Date("2024-06-01"),
    },
  });
  projectAId = pA.id;

  // Create a soft-deleted project for user A
  const pDel = await prisma.project.create({
    data: {
      name: "Deleted Project",
      userId: TEST_USER_A,
      componentCount: 1,
      deletedAt: new Date(),
    },
  });
  deletedProjectId = pDel.id;

  // Create project for user B
  const pB = await prisma.project.create({
    data: {
      name: "Project Beta",
      userId: TEST_USER_B,
      componentCount: 5,
    },
  });
  projectBId = pB.id;
});

afterAll(async () => {
  // Clean up test data
  await prisma.project.deleteMany({
    where: { userId: { in: [TEST_USER_A, TEST_USER_B] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [TEST_USER_A, TEST_USER_B] } },
  });
  await prisma.$disconnect();
});

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(
  method: string,
  url: string,
  body?: unknown
): NextRequest {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : {},
  });
}

// ─── GET /api/projects ───────────────────────────────────────────────────────

describe("GET /api/projects", () => {
  test("returns 401 when unauthenticated", async () => {
    (verifySession as any).mockResolvedValue(null);
    const req = makeRequest("GET", "http://localhost/api/projects");
    const res = await getProjects(req);
    expect(res.status).toBe(401);
  });

  test("returns only current user's non-deleted projects", async () => {
    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest("GET", "http://localhost/api/projects");
    const res = await getProjects(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.projects).toBeDefined();

    const ids = data.projects.map((p: any) => p.id);
    expect(ids).toContain(projectAId);
    // must not include user B's project
    expect(ids).not.toContain(projectBId);
    // must not include the soft-deleted project
    expect(ids).not.toContain(deletedProjectId);
  });

  test("returns empty list for user with no projects", async () => {
    const emptyUserId = "empty-user-" + Date.now();
    await prisma.user.create({
      data: { id: emptyUserId, email: `${emptyUserId}@test.com`, password: "x" },
    });

    (verifySession as any).mockResolvedValue({
      userId: emptyUserId,
      email: `${emptyUserId}@test.com`,
    });
    const req = makeRequest("GET", "http://localhost/api/projects");
    const res = await getProjects(req);
    const data = await res.json();
    expect(data.projects).toHaveLength(0);

    await prisma.user.delete({ where: { id: emptyUserId } });
  });

  test("response shape includes expected fields", async () => {
    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest("GET", "http://localhost/api/projects");
    const res = await getProjects(req);
    const data = await res.json();
    const project = data.projects.find((p: any) => p.id === projectAId);
    expect(project).toBeDefined();
    expect(project).toHaveProperty("id");
    expect(project).toHaveProperty("name");
    expect(project).toHaveProperty("lastActiveAt");
    expect(project).toHaveProperty("componentCount");
    expect(project).toHaveProperty("createdAt");
  });
});

// ─── GET /api/projects/stats ─────────────────────────────────────────────────

describe("GET /api/projects/stats", () => {
  test("returns 401 when unauthenticated", async () => {
    (verifySession as any).mockResolvedValue(null);
    const req = makeRequest("GET", "http://localhost/api/projects/stats");
    const res = await getStats(req);
    expect(res.status).toBe(401);
  });

  test("returns correct totals for authenticated user", async () => {
    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest("GET", "http://localhost/api/projects/stats");
    const res = await getStats(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    // User A has 1 non-deleted project with componentCount=3
    expect(data.totalProjects).toBe(1);
    expect(data.totalComponents).toBe(3);
  });

  test("coalesces null sum to 0 when user has no projects", async () => {
    const emptyUserId = "empty-stats-" + Date.now();
    await prisma.user.create({
      data: { id: emptyUserId, email: `${emptyUserId}@test.com`, password: "x" },
    });

    (verifySession as any).mockResolvedValue({
      userId: emptyUserId,
      email: `${emptyUserId}@test.com`,
    });
    const req = makeRequest("GET", "http://localhost/api/projects/stats");
    const res = await getStats(req);
    const data = await res.json();
    expect(data.totalProjects).toBe(0);
    expect(data.totalComponents).toBe(0);

    await prisma.user.delete({ where: { id: emptyUserId } });
  });

  test("excludes soft-deleted projects from totals", async () => {
    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest("GET", "http://localhost/api/projects/stats");
    const res = await getStats(req);
    const data = await res.json();
    // deletedProject (componentCount=1) must NOT be counted
    expect(data.totalComponents).toBe(3);
  });
});

// ─── PATCH /api/projects/[id] ────────────────────────────────────────────────

describe("PATCH /api/projects/[id]", () => {
  test("returns 401 when unauthenticated", async () => {
    (verifySession as any).mockResolvedValue(null);
    const req = makeRequest(
      "PATCH",
      `http://localhost/api/projects/${projectAId}`,
      { name: "New Name" }
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: projectAId }) });
    expect(res.status).toBe(401);
  });

  test("renames a project successfully", async () => {
    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest(
      "PATCH",
      `http://localhost/api/projects/${projectAId}`,
      { name: "Renamed Alpha" }
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: projectAId }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.name).toBe("Renamed Alpha");
    expect(data.id).toBe(projectAId);

    // Restore name for subsequent tests
    await prisma.project.update({
      where: { id: projectAId },
      data: { name: "Project Alpha" },
    });
  });

  test("does not bump lastActiveAt on rename", async () => {
    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });

    const before = await prisma.project.findUnique({
      where: { id: projectAId },
      select: { lastActiveAt: true },
    });

    const req = makeRequest(
      "PATCH",
      `http://localhost/api/projects/${projectAId}`,
      { name: "No-touch rename" }
    );
    await PATCH(req, { params: Promise.resolve({ id: projectAId }) });

    const after = await prisma.project.findUnique({
      where: { id: projectAId },
      select: { lastActiveAt: true },
    });

    expect(after?.lastActiveAt?.getTime()).toBe(before?.lastActiveAt?.getTime());

    await prisma.project.update({
      where: { id: projectAId },
      data: { name: "Project Alpha" },
    });
  });

  test("returns 404 when user A tries to rename user B's project", async () => {
    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest(
      "PATCH",
      `http://localhost/api/projects/${projectBId}`,
      { name: "Stolen" }
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: projectBId }) });
    expect(res.status).toBe(404);
  });

  test("returns 400 for empty name", async () => {
    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest(
      "PATCH",
      `http://localhost/api/projects/${projectAId}`,
      { name: "   " }
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: projectAId }) });
    expect(res.status).toBe(400);
  });

  test("returns 400 for name exceeding 100 characters", async () => {
    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest(
      "PATCH",
      `http://localhost/api/projects/${projectAId}`,
      { name: "x".repeat(101) }
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: projectAId }) });
    expect(res.status).toBe(400);
  });

  test("returns 404 when renaming a soft-deleted project", async () => {
    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest(
      "PATCH",
      `http://localhost/api/projects/${deletedProjectId}`,
      { name: "Revive" }
    );
    const res = await PATCH(req, {
      params: Promise.resolve({ id: deletedProjectId }),
    });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/projects/[id] ───────────────────────────────────────────────

describe("DELETE /api/projects/[id]", () => {
  test("returns 401 when unauthenticated", async () => {
    (verifySession as any).mockResolvedValue(null);
    const req = makeRequest(
      "DELETE",
      `http://localhost/api/projects/${projectAId}`
    );
    const res = await DELETE(req, { params: Promise.resolve({ id: projectAId }) });
    expect(res.status).toBe(401);
  });

  test("soft-deletes a project (sets deletedAt, row still exists)", async () => {
    // Create a disposable project for deletion
    const toDelete = await prisma.project.create({
      data: {
        name: "To Be Deleted",
        userId: TEST_USER_A,
      },
    });

    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest(
      "DELETE",
      `http://localhost/api/projects/${toDelete.id}`
    );
    const res = await DELETE(req, {
      params: Promise.resolve({ id: toDelete.id }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);

    // Row still exists in DB
    const row = await prisma.project.findUnique({ where: { id: toDelete.id } });
    expect(row).not.toBeNull();
    // deletedAt is set
    expect(row?.deletedAt).not.toBeNull();

    // Clean up
    await prisma.project.delete({ where: { id: toDelete.id } });
  });

  test("does not hard-delete the project record", async () => {
    const toDelete = await prisma.project.create({
      data: { name: "Hard Delete Check", userId: TEST_USER_A },
    });

    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest(
      "DELETE",
      `http://localhost/api/projects/${toDelete.id}`
    );
    await DELETE(req, { params: Promise.resolve({ id: toDelete.id }) });

    const row = await prisma.project.findUnique({ where: { id: toDelete.id } });
    // Row must still be present (soft-delete only)
    expect(row).toBeDefined();
    expect(row?.id).toBe(toDelete.id);

    await prisma.project.delete({ where: { id: toDelete.id } });
  });

  test("returns 404 when user A tries to delete user B's project", async () => {
    (verifySession as any).mockResolvedValue({
      userId: TEST_USER_A,
      email: `${TEST_USER_A}@test.com`,
    });
    const req = makeRequest(
      "DELETE",
      `http://localhost/api/projects/${projectBId}`
    );
    const res = await DELETE(req, { params: Promise.resolve({ id: projectBId }) });
    expect(res.status).toBe(404);

    // Verify user B's project was NOT deleted
    const row = await prisma.project.findUnique({ where: { id: projectBId } });
    expect(row?.deletedAt).toBeNull();
  });
});
