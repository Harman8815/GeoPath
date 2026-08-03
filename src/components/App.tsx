"use client";

import Map from "./Map";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useEffect } from "react";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  console.log("[GeoPath] App render, ThemeProvider mounted");
  useEffect(() => {
    window.onerror = (message, source, lineno, colno, error) => {
      console.error("[GeoPath] Global JS error:", { message, source, lineno, colno, error });
    };
    window.addEventListener("unhandledrejection", (event) => {
      console.error("[GeoPath] Unhandled promise rejection:", event.reason);
    });
  }, []);
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Map />
    </ThemeProvider>
  );
}

export default App;
