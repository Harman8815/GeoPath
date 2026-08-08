"use client";

import dynamic from "next/dynamic";

const AlgorithmCatalog = dynamic(() => import("@/components/AlgorithmCatalog"), { ssr: false });

export default function AlgorithmsPage() {
  return <AlgorithmCatalog onSelectAlgorithm={(id) => { window.location.href = `/algorithms/${id}`; }} onOpenMap={() => { window.location.href = "/map-explorer"; }} />;
}
