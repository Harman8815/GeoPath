"use client";

import dynamic from "next/dynamic";

const MapExplorer = dynamic(() => import("@/components/MapExplorer").then((mod) => ({ default: mod.MapExplorer })), { ssr: false });

export default function MapExplorerPage() {
  return <MapExplorer onBackToHome={() => { window.location.href = "/"; }} />;
}
