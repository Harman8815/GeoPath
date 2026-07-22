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

export function distanceKm
(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

const MAX_SINGLE_BBOX_AREA = 0.05;

function splitBbox(bbox: [number, number, number, number]): [number, number, number, number][] {
  const [south, north, west, east] = bbox;
  const latSpan = north - south;
  const lonSpan = east - west;
  const area = latSpan * lonSpan;

  if (area <= MAX_SINGLE_BBOX_AREA) {
    return [bbox];
  }

  const tiles: [number, number, number, number][] = [];
  const latSteps = Math.ceil(Math.sqrt(area / MAX_SINGLE_BBOX_AREA));
  const lonSteps = Math.ceil(area / MAX_SINGLE_BBOX_AREA / latSteps);

  const latStepSize = latSpan / latSteps;
  const lonStepSize = lonSpan / lonSteps;

  for (let i = 0; i < latSteps; i++) {
    for (let j = 0; j < lonSteps; j++) {
      const tileSouth = south + i * latStepSize;
      const tileNorth = south + (i + 1) * latStepSize;
      const tileWest = west + j * lonStepSize;
      const tileEast = west + (j + 1) * lonStepSize;
      tiles.push([tileSouth, tileNorth, tileWest, tileEast]);
    }
  }

  console.log(`[Overpass] Split bbox into ${tiles.length} tiles (area: ${area.toFixed(4)} deg²)`);
  return tiles;
}

export async function fetchRoadNetwork(
  bbox: [number, number, number, number],
): Promise<OverpassResponse> {
  const tiles = splitBbox(bbox);
  const maxRetries = 3;
  const tileResults: OverpassResponse[] = [];

  for (let t = 0; t < tiles.length; t++) {
    const tile = tiles[t];
    const [south, north, west, east] = tile;
    const query = `[out:json][timeout:60];
    (
      way["highway"]["highway"!~"footway|path|steps|cycleway|sidewalk|track|service"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;`;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (tiles.length > 1) {
          console.log(`[Overpass] Fetching tile ${t + 1}/${tiles.length} (attempt ${attempt})`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000);

        const res = await fetch(OVERPASS_URL, {
          method: "POST",
          body: `data=${encodeURIComponent(query)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as OverpassResponse;
        tileResults.push(data);
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        
        if (attempt < maxRetries) {
          const delay = 1500 * Math.pow(2, attempt);
          console.warn(`[Overpass] Tile ${t + 1} attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else if (tiles.length > 1 && t < tiles.length - 1) {
          console.error(`[Overpass] Tile ${t + 1} failed permanently, continuing with remaining tiles. Error: ${lastError.message}`);
          break;
        }
      }
    }

    if (t < tiles.length - 1 && tileResults.length <= t) {
      continue;
    }
  }

  if (tileResults.length === 0) {
    throw new Error(
      `Road network download failed. ` +
      `The Overpass server may be overloaded. ` +
      `Please try again in a few minutes or try a smaller area.`
    );
  }

  const merged = mergeResponses(tileResults);
  console.log(`[Overpass] Merged ${tileResults.length} tiles: ${merged.elements.length} total elements`);
  return merged;
}

function mergeResponses(responses: OverpassResponse[]): OverpassResponse {
  const nodeMap = new Map<number, OverpassNode>();
  const wayMap = new Map<number, OverpassWay>();
  const nodeIds = new Set<number>();
  const wayIds = new Set<number>();

  for (const response of responses) {
    for (const el of response.elements) {
      if (el.type === "node") {
        if (!nodeIds.has(el.id)) {
          nodeIds.add(el.id);
          nodeMap.set(el.id, el as OverpassNode);
        }
      } else if (el.type === "way") {
        if (!wayIds.has(el.id)) {
          wayIds.add(el.id);
          wayMap.set(el.id, el as OverpassWay);
        }
      }
    }
  }

  const elements: Array<OverpassNode | OverpassWay> = [];
  for (const node of nodeMap.values()) {
    elements.push(node);
  }
  for (const way of wayMap.values()) {
    elements.push(way);
  }

  return { elements };
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
