"use client";

import { ProjectCard } from "./ProjectCard";
import { EmptyState } from "./EmptyState";

interface Project {
  id: string;
  name: string;
  componentCount: number;
  lastActiveAt: Date;
  createdAt: Date;
}

interface ProjectGridProps {
  projects: Project[];
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectGrid({ projects, onRename, onDelete }: ProjectGridProps) {
  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          {...p}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
