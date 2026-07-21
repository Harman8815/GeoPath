"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { EdgeModel, NodeModel } from "@/lib/graph";
import type { AnimationStep } from "@/lib/graph/dijkstraAnimation";

export interface GraphRendererProps {
  nodes: NodeModel[];
  edges: EdgeModel[];
  width?: number;
  height?: number;
  nodeRadius?: number;
  source?: string | null;
  destination?: string | null;
  selected?: string | null;
  visited?: string[];
  currentNode?: string | null;
  queueNodes?: string[];
  pathNodes?: string[];
  animationStep?: AnimationStep | null;
  onSelectNode?: (id: string | null) => void;
  onSetSource?: (id: string) => void;
  onSetDestination?: (id: string) => void;
  nodePositions?: Record<string, { x: number; y: number }>;
  onNodeDrag?: (id: string, x: number, y: number) => void;
  selectedEdge?: { source: string; target: string } | null;
  onSelectEdge?: (edge: { source: string; target: string } | null) => void;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const DEFAULT_RADIUS = 18;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

export interface Camera {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const IDENTITY: Camera = { scale: 1, offsetX: 0, offsetY: 0 };

export default function GraphRenderer({
  nodes,
  edges,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  nodeRadius = DEFAULT_RADIUS,
  source = null,
  destination = null,
  selected = null,
  visited = [],
  currentNode = null,
  queueNodes = [],
  pathNodes = [],
  animationStep = null,
  onSelectNode,
  onSetSource,
  onSetDestination,
  nodePositions,
  onNodeDrag,
  selectedEdge,
  onSelectEdge,
}: GraphRendererProps) {
  const computedPositions = useNodePositions(nodes, width, height);
  const positions = nodePositions ?? computedPositions;
  const [camera, setCamera] = useState<Camera>(IDENTITY);
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const nodeDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    nodeStartX: number;
    nodeStartY: number;
  } | null>(null);

  const bounds = useMemo(() => computeBounds(positions), [positions]);

  const zoomAt = useCallback(
    (factor: number, cx: number, cy: number) => {
      setCamera((cam) => {
        const newScale = clamp(cam.scale * factor, MIN_SCALE, MAX_SCALE);
        const ratio = newScale / cam.scale;
        const offsetX = cx - (cx - cam.offsetX) * ratio;
        const offsetY = cy - (cy - cam.offsetY) * ratio;
        return { scale: newScale, offsetX, offsetY };
      });
    },
    [],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = ((e.clientX - rect.left) / rect.width) * width;
      const cy = ((e.clientY - rect.top) / rect.height) * height;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomAt(factor, cx, cy);
    },
    [width, height, zoomAt],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        ox: camera.offsetX,
        oy: camera.offsetY,
      };
    },
    [camera.offsetX, camera.offsetY],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - drag.x) / rect.width) * width;
    const dy = ((e.clientY - drag.y) / rect.height) * height;
    setCamera((cam) => ({ ...cam, offsetX: drag.ox + dx, offsetY: drag.oy + dy }));
  }, [width, height]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const resetCamera = useCallback(() => setCamera(IDENTITY), []);

  const fitToScreen = useCallback(() => {
    if (!bounds) {
      resetCamera();
      return;
    }
    const graphW = bounds.maxX - bounds.minX || 1;
    const graphH = bounds.maxY - bounds.minY || 1;
    const scale = clamp(
      Math.min((width - 80) / graphW, (height - 80) / graphH),
      MIN_SCALE,
      MAX_SCALE,
    );
    const offsetX = (width - graphW * scale) / 2 - bounds.minX * scale;
    const offsetY = (height - graphH * scale) / 2 - bounds.minY * scale;
    setCamera({ scale, offsetX, offsetY });
  }, [bounds, width, height, resetCamera]);

  const zoomButton = (factor: number) => () =>
    zoomAt(factor, width / 2, height / 2);

  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      const pos = positions.get(nodeId);
      if (!pos) return;
      nodeDragRef.current = {
        id: nodeId,
        startX: e.clientX,
        startY: e.clientY,
        nodeStartX: pos.x,
        nodeStartY: pos.y,
      };
    },
    [positions],
  );

  const handleNodePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = nodeDragRef.current;
      if (!drag) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = ((e.clientX - drag.startX) / rect.width) * width;
      const dy = ((e.clientY - drag.startY) / rect.height) * height;
      const newX = drag.nodeStartX + dx / camera.scale;
      const newY = drag.nodeStartY + dy / camera.scale;
      onNodeDrag?.(drag.id, newX, newY);
    },
    [width, height, camera.scale, onNodeDrag],
  );

  const handleNodePointerUp = useCallback(() => {
    nodeDragRef.current = null;
  }, []);

  const handleEdgeClick = useCallback(
    (edge: EdgeModel) => {
      onSelectEdge?.({ source: edge.source, target: edge.target });
    },
    [onSelectEdge],
  );

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <CameraButton label="+" onClick={zoomButton(1.2)} />
        <CameraButton label="−" onClick={zoomButton(1 / 1.2)} />
        <CameraButton label="Fit" onClick={fitToScreen} />
        <CameraButton label="Reset" onClick={resetCamera} />
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Graph visualization"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={(e) => {
          handlePointerMove(e);
          handleNodePointerMove(e);
        }}
        onPointerUp={() => {
          handlePointerUp();
          handleNodePointerUp();
        }}
        onPointerLeave={() => {
          handlePointerUp();
          handleNodePointerUp();
        }}
        onClick={() => onSelectNode?.(null)}
      >
        <g
          transform={`translate(${camera.offsetX}, ${camera.offsetY}) scale(${camera.scale})`}
        >
          <g>
            {edges.map((edge) => {
              const from = positions.get(edge.source);
              const to = positions.get(edge.target);
              if (!from || !to) return null;
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              const isSelected =
                selectedEdge?.source === edge.source &&
                selectedEdge?.target === edge.target;
              return (
                <g
                  key={`${edge.source}->${edge.target}`}
                  onClick={() => handleEdgeClick(edge)}
                  className="cursor-pointer"
                >
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="currentColor"
                    strokeOpacity={isSelected ? 0.9 : 0.35}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  <rect
                    x={midX - 12}
                    y={midY - 8}
                    width={24}
                    height={16}
                    fill="var(--background)"
                    opacity={0.8}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    textAnchor="middle"
                    className="fill-current"
                    fontSize={11}
                    opacity={0.9}
                    pointerEvents="none"
                  >
                    {edge.weight}
                  </text>
                </g>
              );
            })}
          </g>

          <g>
            {nodes.map((node) => {
              const pos = positions.get(node.id);
              if (!pos) return null;
              const isSource = node.id === source;
              const isDest = node.id === destination;
              const isSelected = node.id === selected;
              const isVisited = visited.includes(node.id);
              const isCurrent = node.id === currentNode;
              const inQueue = queueNodes.includes(node.id);
              const onPath = pathNodes.includes(node.id);

              let ringColor = "currentColor";
              let fillColor = "background";
              let strokeWidth = 2;

              if (isCurrent) {
                ringColor = "#eab308";
                strokeWidth = 4;
              } else if (isSource) {
                ringColor = "#22c55e";
                strokeWidth = 3;
              } else if (isDest) {
                ringColor = "#ef4444";
                strokeWidth = 3;
              } else if (onPath) {
                ringColor = "#3b82f6";
                strokeWidth = 3;
              } else if (isVisited) {
                ringColor = "#a855f7";
                strokeWidth = 2;
              } else if (inQueue) {
                ringColor = "#f97316";
                strokeWidth = 2;
              } else if (isSelected) {
                ringColor = "#3b82f6";
                strokeWidth = 3;
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer"
                  onPointerEnter={() => setHovered(node.id)}
                  onPointerLeave={() =>
                    setHovered((h) => (h === node.id ? null : h))
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode?.(node.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onSetSource?.(node.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onSetDestination?.(node.id);
                  }}
                  onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                >
                  <circle
                    r={nodeRadius + (isCurrent ? 8 : isVisited || onPath ? 4 : 0)}
                    className="fill-none"
                    stroke={ringColor}
                    strokeOpacity={0.7}
                    strokeWidth={2}
                  />
                  <circle
                    r={nodeRadius}
                    className="fill-background stroke-current transition-[stroke]"
                    stroke={ringColor}
                    strokeWidth={strokeWidth}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-current"
                    fontSize={12}
                    fontWeight={600}
                    pointerEvents="none"
                  >
                    {node.label ?? node.id}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}

function CameraButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-black/10 bg-background px-2 py-1 text-sm font-medium shadow-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
    >
      {label}
    </button>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeBounds(
  positions: Map<string, { x: number; y: number }>,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (positions.size === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { x, y } of positions.values()) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

function useNodePositions(
  nodes: NodeModel[],
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  const padding = 40;
  const explicit = nodes.filter(
    (n) => typeof n.x === "number" && typeof n.y === "number",
  );

  if (explicit.length === nodes.length) {
    const xs = explicit.map((n) => n.x as number);
    const ys = explicit.map((n) => n.y as number);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    for (const node of nodes) {
      const x = padding + ((node.x as number) - minX) / spanX * (width - 2 * padding);
      const y = padding + ((node.y as number) - minY) / spanY * (height - 2 * padding);
      map.set(node.id, { x, y });
    }
    return map;
  }

  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);
  const cellW = (width - 2 * padding) / Math.max(cols, 1);
  const cellH = (height - 2 * padding) / Math.max(rows, 1);
  nodes.forEach((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = padding + cellW * (col + 0.5);
    const y = padding + cellH * (row + 0.5);
    map.set(node.id, { x, y });
  });
  return map;
}
