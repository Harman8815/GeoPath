# GeoPath - Geographic Pathfinding Visualizer

An interactive web application for visualizing pathfinding algorithms over real-world road networks. Powered by Deck.gl, MapLibre GL, and OpenStreetMap (Overpass API) data.

![GeoPath Screen Mockup](image.png)

## Features

- 🗺️ **Real-World Map Visualizer**: Visualizes paths directly on real geographical maps using Deck.gl layers (`TripsLayer`, `PolygonLayer`, and `ScatterplotLayer`).
- 🛣️ **Overpass API Integration**: Instantly fetches actual street network data inside a customizable circular radius.
- 🚀 **Interactive Pathfinding**: Watch search algorithms traverse streets and intersections in real-time.
- 🔍 **Multiple Algorithms Supported**:
  - **A\* Search**: Heuristic-guided search utilizing Euclidean distances.
  - **Dijkstra's Algorithm**: Classic weighted shortest path explorer.
  - **Greedy Best-First Search**: Quick heuristic-based pathfinding.
  - **Bidirectional Search**: Searches from both source and destination simultaneously.
- ⏱️ **Playback Controls**: Play, pause, adjust speed, and scrub through animation steps using a timeline controller.
- 🎨 **Visual Styling Customization**: Edit colors for the start/end nodes, explored street networks, and the final shortest route.
- ⌨️ **Keyboard Shortcuts**: Quickly control the visualizer (Space for Play/Pause, R to Clear, and Arrow keys for manual stepping).

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

Install the project dependencies:

```bash
npm install
```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Building for Production

To create a production build:

```bash
npm run build
npm run start
```

---

## Project Structure

```
src/
  ├── api.ts              # OSM Overpass API fetching clients
  ├── config.ts           # Map styles, coordinates, and default color schemes
  ├── helpers.ts          # Color conversion and GeoJSON math utilities
  ├── app/
  │   ├── globals.css     # Global styling sheet
  │   ├── layout.tsx      # Root page layout wrapper
  │   └── page.tsx        # Client side home entry page
  ├── components/
  │   ├── App.tsx         # Main entry component initiating Material-UI theme
  │   ├── Map.tsx         # MapGL/Deck.gl canvas and pathfinding animation layers
  │   ├── Interface.tsx   # Sidebar drawer configuration and timeline playback HUD
  │   └── Slider.tsx      # Custom styled sliders for speed and radius settings
  ├── hooks/
  │   └── usePathfinding.ts # Pathfinding animation execution loops and hooks
  ├── models/
  │   ├── Node.ts         # Graph Node data model
  │   ├── Edge.ts         # Graph Edge data model
  │   ├── Graph.ts        # Graph adjacency list and neighbor constructor
  │   ├── PathfindingState.ts # Singleton state manager for the active algorithm
  │   └── algorithms/     # Implementations of visualizer search algorithms
  └── services/
      └── MapService.ts   # Bounding box calculations and Overpass parser
```

---

## How to Use

1. **Set the Start Point**: Click anywhere on the map to define the start node. The application will fetch the surrounding road network within the specified radius.
2. **Set the Destination**: Enable `Place End Node` in the UI (or right-click) and select any point inside the green circular boundary.
3. **Choose the Algorithm**: Open the **Settings Sidebar** (top-right gear icon) to switch between A*, Dijkstra, Greedy, or Bidirectional Search.
4. **Run the Simulation**: Press **Space** or click the **Play** button at the bottom toolbar. Adjust the speed slider to speed up or slow down the search.
5. **Analyze or Replay**: Once finished, use the timeline scrubber or arrow keys to manually review how the search explored the map grid.
