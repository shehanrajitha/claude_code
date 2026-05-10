import Link from "next/link";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <p
        className="text-5xl text-[#F4EFE6] leading-none"
        style={{ fontFamily: "Instrument Serif, serif" }}
      >
        Nothing here yet.
      </p>
      <p
        className="text-sm text-[#F4EFE6]/50"
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      >
        Start building something interesting.
      </p>
      <Link
        href="/"
        className="inline-block bg-[#D6FF3D] text-[#0F0E0C] px-6 py-2.5 font-['Space_Grotesk'] font-700 text-sm tracking-wide border-2 border-[#0F0E0C] shadow-[4px_4px_0_0_#0F0E0C] hover:shadow-[2px_2px_0_0_#0F0E0C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      >
        NEW PROJECT
      </Link>
    </div>
  );
}
