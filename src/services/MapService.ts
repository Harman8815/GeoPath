import { fetchOverpassData } from "../api";
import { createGeoJSONCircle } from "../helpers";
import { Graph } from "../models/Graph";
import type { OverpassNode, OverpassWay, BoundingBox } from "../types";

// Cache for graph data to avoid redundant API calls
const graphCache = new Map<string, { graph: Graph; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(boundingBox: BoundingBox): string {
  return `${boundingBox.minLat.toFixed(4)}_${boundingBox.minLon.toFixed(4)}_${boundingBox.maxLat.toFixed(4)}_${boundingBox.maxLon.toFixed(4)}`;
}

function getCachedGraph(boundingBox: BoundingBox): Graph | null {
  const key = getCacheKey(boundingBox);
  const cached = graphCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log("[GeoPath] Using cached graph data");
    return cached.graph;
  }
  
  return null;
}

function setCachedGraph(boundingBox: BoundingBox, graph: Graph): void {
  const key = getCacheKey(boundingBox);
  graphCache.set(key, { graph, timestamp: Date.now() });
  
  // Clean up old entries
  if (graphCache.size > 10) {
    const oldestKey = Array.from(graphCache.keys())[0];
    graphCache.delete(oldestKey);
  }
}

export async function getNearestNode(latitude: number, longitude: number, existingGraph?: Graph | null): Promise<OverpassNode | null> {
  try {
    // First check if we can find the node in the existing graph
    if (existingGraph) {
      const nodes = existingGraph.getNodes();
      let result: OverpassNode | null = null;
      let minDistance = Infinity;

      for (const [id, node] of nodes) {
        const distance = calculateDistance(latitude, longitude, node.latitude, node.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          result = { id, lat: node.latitude, lon: node.longitude, type: 'node' };
        }
      }

      if (result && minDistance < 0.5) { // Within 0.5 degrees
        console.log("[GeoPath] Found nearest node in existing graph:", result);
        return result;
      }
    }

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
  } catch (error: any) {
    console.error("[GeoPath] getNearestNode error:", error);
    
    // Check if it's a rate limit error
    if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
      throw new Error("Overpass API rate limit exceeded. Please wait a moment before trying again.");
    }
    
    // Check if it's a gateway timeout
    if (error.message?.includes("504") || error.message?.includes("Gateway Timeout")) {
      throw new Error("Overpass API is currently overloaded. Please try again in a few moments.");
    }
    
    return null;
  }
}

export async function getMapGraph(boundingBox: BoundingBox, startNodeId: number): Promise<Graph> {
  try {
    // Check cache first
    const cached = getCachedGraph(boundingBox);
    if (cached) {
      console.log("[GeoPath] getMapGraph using cached data");
      return cached;
    }

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

    // Cache the graph
    setCachedGraph(boundingBox, graph);

    const totalEdges = graph.getEdges().size;
    console.log("[GeoPath] getMapGraph success, nodes:", graph.getNodes().size, "edges:", totalEdges);
    return graph;
  } catch (error: any) {
    console.error("[GeoPath] getMapGraph error:", error);
    
    // Check if it's a rate limit error
    if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
      throw new Error("Overpass API rate limit exceeded. Please wait a moment before trying again.");
    }
    
    // Check if it's a gateway timeout
    if (error.message?.includes("504") || error.message?.includes("Gateway Timeout")) {
      throw new Error("Overpass API is currently overloaded. Please try again in a few moments.");
    }
    
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
