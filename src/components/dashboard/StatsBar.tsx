interface StatsBarProps {
  totalProjects: number;
  totalComponents: number;
  lastActiveAt: Date | null;
}

export function StatsBar({
  totalProjects,
  totalComponents,
  lastActiveAt,
}: StatsBarProps) {
  const lastActive = lastActiveAt
    ? new Date(lastActiveAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="w-full bg-[#0F0E0C] border-b-2 border-[#1A1815]">
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap gap-8">
        <StatBlock label="PROJECTS" value={totalProjects.toString()} />
        <StatBlock label="COMPONENTS" value={totalComponents.toString()} />
        <StatBlock label="LAST ACTIVE" value={lastActive} />
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[10px] tracking-[0.2em] font-['Space_Grotesk'] font-500 text-[#D6FF3D]"
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      >
        {label}
      </span>
      <span
        className="text-3xl font-700 text-[#F4EFE6] leading-none"
        style={{ fontFamily: "Instrument Serif, serif" }}
      >
        {value}
      </span>
    </div>
  );
}
