# EAF - Dijkstra's Algorithm Visualizer

An interactive web application for visualizing Dijkstra's shortest path algorithm. Built with Next.js, React, and TypeScript.

## Features

- **Interactive Graph Visualization**: Visual representation of nodes and weighted edges
- **Step-by-Step Animation**: Play, pause, resume, and step through the algorithm execution
- **Live Statistics Panel**: Real-time metrics showing current node, queue size, visited nodes, distances, and execution progress
- **Distance Table**: Live updating table with node distances, previous nodes, and visited status
- **Algorithm Explanation**: Pseudocode display with step highlighting and plain-language explanations
- **Priority Queue Visualization**: See the priority queue contents, insertions, removals, and current ordering
- **Graph Editor**: Drag nodes, add/remove edges, edit edge weights, and reset the graph
- **Theme Support**: Choose between Light, Dark, and Cyber themes
- **Export Support**: Export the graph as PNG, SVG, or JSON

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm run start
```

## Usage

### Running the Algorithm

1. Select a **Source** node (double-click any node or use the dropdown)
2. Select a **Destination** node (right-click any node or use the dropdown)
3. Click **Play** to start the animation, or use **Step Forward** to advance one step at a time
4. Watch the algorithm explore the graph in real-time

### Controls

- **Play**: Start the algorithm animation
- **Pause**: Pause the current animation
- **Resume**: Resume a paused animation
- **Reset**: Reset the algorithm to the initial state
- **Step Back**: Move one step backward
- **Step Forward**: Move one step forward
- **Speed**: Adjust animation speed (0.5x to 5x)

### Editing the Graph

- **Drag nodes** to reposition them
- **Click an edge** to select it
- **Add Edge**: Use the Graph Editor panel to add new edges with custom weights
- **Edit Weight**: Select an edge and change its weight
- **Remove Edge**: Select an edge and click Remove Edge
- **Reset Graph**: Return to the default graph layout

### Themes

Click the theme toggle in the header to switch between:
- **Light**: Clean white background with dark text
- **Dark**: Dark background with light text
- **Cyber**: Futuristic dark theme with cyan accents

### Export

Export the current graph state as:
- **PNG**: Raster image of the graph
- **SVG**: Vector image of the graph
- **JSON**: Graph data for import/export

## Project Structure

```
src/
  app/
    globals.css          - Global styles and theme variables
    layout.tsx           - Root layout with ThemeProvider
    page.tsx             - Home page
  components/
    AlgorithmExplanationPanel.tsx - Pseudocode and explanations
    AppLayout.tsx        - Main application layout
    ControlPanel.tsx     - Playback and graph editing controls
    DistanceTable.tsx    - Live distance table
    GraphRenderer.tsx    - SVG graph visualization
    ImportMap.tsx        - JSON graph import
    LiveStatsPanel.tsx   - Live statistics dashboard
    OSMImport.tsx        - OpenStreetMap import
    ThemeProvider.tsx    - Theme context and persistence
    ThemeToggle.tsx      - Theme switcher component
  hooks/
    useAnimationPlayback.ts - Algorithm playback hook
  lib/
    graph/
      Graph.ts           - Graph data structure
      PriorityQueue.ts   - Min-heap priority queue
      dijkstra.ts        - Dijkstra's algorithm implementation
      dijkstraAnimation.ts - Animation step generator
      generate.ts        - Random graph generation
      importMap.ts       - Map data import
      maps.ts            - Built-in sample maps
      types.ts           - Graph type definitions
      utils.ts           - Graph utility functions
    map/
      MapSystem.ts       - Map rendering system
    osm/
      client.ts          - OpenStreetMap API client
```

## Algorithm

This project implements **Dijkstra's shortest path algorithm**, which finds the shortest path between two nodes in a weighted graph. The algorithm:

1. Initializes all distances to infinity, except the source node (distance = 0)
2. Adds the source to a min-priority queue
3. Repeatedly extracts the node with the smallest distance from the queue
4. Examines all neighbors and relaxes edges if a shorter path is found
5. Updates distances and predecessor pointers
6. Terminates when the destination is reached or the queue is empty

## Technologies

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **SVG** - Graph rendering

## License

Private
