import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await verifySession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = { userId: session.userId, deletedAt: null };

  const [totalProjects, agg] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.aggregate({
      where,
      _sum: { componentCount: true },
      _max: { lastActiveAt: true },
    }),
  ]);

  return NextResponse.json({
    totalProjects,
    totalComponents: agg._sum.componentCount ?? 0,
    lastActiveAt: agg._max.lastActiveAt ?? null,
  });
}
