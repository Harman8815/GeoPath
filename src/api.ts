import type { BoundingBox } from "./types";

const highWayExclude = ["footway", "street_lamp", "steps", "pedestrian", "track", "path"];

const rateLimitDelay = 1000; // 1 second delay between requests
let lastRequestTime = 0;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Rate limiting: ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < rateLimitDelay) {
      await sleep(rateLimitDelay - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited - wait with exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`[GeoPath] Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await sleep(waitTime);
        continue;
      }

      if (response.status === 504) {
        // Gateway timeout - server is overloaded, wait longer
        const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
        console.log(`[GeoPath] Gateway timeout, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await sleep(waitTime);
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      console.log(`[GeoPath] Request failed, retrying ${attempt + 1}/${maxRetries}`, error);
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
  
  throw new Error("Max retries exceeded");
}

export function fetchOverpassData(boundingBox: BoundingBox) {
  const exclusion = highWayExclude.map((e) => `[highway!="${e}"]`).join("");
  // Simplified query to reduce server load - only fetch nodes that are part of ways
  const query = `
    [out:json][timeout:25];
    (
      way[highway]${exclusion}[footway!="*"]
      (${boundingBox.minLat},${boundingBox.minLon},${boundingBox.maxLat},${boundingBox.maxLon});
      node(w)->.nodes;
    );
    .nodes out skel;`;
  console.log("[GeoPath] Overpass query bbox:", { bbox: boundingBox, queryLength: query.length });

  return fetchWithRetry("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: query,
  }, 3).then(async (res) => {
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
