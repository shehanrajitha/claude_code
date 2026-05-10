"use client";

import { useState } from "react";
import Link from "next/link";
import { ProjectNameEditor } from "./ProjectNameEditor";

interface ProjectCardProps {
  id: string;
  name: string;
  componentCount: number;
  lastActiveAt: Date;
  createdAt: Date;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectCard({
  id,
  name,
  componentCount,
  lastActiveAt,
  createdAt,
  onRename,
  onDelete,
}: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = new Date(lastActiveAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function handleRename(newName: string) {
    await onRename(id, newName);
    setIsEditing(false);
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setIsDeleting(false);
      setFlipped(false);
    }
  }

  return (
    <div
      className="relative"
      style={{ perspective: "1000px", minHeight: "180px" }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "180px",
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 bg-[#F4EFE6] border-2 border-[#1A1815] shadow-[6px_6px_0_0_#D6FF3D] p-5 flex flex-col justify-between"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex flex-col gap-2">
            {isEditing ? (
              <ProjectNameEditor
                initialName={name}
                onCommit={handleRename}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <Link
                href={`/${id}`}
                className="text-lg text-[#1A1815] leading-snug hover:underline"
                style={{ fontFamily: "Instrument Serif, serif" }}
              >
                {name}
              </Link>
            )}

            <span
              className="text-[11px] text-[#1A1815]/50 font-['JetBrains_Mono']"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {componentCount} component{componentCount !== 1 ? "s" : ""} ·{" "}
              {formattedDate}
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="text-[11px] tracking-widest font-['Space_Grotesk'] text-[#1A1815] border border-[#1A1815] px-3 py-1 hover:bg-[#1A1815] hover:text-[#F4EFE6] transition-colors"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              RENAME
            </button>
            <button
              onClick={() => setFlipped(true)}
              className="text-[11px] tracking-widest font-['Space_Grotesk'] text-[#1A1815] border border-[#1A1815] px-3 py-1 hover:bg-[#1A1815] hover:text-[#F4EFE6] transition-colors"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              DELETE
            </button>
          </div>
        </div>

        {/* Back face — delete confirmation */}
        <div
          className="absolute inset-0 bg-[#FF5A1F] border-2 border-[#1A1815] shadow-[6px_6px_0_0_#1A1815] p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <p
            className="text-xl text-[#F4EFE6] leading-snug"
            style={{ fontFamily: "Instrument Serif, serif" }}
          >
            Delete &ldquo;{name}&rdquo;?
          </p>
          <p
            className="text-[11px] text-[#F4EFE6]/70 mt-1"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            This cannot be undone.
          </p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setFlipped(false)}
              className="text-[11px] tracking-widest font-['Space_Grotesk'] text-[#F4EFE6] border border-[#F4EFE6] px-3 py-1 hover:bg-[#F4EFE6] hover:text-[#FF5A1F] transition-colors"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              CANCEL
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-[11px] tracking-widest font-['Space_Grotesk'] text-[#FF5A1F] bg-[#F4EFE6] border border-[#F4EFE6] px-3 py-1 hover:bg-[#1A1815] hover:text-[#F4EFE6] hover:border-[#1A1815] transition-colors disabled:opacity-50"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {isDeleting ? "..." : "YES DELETE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
