import type { EdgeModel, NodeModel } from "@/lib/graph";

export interface GraphRendererProps {
  nodes: NodeModel[];
  edges: EdgeModel[];
  width?: number;
  height?: number;
  nodeRadius?: number;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const DEFAULT_RADIUS = 18;

export default function GraphRenderer({
  nodes,
  edges,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  nodeRadius = DEFAULT_RADIUS,
}: GraphRendererProps) {
  const positions = useNodePositions(nodes, width, height);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Graph visualization"
    >
      <g>
        {edges.map((edge) => {
          const from = positions.get(edge.source);
          const to = positions.get(edge.target);
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          return (
            <g key={`${edge.source}->${edge.target}`}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="currentColor"
                strokeOpacity={0.35}
                strokeWidth={1.5}
              />
              <text
                x={midX}
                y={midY - 4}
                textAnchor="middle"
                className="fill-current"
                fontSize={11}
                opacity={0.6}
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
          return (
            <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle
                r={nodeRadius}
                className="fill-background stroke-current"
                strokeWidth={2}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-current"
                fontSize={12}
                fontWeight={600}
              >
                {node.label ?? node.id}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
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
