import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const where = { userId: session.userId, deletedAt: null };

  const [projects, agg] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { lastActiveAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        componentCount: true,
        lastActiveAt: true,
        createdAt: true,
      },
    }),
    prisma.project.aggregate({
      where,
      _sum: { componentCount: true },
      _max: { lastActiveAt: true },
    }),
  ]);

  return (
    <Dashboard
      email={session.email}
      projects={projects}
      totalProjects={projects.length}
      totalComponents={agg._sum.componentCount ?? 0}
      lastActiveAt={agg._max.lastActiveAt ?? null}
    />
  );
}
