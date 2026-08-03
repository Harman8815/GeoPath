import { fetchOverpassData } from "../api";
import { createGeoJSONCircle } from "../helpers";
import { Graph } from "../models/Graph";
import type { OverpassNode, OverpassWay, BoundingBox } from "../types";

export async function getNearestNode(latitude: number, longitude: number): Promise<OverpassNode | null> {
  try {
    const circle = createGeoJSONCircle([longitude, latitude], 0.15);
    const boundingBox = getBoundingBoxFromPolygon(circle);
    console.log("[GeoPath] getNearestNode called for:", { latitude, longitude, boundingBox });
    
    const response = await fetchOverpassData(boundingBox);
    const data = await response.json();
    console.log("[GeoPath] getNearestNode response elements count:", data.elements?.length);

    if (!data.elements || data.elements.length === 0) {
      return null;
    }

    let result: OverpassNode | null = null;
    let minDistance = Infinity;

    for (const element of data.elements) {
      if (element.type !== "node") continue;

      const node = element as OverpassNode;
      const distance = calculateDistance(latitude, longitude, node.lat, node.lon);

      if (distance < minDistance) {
        minDistance = distance;
        result = node;
      }
    }

    console.log("[GeoPath] getNearestNode result:", result);
    return result;
  } catch (error) {
    console.error("[GeoPath] getNearestNode error:", error);
    return null;
  }
}

export async function getMapGraph(boundingBox: BoundingBox, startNodeId: number): Promise<Graph> {
  try {
    console.log("[GeoPath] getMapGraph called with bbox:", boundingBox, "startNodeId:", startNodeId);
    
    const response = await fetchOverpassData(boundingBox);
    const data = await response.json();
    const elements = data.elements;
    console.log("[GeoPath] getMapGraph response elements count:", elements?.length);

    if (!elements) {
      throw new Error("No elements returned from Overpass API");
    }

    const graph = new Graph();
    const nodeMap = new Map<number, OverpassNode>();

    for (const element of elements) {
      if (element.type === "node") {
        const node = element as OverpassNode;
        graph.addNode(node.id, node.lat, node.lon);
        nodeMap.set(node.id, node);

        if (node.id === startNodeId) {
          graph.startNodeId = node.id;
        }
      }
    }

    for (const element of elements) {
      if (element.type === "way") {
        const way = element as OverpassWay;
        if (!way.nodes || way.nodes.length < 2) continue;

        for (let i = 0; i < way.nodes.length - 1; i++) {
          const node1Id = way.nodes[i];
          const node2Id = way.nodes[i + 1];

          if (nodeMap.has(node1Id) && nodeMap.has(node2Id)) {
            graph.addEdge(node1Id, node2Id);
          }
        }
      }
    }

    if (graph.startNodeId === null) {
      const err = new Error(`Start node ${startNodeId} was not found in the graph`);
      console.error("[GeoPath] getMapGraph error:", err.message, { startNodeId, totalNodes: graph.getNodes().size });
      throw err;
    }

    const totalEdges = graph.getEdges().size;
    console.log("[GeoPath] getMapGraph success, nodes:", graph.getNodes().size, "edges:", totalEdges);
    return graph;
  } catch (error) {
    console.error("[GeoPath] getMapGraph error:", error);
    throw error;
  }
}

export function getBoundingBoxFromPolygon(polygon: number[][]): BoundingBox {
  const boundingBox: BoundingBox = {
    minLat: Number.MAX_VALUE,
    maxLat: -Number.MAX_VALUE,
    minLon: Number.MAX_VALUE,
    maxLon: -Number.MAX_VALUE,
  };

  for (const coordinate of polygon) {
    const [longitude, latitude] = coordinate;
    if (longitude < boundingBox.minLon) boundingBox.minLon = longitude;
    if (longitude > boundingBox.maxLon) boundingBox.maxLon = longitude;
    if (latitude < boundingBox.minLat) boundingBox.minLat = latitude;
    if (latitude > boundingBox.maxLat) boundingBox.maxLat = latitude;
  }

  return boundingBox;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
