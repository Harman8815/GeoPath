export const MAP_STYLES = {
  light: {
    id: "light",
    name: "Light",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
  dark: {
    id: "dark",
    name: "Dark",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  satellite: {
    id: "satellite",
    name: "Satellite",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
} as const;

export type MapStyleId = keyof typeof MAP_STYLES;
