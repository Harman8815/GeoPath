"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const AlgorithmDetailPage = dynamic(() => import("@/components/AlgorithmDetailPage"), { ssr: false });

export default function AlgorithmDetailRoute() {
  const params = useParams();
  const algoId = params.id as string;

  return (
    <AlgorithmDetailPage
      algoId={algoId}
      onBack={() => { window.location.href = "/algorithms"; }}
      onSelectAlgo={(id) => { window.location.href = `/algorithms/${id}`; }}
      onOpenMap={() => { window.location.href = "/map-explorer"; }}
    />
  );
}
