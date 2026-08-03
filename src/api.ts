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
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: query,
  }).then(async (res) => {
    console.log("[GeoPath] Overpass response status:", res.status, res.statusText);
    if (!res.ok) {
      console.error("[GeoPath] Overpass response not ok:", res.status, res.statusText);
      throw new Error(`Overpass API error: ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type");
    console.log("[GeoPath] Overpass response content-type:", contentType);

    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("[GeoPath] Overpass returned non-JSON response:", text.substring(0, 200));
      throw new Error("Overpass API returned non-JSON response (server may be overloaded)");
    }

    return res;
  });
}
