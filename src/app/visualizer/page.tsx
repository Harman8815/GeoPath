"use client";

import { VisualizerSection } from "@/components/VisualizerSection";

export default function VisualizerPage() {
  return <VisualizerSection onBackToHome={() => { window.location.href = "/"; }} />;
}
