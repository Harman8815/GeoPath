"use client";

import dynamic from "next/dynamic";

const AppNew = dynamic(() => import("@/components/App_new"), { ssr: false });

export default function Home() {
  return <AppNew />;
}
