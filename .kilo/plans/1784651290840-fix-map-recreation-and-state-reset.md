# GeoPath Version 2 - Deep Bug Fix Plan

## User Report
"When I click on source and destination, the whole page refreshes and I see the default screen, not the city map."

## Root Cause (Confirmed from current code)

### Primary: `PathfindingMap.tsx` map init effect depends on `[onMapClick]`
`PathfindingMap` initializes the MapLibre map inside `useEffect([onMapClick])`. Any time `onMapClick` reference changes, React runs the cleanup (`map.remove(); mapRef.current = null`) and re-creates the map at its initial state (`center [0,0], zoom 1`).

### Why `onMapClick` changes on every source/destination click
In `AppLayout.tsx`, `handleMapClick` is defined as:
```ts
const handleMapClick = useCallback(
  (lngLat) => { ... },
  [selectionMode, nodes, sourceId],  // <-- sourceId is here
);
```
When the user sets a source or destination, `setSourceId()` or `setDestinationId()` triggers a state update. `sourceId` changes, so `handleMapClick` gets a **new function reference**. This new reference flows into `PathfindingMap` as `onMapClick`, triggering map destruction/recreation.

### Secondary: Layer creation effect has wrong guards
After map recreation, the layer-creation effect has deps `[mapLoaded, geoJSON]`. Since `mapLoaded` is already `true`, React does **not** re-run the effect on the new map. Result: new map has no `roads`, `explored`, `path`, or `markers` sources/layers.

### Tertiary: `roads` source data is never updated after first load
The `addLayers()` function returns early (`if (map.getSource("roads")) return;`), so when `geoJSON` changes for a new city, the existing `roads` source data is never refreshed.

### Quaternary: Playback init shows empty-source step
`useAnimationPlayback({ graph, source: "", target: "" })` is called on mount before the user selects anything. The Dijkstra generator yields an `init` step with empty source, which the sidebar displays.

## Implementation Plan

### Step 1: `PathfindingMap.tsx` — Stabilize map lifecycle

**A1. Change the map init effect to run exactly once.**
- Replace the current init effect dependency array `[onMapClick]` with `[]`.
- The map should be created once and never destroyed by prop changes.

**A2. Replace inline `onMapClick` binding with a ref-based handler.**
- Add `const onMapClickRef = useRef(onMapClick);` and update it in a `useEffect([onMapClick])`.
- In the map init, bind the click event once using `onMapClickRef.current` directly, OR re-bind in a separate effect that runs when `onMapClickRef.current` changes.
- **Recommended pattern**: Keep the map's `click` event listener registration inside the init effect, but have it call through `onMapClickRef.current`. The ref itself is updated by a separate effect:
  ```ts
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);
  ```
- This way the map is never destroyed/recreated, but the click handler always uses the latest closure.

**A3. Split `addLayers()` registration from data updates.**
- One `useEffect([], ...)` (or after `mapLoaded`) creates the map AND registers all sources/layers exactly once.
- A separate `useEffect([geoJSON])` updates the `roads` source data:
  ```ts
  useEffect(() => {
    const source = map.getSource("roads");
    if (source) {
      (source as GeoJSONSource).setData(geoJSON ?? { type: "FeatureCollection", features: [] });
    }
  }, [geoJSON]);
  ```
- Remove the `if (map.getSource("roads")) return;` early-return from the layer-registration effect, or move the `roads` source creation into the registration effect but update its data in a separate effect.
- Actually, simplest: keep layer registration in one effect (with `[mapLoaded, geoJSON]` but without early return), and change the `addLayers` function to **always set source data** instead of returning early.

**A4. Ensure `style.load` listener re-adds ALL layers.**
- When `setStyle()` is called (style switch), the current `style.load` listener calls `addLayers()`.
- Fix `addLayers()` to remove the `if (map.getSource("roads")) return;` guard and instead check if the map is already fully initialized with a ref flag, OR just idempotently set data on existing sources and create missing ones.
- **Recommended**: Use a `layersAddedRef` to track whether layers have been registered. On `style.load`, if already registered, just re-set data on existing sources. If not, add layers fresh.

**A5. Fix `fitBounds` to use a ref to avoid running on initial mount if not needed.**
- The current `fitBounds` effect has deps `[mapLoaded, geoJSON]`. When `geoJSON` changes (new city), it correctly fits bounds. This is fine once the map lifecycle is stable.

### Step 2: `AppLayout.tsx` — Stabilize all callbacks

**B1. Remove `playback` from callback dependency arrays.**
- `handleMapClick` deps should be `[selectionMode, nodes, sourceId]` — remove `playback`.
- `handlePlay` deps should be `[sourceId, destinationId]` — remove `playback`.
- `handleReset` deps should be `[]` — remove `playback`.
- Inside these callbacks, use `playbackRef.current` for any playback actions.

**B2. Make `handleMapClick` read `selectionMode` from a ref.**
- Add `const selectionModeRef = useRef(selectionMode);` with a `useEffect` to sync it.
- Remove `selectionMode` from `handleMapClick` deps.
- The callback will then have deps `[nodes, sourceId]` only.
- **Wait** — `nodes` and `sourceId` still change. Even with `playbackRef`, `handleMapClick` will still get a new reference when `sourceId` changes. But with the `PathfindingMap` fix (ref-based click handler), this is fine because the map no longer recreates on `onMapClick` changes.

**B3. Fix the bare `useEffect` for `playbackRef`.**
- Change `useEffect(() => { playbackRef.current = playback; })` to `useEffect(() => { playbackRef.current = playback; }, [playback])`.
- This satisfies the linter and only updates the ref when playback actually changes.

**B4. (Optional but recommended) Guard `useAnimationPlayback` call.**
- If `graphData` is null or `sourceId`/`destinationId` are empty, pass a dummy/no-op setup, OR conditionally call the hook.
- Since React hooks must be called unconditionally, the cleanest approach is to keep the hook call but ensure the generator handles empty source gracefully (early return in `dijkstraAnimation.ts`).

**B5. Clean up `handleCitySearch`.**
- It should call `playbackRef.current.reset()` (already does, but verify deps are correct).

### Step 3: `dijkstraAnimation.ts` — Guard empty source
- At the top of `dijkstraAnimation`, if `!source`, yield nothing or yield a single `init` step with a clear message and return immediately.
- This prevents the sidebar from showing broken init steps on mount.

### Step 4: Verification
- Run `npm run lint` and `npm run build`.
- Test: load Delhi → map zooms and stays.
- Test: set source → map stays, green marker appears.
- Test: set destination → map stays, red marker appears.
- Test: switch style → style changes, layers persist.
- Test: load new city → old roads cleared, new roads shown, map fits new bounds.
- Test: run animation → purple explored edges, blue glowing path.

## Files Changed
- `src/components/PathfindingMap.tsx`
- `src/components/AppLayout.tsx`
- `src/lib/graph/dijkstraAnimation.ts`
