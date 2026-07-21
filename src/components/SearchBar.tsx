"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchCities, type CityResult } from "@/lib/osm";

export interface SearchBarProps {
  onCitySelect: (city: CityResult) => void;
  disabled?: boolean;
}

export default function SearchBar({ onCitySelect, disabled }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const found = await searchCities(query);
      setResults(found);
      if (found.length === 0) {
        setError("No cities found. Try a different search term.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (city: CityResult) => {
    onCitySelect(city);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          placeholder="Search any city or location..."
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSearch();
          }}
          disabled={disabled || loading}
          className="flex-1 rounded-lg border border-black/10 bg-white/90 px-4 py-2.5 text-sm shadow-lg backdrop-blur-sm transition-all placeholder:text-black/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-white/10 dark:bg-black/80 dark:text-white dark:placeholder:text-white/40 dark:focus:border-blue-400"
        />
        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={disabled || loading || !query.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-lg border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-black/90"
          >
            {results.map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(city)}
                  className="w-full truncate px-4 py-3 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  title={city.displayName}
                >
                  <div className="font-medium">{city.displayName.split(",")[0]}</div>
                  <div className="truncate text-xs text-black/50 dark:text-white/50">{city.displayName}</div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-xs text-red-500 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
