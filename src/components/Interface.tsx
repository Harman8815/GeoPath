"use client";

import { Button, IconButton, Typography, Tooltip, MenuItem, Select, InputLabel, FormControl, Menu, Dialog, DialogTitle, DialogContent, Tabs, Tab, Box, Grid } from "@mui/material";
import { MuiColorInput } from "mui-color-input";
import { PlayArrow, Settings, Movie, Pause, Replay, Close } from "@mui/icons-material";
import Slider from "./Slider";
import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { INITIAL_COLORS, LOCATIONS } from "../config";
import { arrayToRgb, rgbToArray } from "../helpers";
import type { MapSettings, ColorScheme, ViewState } from "../types";

interface InterfaceProps {
  canStart: boolean;
  started: boolean;
  animationEnded: boolean;
  playbackOn: boolean;
  time: number;
  maxTime: number;
  settings: MapSettings;
  colors: {
    startNodeFill: number[];
    startNodeBorder: number[];
    endNodeFill: number[];
    endNodeBorder: number[];
    path: number[];
    route: number[];
    explored: number[];
    finalPath: number[];
  };
  loading: boolean;
  timeChanged: (time: number) => void;
  cinematic: boolean;
  placeEnd: boolean;
  changeRadius: (radius: number) => void;
  changeAlgorithm: (algorithm: string) => void;
  setPlaceEnd: (placeEnd: boolean) => void;
  setCinematic: (cinematic: boolean) => void;
  setSettings: (settings: MapSettings) => void;
  setColors: (colors: ColorScheme) => void;
  startPathfinding: () => void;
  toggleAnimation: (loop?: boolean, direction?: number) => void;
  clearPath: () => void;
  changeLocation: (location: { name: string; latitude: number; longitude: number }) => void;
}

const Interface = forwardRef<{ showSnack: (message: string, type?: "error" | "info" | "success" | "warning") => void }, InterfaceProps>(({ canStart, started, animationEnded, playbackOn, time, maxTime, settings, colors, loading, timeChanged, cinematic, placeEnd, changeRadius, changeAlgorithm, setPlaceEnd, setCinematic, setSettings, setColors, startPathfinding, toggleAnimation, clearPath, changeLocation }, ref) => {
  console.log("[GeoPath] Interface render:", { canStart, started, animationEnded, loading });
  const [sidebar, setSidebar] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; type: "error" | "info" | "success" | "warning" }>({
    open: false,
    message: "",
    type: "error",
  });
  const [tabIndex, setTabIndex] = useState(0);
  const [helper, setHelper] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);
  const helperTime = useRef(4800);
  const rightDown = useRef(false);
  const leftDown = useRef(false);

  useImperativeHandle(ref, () => ({
    showSnack(message: string, type: "error" | "info" | "success" | "warning" = "error") {
      setSnack({ open: true, message, type });
    },
  }));

  function closeSnack() {
    setSnack({ ...snack, open: false });
  }

  function closeHelper() {
    setHelper(false);
  }

  // Tutorial handlers removed

  function handlePlay() {
    if (!canStart) return;
    if (!started && time === 0) {
      startPathfinding();
      return;
    }
    toggleAnimation();
  }

  function closeMenu() {
    setMenuAnchor(null);
  }

  window.onkeydown = (e) => {
    if (e.code === "ArrowRight" && !rightDown.current && !leftDown.current && (!started || animationEnded)) {
      rightDown.current = true;
      toggleAnimation(false, 1);
    } else if (e.code === "ArrowLeft" && !leftDown.current && !rightDown.current && animationEnded) {
      leftDown.current = true;
      toggleAnimation(false, -1);
    }
  };

  window.onkeyup = (e) => {
    if (e.code === "Escape") setCinematic(false);
    else if (e.code === "Space") {
      e.preventDefault();
      handlePlay();
    } else if (e.code === "ArrowRight" && rightDown.current) {
      rightDown.current = false;
      toggleAnimation(false, 1);
    } else if (e.code === "ArrowLeft" && animationEnded && leftDown.current) {
      leftDown.current = false;
      toggleAnimation(false, 1);
    } else if (e.code === "KeyR" && (animationEnded || !started)) clearPath();
  };

  useEffect(() => {
    if (!cinematic) return;
    console.log("[GeoPath] Cinematic mode enabled");
    setHelper(true);
    setTimeout(() => {
      helperTime.current = 2500;
    }, 200);
  }, [cinematic]);

  // Initial tutorial presentation removed

  return (
    <>
      {/* Top navigation - commented out for UI simplification */}
      {/* <div className={`nav-top ${cinematic ? "cinematic" : ""}`}>
        <div className="side slider-container">
          <Typography id="playback-slider" gutterBottom>
            Animation playback
          </Typography>
          <Slider disabled={!animationEnded} value={animationEnded ? time : maxTime} min={animationEnded ? 0 : -1} max={maxTime} onChange={(_e: any, value: any) => { timeChanged(Number(value)); }} className="slider" aria-labelledby="playback-slider" />
        </div>
        <IconButton disabled={!canStart} onClick={handlePlay} style={{ backgroundColor: "#46B780", width: 60, height: 60 }} size="large">
          {(!started || animationEnded && !playbackOn)
            ? <PlayArrow style={{ color: "#fff", width: 26, height: 26 }} fontSize="inherit" />
            : <Pause style={{ color: "#fff", width: 26, height: 26 }} fontSize="inherit" />
          }
        </IconButton>
        <div className="side">
          <Button disabled={!animationEnded && started} onClick={clearPath} style={{ color: "#fff", backgroundColor: "#404156", paddingInline: 30, paddingBlock: 7 }} variant="contained">Clear path</Button>
        </div>
      </div> */}

      <div className={`nav-right ${cinematic ? "cinematic" : ""}`}>
        <Tooltip title="Open settings">
          <IconButton onClick={() => { setSidebar(true); }} style={{ backgroundColor: "#2A2B37", width: 36, height: 36 }} size="large">
            <Settings style={{ color: "#fff", width: 24, height: 24 }} fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </div>

      <div className={`nav-top-right ${cinematic ? "cinematic" : ""}`} style={{
        position: 'fixed',
        right: '24px',
        top: '20px',
        display: 'flex',
        gap: '12px',
        zIndex: 1000,
        transition: 'transform 500ms ease-out, opacity 300ms ease-in'
      }}>
        <Tooltip title={(!started || animationEnded && !playbackOn) ? "Start visualizer" : "Pause visualizer"}>
          <IconButton disabled={!canStart} onClick={handlePlay} style={{ backgroundColor: "#46B780", width: 36, height: 36 }} size="large">
            {(!started || animationEnded && !playbackOn)
              ? <PlayArrow style={{ color: "#fff", width: 22, height: 22 }} fontSize="inherit" />
              : <Pause style={{ color: "#fff", width: 22, height: 22 }} fontSize="inherit" />
            }
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset visualizer">
          <IconButton disabled={!animationEnded && started} onClick={clearPath} style={{ backgroundColor: "#404156", width: 36, height: 36 }} size="large">
            <Replay style={{ color: "#fff", width: 22, height: 22 }} fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </div>

      {/* Loader - commented out for UI simplification */}
      {/* <div className="loader-container">
        <Fade
          in={loading}
          style={{
            transitionDelay: loading ? "50ms" : "0ms",
          }}
          unmountOnExit
        >
          <CircularProgress color="inherit" />
        </Fade>
      </div> */}

      {/* Snackbars - commented out for UI simplification */}
      {/* <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.type}
          style={{ width: "100%", color: "#fff" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={helper}
        autoHideDuration={helperTime.current}
        onClose={closeHelper}
      >
        <div className="cinematic-alert">
          <Typography fontSize="18px"><b>Cinematic mode</b></Typography>
          <Typography>Use keyboard shortcuts to control animation</Typography>
          <Typography>Press <b>Escape</b> to exit</Typography>
        </div>
      </Snackbar> */}

      {/* Mobile controls - commented out for UI simplification */}
      {/* <div className="mobile-controls">
        <Button onClick={() => { setPlaceEnd(!placeEnd); }} style={{ color: "#fff", backgroundColor: "#404156", paddingInline: 30, paddingBlock: 7 }} variant="contained">
          {placeEnd ? "placing end node" : "placing start node"}
        </Button>
      </div> */}

      <Dialog
        open={sidebar}
        onClose={() => { setSidebar(false); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#1F2029",
            backgroundImage: "none",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#fff",
            padding: "8px",
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: "bold", letterSpacing: "0.5px" }}>
            Configuration Panel
          </Typography>
          <IconButton
            onClick={() => { setSidebar(false); }}
            sx={{ color: "rgba(255, 255, 255, 0.7)", "&:hover": { color: "#fff" } }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <Box sx={{ borderBottom: 1, borderColor: "rgba(255, 255, 255, 0.1)", px: 2 }}>
          <Tabs
            value={tabIndex}
            onChange={(_e, v) => setTabIndex(v)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "#46B780",
              },
              "& .MuiTab-root": {
                minWidth: "auto",
                fontWeight: "medium",
                mr: 2,
                px: 1,
                py: 1.5,
                color: "rgba(255, 255, 255, 0.6)",
                "&.Mui-selected": {
                  color: "#46B780",
                }
              }
            }}
          >
            <Tab label="General" />
            <Tab label="Styles & Colors" />
            <Tab label="Shortcuts" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 3, minHeight: "340px" }}>
          {tabIndex === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <FormControl variant="filled" sx={{ width: "100%" }}>
                    <InputLabel style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 13 }} id="algo-select">Algorithm</InputLabel>
                    <Select
                      labelId="algo-select"
                      value={settings.algorithm}
                      onChange={(e) => { changeAlgorithm(e.target.value); }}
                      required
                      sx={{ 
                        backgroundColor: "#2A2B37", 
                        color: "#fff", 
                        borderRadius: "8px",
                        "&:hover": { backgroundColor: "#323342" },
                        "&.MuiFilledInput-root": {
                          backgroundColor: "#2A2B37",
                          "&:before, &:after": { display: "none" }
                        }
                      }}
                      inputProps={{ MenuProps: { MenuListProps: { sx: { backgroundColor: "#2A2B37", color: "#fff" } } } }}
                      size="small"
                      disabled={!animationEnded && started}
                    >
                      <MenuItem value={"astar"}>A* algorithm</MenuItem>
                      <MenuItem value={"greedy"}>Greedy algorithm</MenuItem>
                       <MenuItem value={"dijkstra"}>Dijkstra&apos;s algorithm</MenuItem>
                      <MenuItem value={"bidirectional"}>Bidirectional Search</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    id="locations-button"
                    aria-controls={menuOpen ? "locations-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={menuOpen ? "true" : undefined}
                    onClick={(e) => { setMenuAnchor(e.currentTarget); }}
                    variant="contained"
                    disableElevation
                    sx={{ 
                      backgroundColor: "#2A2B37", 
                      color: "#fff", 
                      textTransform: "none", 
                      fontSize: 14, 
                      py: 1.5, 
                      borderRadius: "8px",
                      width: "100%",
                      justifyContent: "center",
                      "&:hover": { backgroundColor: "#323342" }
                    }}
                  >
                    Quick Locations
                  </Button>
                  <Menu
                    id="locations-menu"
                    anchorEl={menuAnchor}
                    open={menuOpen}
                    onClose={() => { setMenuAnchor(null); }}
                    MenuListProps={{
                      "aria-labelledby": "locations-button",
                      sx: {
                        backgroundColor: "#2A2B37",
                        color: "#fff",
                      },
                    }}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "center",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "center",
                    }}
                  >
                    {LOCATIONS.map((location) =>
                      <MenuItem 
                        key={location.name} 
                        onClick={() => {
                          closeMenu();
                          changeLocation(location);
                        }}
                        sx={{ "&:hover": { backgroundColor: "#323342" } }}
                      >
                        {location.name}
                      </MenuItem>
                    )}
                  </Menu>
                </Grid>
              </Grid>

              <Box sx={{ mt: 1 }}>
                <Typography id="area-slider" sx={{ mb: 1, color: "rgba(255, 255, 255, 0.8)", fontSize: "14px" }}>
                  Area radius: <b>{settings.radius}km</b> ({((settings.radius / 1.609)).toFixed(1)}mi)
                </Typography>
                <Slider 
                  disabled={started && !animationEnded} 
                  min={2} 
                  max={20} 
                  step={1} 
                  value={settings.radius} 
                  onChangeCommited={() => { changeRadius(settings.radius); }} 
                  onChange={(_e: Event, value: number | number[]) => { setSettings({ ...settings, radius: Number(value) }); }} 
                  className="slider" 
                  aria-labelledby="area-slider" 
                  style={{ marginBottom: 1 }}
                  marks={[
                    { value: 2, label: "2km" },
                    { value: 20, label: "20km" },
                  ]}
                />
              </Box>

              <Box sx={{ mt: 1 }}>
                <Typography id="speed-slider" sx={{ mb: 1, color: "rgba(255, 255, 255, 0.8)", fontSize: "14px" }}>
                  Animation speed
                </Typography>
                <Slider 
                  min={1} 
                  max={30} 
                  value={settings.speed} 
                  onChange={(_e: Event, value: number | number[]) => { setSettings({ ...settings, speed: Number(value) }); }} 
                  className="slider" 
                  aria-labelledby="speed-slider" 
                  style={{ marginBottom: 1 }} 
                />
              </Box>
            </Box>
          )}

          {tabIndex === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Grid container spacing={2}>
                {[
                  { id: "start-fill-label", label: "Start node fill", value: colors.startNodeFill, key: "startNodeFill", init: INITIAL_COLORS.startNodeFill },
                  { id: "start-border-label", label: "Start node border", value: colors.startNodeBorder, key: "startNodeBorder", init: INITIAL_COLORS.startNodeBorder },
                  { id: "end-fill-label", label: "End node fill", value: colors.endNodeFill, key: "endNodeFill", init: INITIAL_COLORS.endNodeFill },
                  { id: "end-border-label", label: "End node border", value: colors.endNodeBorder, key: "endNodeBorder", init: INITIAL_COLORS.endNodeBorder },
                  { id: "path-label", label: "Explored path color", value: colors.explored, key: "explored", init: INITIAL_COLORS.explored },
                  { id: "route-label", label: "Shortest route color", value: colors.finalPath, key: "finalPath", init: INITIAL_COLORS.finalPath },
                ].map((item) => (
                  <Grid item xs={12} sm={6} key={item.key}>
                    <Typography id={item.id} sx={{ mb: 0.5, fontSize: "13px", color: "rgba(255, 255, 255, 0.7)" }}>
                      {item.label}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <MuiColorInput 
                        value={arrayToRgb(item.value)} 
                        onChange={v => {setColors({...colors, [item.key]: rgbToArray(v)});}} 
                        aria-labelledby={item.id} 
                        sx={{ 
                          backgroundColor: "#2A2B37",
                          borderRadius: "6px",
                          width: "100%",
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { border: "none" }
                          }
                        }} 
                      />
                      <IconButton 
                        onClick={() => {setColors({...colors, [item.key]: item.init});}} 
                        sx={{ backgroundColor: "#2A2B37", borderRadius: "6px", p: 1.25, "&:hover": { backgroundColor: "#323342" } }} 
                        size="small"
                      >
                        <Replay sx={{ color: "#fff", width: 18, height: 18 }} />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {tabIndex === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "13px", mb: 1, textTransform: "uppercase", letterSpacing: "1px" }}>
                Keyboard Shortcuts
              </Typography>
              {[
                { keys: "Space", desc: "Start/Stop animation simulation" },
                { keys: "R", desc: "Clear path & reset visualizer" },
                { keys: "Left / Right Arrows", desc: "Step backward / forward in playback timeline" },
                { keys: "Escape", desc: "Exit cinematic view mode" }
              ].map((shortcut, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    py: 1.25, 
                    px: 2, 
                    backgroundColor: "#2A2B37", 
                    borderRadius: "8px" 
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#46B780", fontWeight: "bold" }}>
                    {shortcut.keys}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                    {shortcut.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* GitHub ribbon - removed for UI simplification */}
      {/* <a href="https://github.com/honzaap/Pathfinding" aria-label="GitHub repository" target="_blank" className={`github-corner ${cinematic ? "cinematic" : ""}`}>
        <svg width="60" height="60" viewBox="0 0 250 250">
          <path fill="#2A2B37" d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
          <path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" className="octo-arm"></path>
          <path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" className="octo-body"></path>
        </svg>
      </a> */}


    </>
  );
});

Interface.displayName = "Interface";

export default Interface;
