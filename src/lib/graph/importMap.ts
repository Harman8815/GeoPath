import type { EdgeModel, GraphData, NodeModel } from "./types";

export interface ParseResult {
  graph: GraphData;
  format: "json" | "geojson";
  name: string;
}

export class MapParseError extends Error {}

export function parseCustomMap(
  text: string,
  fileName = "custom-map",
): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new MapParseError("File is not valid JSON.");
  }

  if (isGeoJSON(data)) {
    return { graph: parseGeoJSON(data), format: "geojson", name: fileName };
  }
  if (isGraphData(data)) {
    return { graph: normalizeGraphData(data), format: "json", name: fileName };
  }
  throw new MapParseError(
    "Unrecognized format. Expected a graph JSON or a GeoJSON FeatureCollection.",
  );
}

function isGraphData(data: unknown): data is GraphData {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as GraphData).nodes) &&
    Array.isArray((data as GraphData).edges)
  );
}

function normalizeGraphData(data: GraphData): GraphData {
  const nodes: NodeModel[] = data.nodes.map((n) => {
    if (typeof n?.id !== "string") {
      throw new MapParseError("Each node must have a string 'id'.");
    }
    return {
      id: n.id,
      label: typeof n.label === "string" ? n.label : undefined,
      x: typeof n.x === "number" ? n.x : undefined,
      y: typeof n.y === "number" ? n.y : undefined,
    };
  });
  const edges: EdgeModel[] = data.edges.map((e, i) => {
    if (typeof e?.source !== "string" || typeof e?.target !== "string") {
      throw new MapParseError(`Edge ${i} needs 'source' and 'target'.`);
    }
    const weight = typeof e.weight === "number" ? e.weight : 1;
    return { source: e.source, target: e.target, weight };
  });
  return { nodes, edges };
}

interface GeoJSONFeature {
  type: "Feature";
  geometry: { type: string; coordinates: unknown };
  properties?: Record<string, unknown> | null;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

function isGeoJSON(data: unknown): data is GeoJSONFeatureCollection {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as GeoJSONFeatureCollection).type === "FeatureCollection" &&
    Array.isArray((data as GeoJSONFeatureCollection).features)
  );
}

function parseGeoJSON(data: GeoJSONFeatureCollection): GraphData {
  const nodes: NodeModel[] = [];
  const edges: EdgeModel[] = [];
  const nodeIds = new Set<string>();

  for (const feature of data.features) {
    const geom = feature.geometry;
    const props = feature.properties ?? {};
    const id =
      (typeof props.id === "string" ? props.id : undefined) ??
      (typeof props.name === "string" ? props.name : undefined) ??
      `node-${nodes.length}`;

    if (geom.type === "Point") {
      const [x, y] = geom.coordinates as [number, number];
      if (!nodeIds.has(id)) {
        nodeIds.add(id);
        nodes.push({ id, label: id, x, y });
      }
      continue;
    }

    if (geom.type === "LineString") {
      const coords = geom.coordinates as Array<[number, number]>;
      const from = String(props.from ?? coords[0]?.join(",") ?? `p-${edges.length}-a`);
      const to = String(props.to ?? coords[coords.length - 1]?.join(",") ?? `p-${edges.length}-b`);
      if (!nodeIds.has(from)) {
        nodeIds.add(from);
        nodes.push({ id: from, label: from, x: coords[0]?.[0], y: coords[0]?.[1] });
      }
      if (!nodeIds.has(to)) {
        nodeIds.add(to);
        nodes.push({
          id: to,
          label: to,
          x: coords[coords.length - 1]?.[0],
          y: coords[coords.length - 1]?.[1],
        });
      }
      const weight = typeof props.weight === "number" ? props.weight : 1;
      edges.push({ source: from, target: to, weight });
    }
  }

  if (nodes.length === 0) {
    throw new MapParseError("GeoJSON contained no Point or LineString features.");
  }
  return { nodes, edges };
}
