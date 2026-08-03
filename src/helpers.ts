export function createGeoJSONCircle(center: [number, number], radiusInKm: number, points = 64) {
  console.log("[GeoPath] createGeoJSONCircle:", { center, radiusInKm, points });
  const coords = {
    latitude: center[1],
    longitude: center[0],
  };

  const km = radiusInKm;

  const ret: number[][] = [];
  const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
  const distanceY = km / 110.574;

  let theta: number, x: number, y: number;
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);

    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return ret;
}

export function rgbToArray(color: string) {
  const result = color.match(/\d+(\.\d)?/g)?.map(Number) || [0, 0, 0];
  if (result[3]) result[3] *= 255;
  return result;
}

export function arrayToRgb(array: number[]) {
  if (!array) return "rgb(0, 0, 0)";
  const rgb = [...array];
  if (rgb[3]) rgb[3] /= 255;
  const result = `rgb${array.length >= 4 ? "a" : ""}(${rgb.join(", ")})`;
  return result;
}
