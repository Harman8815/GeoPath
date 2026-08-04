import { fetchOverpassData } from "../api";
import { createGeoJSONCircle } from "../helpers";
import { Graph } from "../models/Graph";
import type { OverpassNode, OverpassWay, BoundingBox } from "../types";

// Enhanced area-based caching with buffer zones
interface CachedArea {
  boundingBox: BoundingBox;
  graph: Graph;
  timestamp: number;
}

const areaCache = new Map<string, CachedArea>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const BUFFER_FACTOR = 1.5; // Fetch 1.5x the requested area as buffer

function getCacheKey(boundingBox: BoundingBox): string {
  return `${boundingBox.minLat.toFixed(4)}_${boundingBox.minLon.toFixed(4)}_${boundingBox.maxLat.toFixed(4)}_${boundingBox.maxLon.toFixed(4)}`;
}

function expandBoundingBox(bbox: BoundingBox, factor: number): BoundingBox {
  const latRange = bbox.maxLat - bbox.minLat;
  const lonRange = bbox.maxLon - bbox.minLon;
  const latBuffer = (latRange * (factor - 1)) / 2;
  const lonBuffer = (lonRange * (factor - 1)) / 2;

  return {
    minLat: Math.max(bbox.minLat - latBuffer, -90),
    maxLat: Math.min(bbox.maxLat + latBuffer, 90),
    minLon: Math.max(bbox.minLon - lonBuffer, -180),
    maxLon: Math.min(bbox.maxLon + lonBuffer, 180),
  };
}

function isBoundingBoxContained(requested: BoundingBox, cached: BoundingBox): boolean {
  return (
    requested.minLat >= cached.minLat &&
    requested.maxLat <= cached.maxLat &&
    requested.minLon >= cached.minLon &&
    requested.maxLon <= cached.maxLon
  );
}

function getCachedArea(requestedBBox: BoundingBox): CachedArea | null {
  for (const [key, cached] of areaCache) {
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      areaCache.delete(key);
      continue;
    }

    if (isBoundingBoxContained(requestedBBox, cached.boundingBox)) {
      console.log("[GeoPath] Using cached area data for requested bbox");
      return cached;
    }
  }

  return null;
}

function mergeBoundingBoxes(bbox1: BoundingBox, bbox2: BoundingBox): BoundingBox {
  return {
    minLat: Math.min(bbox1.minLat, bbox2.minLat),
    maxLat: Math.max(bbox1.maxLat, bbox2.maxLat),
    minLon: Math.min(bbox1.minLon, bbox2.minLon),
    maxLon: Math.max(bbox1.maxLon, bbox2.maxLon),
  };
}

function mergeGraphs(graph1: Graph, graph2: Graph): Graph {
  const mergedGraph = new Graph();
  
  // Copy nodes from graph1
  const nodes1 = graph1.getNodes();
  for (const [id, node] of nodes1) {
    mergedGraph.addNode(id, node.latitude, node.longitude);
  }
  
  // Copy nodes from graph2
  const nodes2 = graph2.getNodes();
  for (const [id, node] of nodes2) {
    if (!mergedGraph.getNodes().has(id)) {
      mergedGraph.addNode(id, node.latitude, node.longitude);
    }
  }
  
  // Copy edges from graph1
  const edges1 = graph1.getEdges();
  for (const [edgeId, edge] of edges1) {
    mergedGraph.addEdge(edge.node1Id, edge.node2Id);
  }
  
  // Copy edges from graph2
  const edges2 = graph2.getEdges();
  for (const [edgeId, edge] of edges2) {
    mergedGraph.addEdge(edge.node1Id, edge.node2Id);
  }
  
  // Preserve start node if available
  if (graph1.startNodeId !== null) {
    mergedGraph.startNodeId = graph1.startNodeId;
  } else if (graph2.startNodeId !== null) {
    mergedGraph.startNodeId = graph2.startNodeId;
  }
  
  console.log("[GeoPath] Merged graphs:", {
    nodes1: nodes1.size,
    nodes2: nodes2.size,
    mergedNodes: mergedGraph.getNodes().size,
    edges1: edges1.size,
    edges2: edges2.size,
    mergedEdges: mergedGraph.getEdges().size,
  });
  
  return mergedGraph;
}

function setCachedArea(boundingBox: BoundingBox, graph: Graph): void {
  // Check if this new area overlaps with any existing cached areas
  const overlappingKeys: string[] = [];
  let mergedGraph = graph;
  let mergedBBox = boundingBox;
  
  for (const [key, cached] of areaCache) {
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      continue;
    }
    
    // Check for overlap
    const overlap = !(
      boundingBox.maxLat < cached.boundingBox.minLat ||
      boundingBox.minLat > cached.boundingBox.maxLat ||
      boundingBox.maxLon < cached.boundingBox.minLon ||
      boundingBox.minLon > cached.boundingBox.maxLon
    );
    
    if (overlap) {
      console.log("[GeoPath] Found overlapping cached area, merging:", cached.boundingBox);
      overlappingKeys.push(key);
      mergedGraph = mergeGraphs(mergedGraph, cached.graph);
      mergedBBox = mergeBoundingBoxes(mergedBBox, cached.boundingBox);
    }
  }
  
  // Remove overlapping entries
  for (const key of overlappingKeys) {
    areaCache.delete(key);
  }
  
  // Set the merged area
  const newKey = getCacheKey(mergedBBox);
  areaCache.set(newKey, {
    boundingBox: mergedBBox,
    graph: mergedGraph,
    timestamp: Date.now(),
  });

  // Clean up old entries if cache is too large
  if (areaCache.size > 5) {
    const oldestKey = Array.from(areaCache.keys())[0];
    areaCache.delete(oldestKey);
  }

  console.log("[GeoPath] Cached merged area data for bbox:", mergedBBox);
}

export function getCurrentCachedAreas(): BoundingBox[] {
  const validAreas: BoundingBox[] = [];
  for (const [key, cached] of areaCache) {
    if (Date.now() - cached.timestamp <= CACHE_DURATION) {
      validAreas.push(cached.boundingBox);
    }
  }
  return validAreas;
}

function isPointInCachedArea(latitude: number, longitude: number): CachedArea | null {
  for (const [key, cached] of areaCache) {
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      continue;
    }

    if (
      latitude >= cached.boundingBox.minLat &&
      latitude <= cached.boundingBox.maxLat &&
      longitude >= cached.boundingBox.minLon &&
      longitude <= cached.boundingBox.maxLon
    ) {
      console.log("[GeoPath] Point is within cached area:", cached.boundingBox);
      return cached;
    }
  }

  return null;
}

export async function getNearestNode(latitude: number, longitude: number, existingGraph?: Graph | null): Promise<OverpassNode | null> {
  try {
    // First check if the point is within any cached area
    const cachedArea = isPointInCachedArea(latitude, longitude);
    if (cachedArea) {
      // Use the cached graph to find the nearest node
      const nodes = cachedArea.graph.getNodes();
      let result: OverpassNode | null = null;
      let minDistance = Infinity;

      for (const [id, node] of nodes) {
        const distance = calculateDistance(latitude, longitude, node.latitude, node.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          result = { id, lat: node.latitude, lon: node.longitude, type: 'node' };
        }
      }

      if (result) {
        console.log("[GeoPath] Found nearest node in cached area:", result);
        return result;
      }
    }

    // Then check if we can find the node in the existing graph (if different from cached)
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

      if (result && minDistance < 0.01) { // Within 0.01 degrees (~1.1km)
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
    const cached = getCachedArea(boundingBox);
    if (cached) {
      console.log("[GeoPath] getMapGraph using cached data");
      return cached.graph;
    }

    // Expand bounding box with buffer zone
    const expandedBBox = expandBoundingBox(boundingBox, BUFFER_FACTOR);
    console.log("[GeoPath] getMapGraph called with expanded bbox:", expandedBBox, "startNodeId:", startNodeId);
    
    const response = await fetchOverpassData(expandedBBox);
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

    // Cache the expanded area
    setCachedArea(expandedBBox, graph);

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
