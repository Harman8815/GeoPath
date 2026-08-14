"use client";

import dynamic from "next/dynamic";

const MapExplorer = dynamic(() => import("@/components/App").then((mod) => ({ default: mod.default })), { ssr: false });

export default function MapExplorerPage() {
  return <MapExplorer />;
}
