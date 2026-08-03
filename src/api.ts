import type { BoundingBox } from "./types";

const highWayExclude = ["footway", "street_lamp", "steps", "pedestrian", "track", "path"];

export function fetchOverpassData(boundingBox: BoundingBox) {
  const exclusion = highWayExclude.map((e) => `[highway!="${e}"]`).join("");
  const query = `
    [out:json];
    (
      way[highway]${exclusion}[footway!="*"]
      (${boundingBox.minLat},${boundingBox.minLon},${boundingBox.maxLat},${boundingBox.maxLon});
      node(w);
    );
    out skel;`;
  console.log("[GeoPath] Overpass query bbox:", { bbox: boundingBox, queryLength: query.length });

  return fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  }).then((res) => {
    console.log("[GeoPath] Overpass response status:", res.status);
    if (!res.ok) {
      console.error("[GeoPath] Overpass response not ok:", res.status, res.statusText);
    }
    return res;
  });
}
