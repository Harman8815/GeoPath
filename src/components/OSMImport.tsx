"use client";

import { useState } from "react";
import {
  searchCities,
  fetchRoadNetwork,
  convertToGraph,
  type CityResult,
} from "@/lib/osm";
import type { GraphData } from "@/lib/graph/types";

export interface OSMImportProps {
  onLoad: (graph: GraphData, name: string) => void;
}

export default function OSMImport({ onLoad }: OSMImportProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const found = await searchCities(query);
      setResults(found);
      if (found.length === 0) setStatus("No cities found.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadCity = async (city: CityResult) => {
    setLoading(true);
    setStatus(`Downloading road network for ${city.displayName}…`);
    try {
      const network = await fetchRoadNetwork(city.bbox);
      const graph = convertToGraph(network);
      if (graph.nodes.length === 0) {
        setStatus("No road network found for this area.");
      } else {
        onLoad(graph, city.displayName);
        setStatus(`Loaded ${graph.nodes.length} nodes / ${graph.edges.length} edges.`);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          placeholder="Search a city…"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void runSearch();
          }}
          className="min-w-0 flex-1 rounded-md border border-black/10 bg-background px-3 py-2 text-sm dark:border-white/10"
        />
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={loading}
          className="rounded-md border border-black/10 px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
        >
          Search
        </button>
      </div>

      {results.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {results.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                onClick={() => void loadCity(city)}
                disabled={loading}
                className="w-full truncate rounded border border-black/10 px-2 py-1 text-left hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
                title={city.displayName}
              >
                {city.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}

      {status && <p className="text-xs text-black/60 dark:text-white/60">{status}</p>}
    </div>
  );
}
