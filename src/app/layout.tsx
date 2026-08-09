import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GeoPath - Pathfinding Visualizer",
  description: "Interactive pathfinding algorithm visualizer on real-world road networks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("[GeoPath] RootLayout render");
  return (
    <html
      lang="en"
      className={"  h-full antialiased"}
    >
      <body className="m-0 h-full w-full bg-[#111] p-0 text-white">
        {children}
      </body>
    </html>
  );
}
