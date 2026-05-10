export function countComponents(serialized: Record<string, unknown>): number {
  return Object.values(serialized).filter(
    (n: any) => n.type === "file" && /\.(jsx|tsx)$/i.test(n.path ?? "")
  ).length;
}
