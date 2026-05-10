import { prisma } from "@/lib/prisma";

export async function findOwnedProject(id: string, userId: string) {
  return prisma.project.findFirst({
    where: { id, userId, deletedAt: null },
  });
}
