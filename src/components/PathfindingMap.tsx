"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { NodeModel } from "@/lib/graph/types";

export interface PathfindingMapProps {
  geoJSON: GeoJSON.FeatureCollection | null;
  exploredEdges: Array<{ source: string; target: string }>;
  pathEdges: Array<{ source: string; target: string }>;
  nodes: NodeModel[];
  sourceNode: NodeModel | null;
  destinationNode: NodeModel | null;
  onMapClick: (lngLat: { lng: number; lat: number }) => void;
  mapStyle?: string;
  className?: string;
}

export default function PathfindingMap({
  geoJSON,
  exploredEdges,
  pathEdges,
  nodes,
  sourceNode,
  destinationNode,
  onMapClick,
  mapStyle = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  className = "",
}: PathfindingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const currentStyleRef = useRef(mapStyle);

  useEffect(() => {
    currentStyleRef.current = mapStyle;
  }, [mapStyle]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: currentStyleRef.current,
      center: [0, 0],
      zoom: 1,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      setMapLoaded(true);
    });

    map.on("click", (e) => {
      onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onMapClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (currentStyleRef.current !== mapStyle) {
      currentStyleRef.current = mapStyle;
      map.setStyle(mapStyle);
    }
  }, [mapLoaded, mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const addLayers = () => {
      if (!map.isStyleLoaded()) return;
      if (map.getSource("roads")) return;

      try {
        if (geoJSON) {
          map.addSource("roads", {
            type: "geojson",
            data: geoJSON,
          });
          map.addLayer({
            id: "roads",
            type: "line",
            source: "roads",
            paint: {
              "line-color": "#888888",
              "line-width": 1.5,
              "line-opacity": 0.6,
            },
          });
        }

        map.addSource("explored", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "explored",
          type: "line",
          source: "explored",
          paint: {
            "line-color": "#a855f7",
            "line-width": 3,
            "line-opacity": 0.7,
          },
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
        });

        map.on("sourcedata", (e) => {
          if (e.isSourceLoaded && e.sourceId === "explored") {
            try {
              map.setPaintProperty("explored", "line-opacity-transition", {
                duration: 300,
              });
            } catch {
              // ignore if property not set yet
            }
          }
        });

        map.addSource("path", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "path-glow",
          type: "line",
          source: "path",
          paint: {
            "line-color": "#3b82f6",
            "line-width": 8,
            "line-opacity": 0.3,
            "line-blur": 4,
          },
        });
        map.addLayer({
          id: "path",
          type: "line",
          source: "path",
          paint: {
            "line-color": "#3b82f6",
            "line-width": 4,
            "line-opacity": 0.9,
            "line-blur": 1,
          },
        });

        map.addSource("markers", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "markers-pulse",
          type: "circle",
          source: "markers",
          paint: {
            "circle-radius": 16,
            "circle-color": [
              "case",
              ["==", ["get", "type"], "source"],
              "#22c55e",
              ["==", ["get", "type"], "destination"],
              "#ef4444",
              "#f97316",
            ],
            "circle-opacity": 0.2,
            "circle-blur": 2,
          },
        });
        map.addLayer({
          id: "markers",
          type: "circle",
          source: "markers",
          paint: {
            "circle-radius": 8,
            "circle-color": [
              "case",
              ["==", ["get", "type"], "source"],
              "#22c55e",
              ["==", ["get", "type"], "destination"],
              "#ef4444",
              "#f97316",
            ],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
          },
        });
      } catch (err) {
        if (err instanceof Error && err.message.includes("Style is not done loading")) {
          map.once("style.load", () => addLayers());
        }
      }
    };

    addLayers();

    const onStyleLoad = () => {
      addLayers();
    };

    map.on("style.load", onStyleLoad);

    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [mapLoaded, geoJSON]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const exploredFeatures = exploredEdges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode || sourceNode.lat == null || sourceNode.lon == null || targetNode.lat == null || targetNode.lon == null) return null;
      return {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [sourceNode.lon, sourceNode.lat],
            [targetNode.lon, targetNode.lat],
          ],
        },
      };
    }).filter(Boolean) as GeoJSON.Feature[];

    const source = map.getSource("explored");
    if (source) {
      (source as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: exploredFeatures,
      });
    }
  }, [mapLoaded, exploredEdges, nodes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const pathFeatures = pathEdges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode || sourceNode.lat == null || sourceNode.lon == null || targetNode.lat == null || targetNode.lon == null) return null;
      return {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [sourceNode.lon, sourceNode.lat],
            [targetNode.lon, targetNode.lat],
          ],
        },
      };
    }).filter(Boolean) as GeoJSON.Feature[];

    const source = map.getSource("path");
    if (source) {
      (source as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: pathFeatures,
      });
    }
  }, [mapLoaded, pathEdges, nodes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const markerFeatures: GeoJSON.Feature[] = [];
    if (sourceNode && sourceNode.lat != null && sourceNode.lon != null) {
      markerFeatures.push({
        type: "Feature",
        properties: { type: "source" },
        geometry: {
          type: "Point",
          coordinates: [sourceNode.lon, sourceNode.lat],
        },
      });
    }
    if (destinationNode && destinationNode.lat != null && destinationNode.lon != null) {
      markerFeatures.push({
        type: "Feature",
        properties: { type: "destination" },
        geometry: {
          type: "Point",
          coordinates: [destinationNode.lon, destinationNode.lat],
        },
      });
    }

    const source = map.getSource("markers");
    if (source) {
      (source as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: markerFeatures,
      });
    }
  }, [mapLoaded, sourceNode, destinationNode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const coordinates: [number, number][] = [];
    for (const feature of geoJSON?.features ?? []) {
      if (feature.geometry.type === "LineString") {
        for (const coord of feature.geometry.coordinates) {
          coordinates.push(coord as [number, number]);
        }
      }
    }

    if (coordinates.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      for (const coord of coordinates) {
        bounds.extend(coord);
      }
      map.fitBounds(bounds, { padding: 50, duration: 1500 });
    }
  }, [mapLoaded, geoJSON]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    let animationId: number;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      const alpha = 0.15 + 0.15 * Math.sin(elapsed * 2);
      const radius = 14 + 4 * Math.sin(elapsed * 2);

      try {
        if (map.getLayer("markers-pulse")) {
          map.setPaintProperty("markers-pulse", "circle-opacity", alpha);
          map.setPaintProperty("markers-pulse", "circle-radius", radius);
        }
      } catch {
        // layer might not be ready
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [mapLoaded]);

  return (
    <div
      ref={mapContainer}
      className={`h-full w-full ${className}`}
      style={{ minHeight: "400px" }}
    />
  );
}
