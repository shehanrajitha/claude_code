import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

  const projects = await prisma.project.findMany({
    where: { userId: session.userId, deletedAt: null },
    orderBy: { lastActiveAt: "desc" },
    take: 50,
    ...(cursor
      ? { skip: 1, cursor: { id: cursor } }
      : {}),
    select: {
      id: true,
      name: true,
      lastActiveAt: true,
      componentCount: true,
      createdAt: true,
    },
  });

  const nextCursor =
    projects.length === 50 ? projects[projects.length - 1].id : undefined;

  return NextResponse.json({ projects, nextCursor });
}
