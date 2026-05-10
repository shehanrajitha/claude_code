"use client";

import { useState } from "react";
import Link from "next/link";
import { StatsBar } from "./StatsBar";
import { ProjectGrid } from "./ProjectGrid";

interface Project {
  id: string;
  name: string;
  componentCount: number;
  lastActiveAt: Date;
  createdAt: Date;
}

interface DashboardProps {
  email: string;
  projects: Project[];
  totalProjects: number;
  totalComponents: number;
  lastActiveAt: Date | null;
}

export function Dashboard({
  email,
  projects: initialProjects,
  totalProjects: initialTotal,
  totalComponents: initialComponents,
  lastActiveAt,
}: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  async function handleRename(id: string, name: string) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600&display=swap');
      `}</style>

      <div className="min-h-screen bg-[#0F0E0C]">
        {/* Nav */}
        <header className="bg-[#0F0E0C] border-b border-[#1A1815]">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="text-[#D6FF3D] text-sm tracking-widest"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              ← EDITOR
            </Link>
            <span
              className="text-[#F4EFE6]/40 text-xs"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {email}
            </span>
          </div>
        </header>

        {/* Stats */}
        <StatsBar
          totalProjects={projects.length}
          totalComponents={initialComponents}
          lastActiveAt={lastActiveAt}
        />

        {/* Heading */}
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-6">
          <h1
            className="text-5xl text-[#F4EFE6] italic leading-none"
            style={{ fontFamily: "Instrument Serif, serif" }}
          >
            Your Projects
          </h1>
        </div>

        {/* Grid */}
        <main className="max-w-7xl mx-auto px-6 pb-16">
          <ProjectGrid
            projects={projects}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </main>
      </div>
    </>
  );
}
