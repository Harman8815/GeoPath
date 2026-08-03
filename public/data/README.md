# Road Network Data

Place pre-generated road network JSON files here for instant loading.

## Format

Each file should be named `{city}.json` and contain:

```json
{
  "graphData": {
    "nodes": [{ "id": "...", "lat": ..., "lon": ..., "x": ..., "y": ... }],
    "edges": [{ "source": "...", "target": "...", "weight": ... }]
  },
  "geoJSON": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "sourceId": "first-node-id",
  "destinationId": "last-node-id",
  "fetchedAt": "ISO-date"
}
```

## Generating Data

```bash
npm run generate-data -- london 51.505,-0.130,51.510,-0.122
```

The app loads from `public/data/` first, then falls back to localStorage, then to the Overpass API.
