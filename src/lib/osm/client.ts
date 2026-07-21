import type { EdgeModel, GraphData, NodeModel } from "@/lib/graph/types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export interface CityResult {
  id: number;
  displayName: string;
  lat: number;
  lon: number;
  bbox: [number, number, number, number];
}

export interface OverpassNode {
  type: "node";
  id: number;
  lat: number;
  lon: number;
}

export interface OverpassWay {
  type: "way";
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements: Array<OverpassNode | OverpassWay>;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function searchCities(query: string): Promise<CityResult[]> {
  if (!query.trim()) return [];
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(
    query,
  )}&format=json&limit=5&featuretype=city`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`City search failed (${res.status}).`);
  const data = (await res.json()) as Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    boundingbox: [string, string, string, string];
  }>;
  return data.map((item) => ({
    id: item.place_id,
    displayName: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon),
    bbox: item.boundingbox.map(Number) as [
      number,
      number,
      number,
      number,
    ],
  }));
}

export async function fetchRoadNetwork(
  bbox: [number, number, number, number],
): Promise<OverpassResponse> {
  const [south, north, west, east] = bbox;
  const query = `[out:json][timeout:25];
(
  way["highway"](${south},${west},${north},${east});
);
out body;
>;
out skel qt;`;
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  if (!res.ok) throw new Error(`Road network download failed (${res.status}).`);
  return (await res.json()) as OverpassResponse;
}

export function convertToGraph(data: OverpassResponse): GraphData {
  const coords = new Map<number, { lat: number; lon: number }>();
  for (const el of data.elements) {
    if (el.type === "node") {
      coords.set(el.id, { lat: el.lat, lon: el.lon });
    }
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const { lat, lon } of coords.values()) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  const spanLat = maxLat - minLat || 1;
  const spanLon = maxLon - minLon || 1;

  const nodes: NodeModel[] = [];
  const nodeIds = new Set<string>();
  const edges: EdgeModel[] = [];

  for (const [id, { lat, lon }] of coords) {
    const key = `osm-${id}`;
    if (nodeIds.has(key)) continue;
    nodeIds.add(key);
    const x = (lon - minLon) / spanLon;
    const y = (maxLat - lat) / spanLat;
    nodes.push({ id: key, label: key, x, y, lat, lon });
  }

  for (const el of data.elements) {
    if (el.type !== "way" || !el.nodes || el.nodes.length < 2) continue;
    const motorized = el.tags && "highway" in el.tags;
    if (!motorized) continue;
    for (let i = 0; i < el.nodes.length - 1; i++) {
      const a = coords.get(el.nodes[i]);
      const b = coords.get(el.nodes[i + 1]);
      if (!a || !b) continue;
      const weight = Math.max(1, Math.round(distanceKm(a.lat, a.lon, b.lat, b.lon) * 100));
      edges.push({ source: `osm-${el.nodes[i]}`, target: `osm-${el.nodes[i + 1]}`, weight });
    }
  }

  return { nodes, edges };
}

export function convertToGeoJSON(data: OverpassResponse): GeoJSON.FeatureCollection {
  const coords = new Map<number, [number, number]>();
  for (const el of data.elements) {
    if (el.type === "node") {
      coords.set(el.id, [el.lon, el.lat]);
    }
  }

  const features: GeoJSON.Feature[] = [];

  for (const el of data.elements) {
    if (el.type !== "way" || !el.nodes || el.nodes.length < 2) continue;
    const motorized = el.tags && "highway" in el.tags;
    if (!motorized) continue;

    const lineCoords: [number, number][] = [];
    for (const nodeId of el.nodes) {
      const c = coords.get(nodeId);
      if (c) lineCoords.push(c);
    }
    if (lineCoords.length < 2) continue;

    features.push({
      type: "Feature",
      properties: {
        id: el.id,
        highway: el.tags?.highway ?? "road",
      },
      geometry: {
        type: "LineString",
        coordinates: lineCoords,
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
