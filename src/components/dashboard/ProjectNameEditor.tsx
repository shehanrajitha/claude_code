"use client";

import { useState, useRef, useEffect } from "react";

interface ProjectNameEditorProps {
  initialName: string;
  onCommit: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function ProjectNameEditor({
  initialName,
  onCommit,
  onCancel,
}: ProjectNameEditorProps) {
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const trimmed = value.trim();
      if (!trimmed || trimmed.length > 100) {
        setError("Name must be 1–100 characters");
        return;
      }
      setError(null);
      await onCommit(trimmed);
    } else if (e.key === "Escape") {
      onCancel();
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        maxLength={100}
        className="w-full bg-transparent border-b-2 border-[#1A1815] outline-none text-[#1A1815] text-base font-['Space_Grotesk'] py-0.5"
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      />
      {error && (
        <span
          className="text-[11px] text-[#FF5A1F]"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
