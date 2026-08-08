"use client";

import { AlgorithmCatalog } from "@/components/AlgorithmCatalog";

export default function AlgorithmsPage() {
  return <AlgorithmCatalog onSelectAlgorithm={(id) => { window.location.href = `/algorithms/${id}`; }} onOpenMap={() => { window.location.href = "/map-explorer"; }} />;
}
