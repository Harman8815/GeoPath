# GeoPath

An interactive pathfinding visualizer that runs algorithms on real-world road networks using OpenStreetMap data.


## Features

GeoPath supports A*, Dijkstra, Greedy Best-First, and Bidirectional Search, with real-time visualization, playback controls, adjustable speed, and interactive map-based node selection. Road networks are fetched through the Overpass API and rendered using Deck.gl and MapLibre GL.

## Getting Started

Requires Node.js 18+.

```bash
git clone <repository-url>
cd geopath
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production build:

```bash
npm run build
npm run start
```

If environment variables are required, create `.env.local` and never commit secrets or API keys.

## Controls

Click the map to select the start point, choose the destination, select an algorithm from Settings, and press `Space` or Play to start the simulation.

`Space` Play/Pause
`R` Reset
`← / →` Step through the simulation

## Tech Stack

Next.js, TypeScript, Deck.gl, MapLibre GL, OpenStreetMap, Overpass API, and GSAP.

## Releases

GeoPath uses Git tags for releases:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Versions follow `MAJOR.MINOR.PATCH`.

## License

See the repository license for details.
