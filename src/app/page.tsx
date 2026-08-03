"use client";

import dynamic from "next/dynamic";

const App = dynamic(() => import("@/components/App"), { ssr: false });

export default function Home() {
  console.log("[GeoPath] Home page render");
  return <App />;
}
