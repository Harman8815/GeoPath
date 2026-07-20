"use client";

import { useRef, useState } from "react";
import { parseCustomMap, MapParseError, type ParseResult } from "@/lib/graph";

export interface ImportMapProps {
  onImport: (result: ParseResult) => void;
}

export default function ImportMap({ onImport }: ImportMapProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const result = parseCustomMap(text, file.name);
      onImport(result);
    } catch (err) {
      setError(
        err instanceof MapParseError
          ? err.message
          : "Failed to read the selected file.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json,application/geo+json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-md border border-black/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
      >
        Import Map (JSON / GeoJSON)
      </button>
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
