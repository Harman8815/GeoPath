"use client";

import dynamic from "next/dynamic";

const VisualizerSection = dynamic(() => import("@/components/VisualizerSection"), { ssr: false });

export default function VisualizerPage() {
  return <VisualizerSection onBackToHome={() => { window.location.href = "/"; }} />;
}
