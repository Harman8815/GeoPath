"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Graph } from "@/lib/graph";
import { dijkstraAnimation, type AnimationStep } from "@/lib/graph/dijkstraAnimation";

export type PlaybackStatus = "idle" | "building" | "playing" | "paused" | "finished";

export interface AnimationState {
  status: PlaybackStatus;
  description: string;
  visitedCount: number;
  exploredCount: number;
  exploredEdges: Array<{ source: string; target: string }>;
  currentNode: string | null;
  currentEdge: { source: string; target: string } | null;
  path: string[];
  progress: number;
}

export interface UseAnimationPlaybackOptions {
  graph: Graph;
  source: string;
  target: string;
  speed: number;
  autoPlay?: boolean;
}

export interface UseAnimationPlaybackReturn extends AnimationState {
  play: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setSpeed: (speed: number) => void;
}

export function useAnimationPlayback({
  graph,
  source,
  target,
  speed,
  autoPlay = false,
}: UseAnimationPlaybackOptions): UseAnimationPlaybackReturn {
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [description, setDescription] = useState("");
  const [visitedCount, setVisitedCount] = useState(0);
  const [exploredCount, setExploredCount] = useState(0);
  const [exploredEdges, setExploredEdges] = useState<Array<{ source: string; target: string }>>([]);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [currentEdge, setCurrentEdge] = useState<{ source: string; target: string } | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const generatorRef = useRef<Generator<AnimationStep, void, unknown> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const statusRef = useRef(status);
  const speedRef = useRef(speed);
  const visitedSetRef = useRef(new Set<string>());
  const exploredEdgesRef = useRef<Array<{ source: string; target: string }>>([]);
  const previousRef = useRef<Map<string, string | null>>(new Map());
  const currentNodeRef = useRef<string | null>(null);
  const currentEdgeRef = useRef<{ source: string; target: string } | null>(null);
  const totalEstimatedStepsRef = useRef(0);
  const stepsAdvancedRef = useRef(0);

  useEffect(() => {
    statusRef.current = status;
    speedRef.current = speed;
  }, [status, speed]);

  const clearTimer = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const updateReactState = useCallback(() => {
    setDescription(prev => prev);
    setVisitedCount(visitedSetRef.current.size);
    setExploredCount(exploredEdgesRef.current.length);
    setExploredEdges([...exploredEdgesRef.current]);
    setCurrentNode(currentNodeRef.current);
    setCurrentEdge(currentEdgeRef.current);
  }, []);

  const advanceGenerator = useCallback((steps: number): boolean => {
    if (!generatorRef.current) return false;
    
    let advanced = 0;
    while (advanced < steps) {
      const result = generatorRef.current.next();
      if (result.done) {
        return false;
      }
      
      const step = result.value;
      if (step.type === "visit") {
        visitedSetRef.current.add(step.nodeId);
        currentNodeRef.current = step.nodeId;
        currentEdgeRef.current = null;
      } else if (step.type === "relax" && step.newEdge) {
        exploredEdgesRef.current.push(step.newEdge);
        currentEdgeRef.current = step.newEdge;
        currentNodeRef.current = null;
      } else if (step.type === "finish") {
        visitedSetRef.current.add(step.nodeId);
        setPath(step.path ?? []);
        setStatus("finished");
        updateReactState();
        return false;
      }
      
      advanced++;
      stepsAdvancedRef.current++;
    }
    
    updateReactState();
    return true;
  }, [updateReactState]);

  const play = useCallback(() => {
    if (!source || !target) {
      return;
    }
    
    if (statusRef.current === "idle" || statusRef.current === "finished") {
      generatorRef.current = dijkstraAnimation(graph, source, target);
      visitedSetRef.current = new Set();
      exploredEdgesRef.current = [];
      previousRef.current = new Map();
      currentNodeRef.current = null;
      currentEdgeRef.current = null;
      stepsAdvancedRef.current = 0;
      
      const totalNodes = graph.getNodes().length;
      totalEstimatedStepsRef.current = Math.max(1, Math.floor(totalNodes * 1.5));
    }
    
    if (!generatorRef.current) {
      return;
    }
    
    setStatus("playing");
    lastTickRef.current = performance.now();
    
    const tick = (now: number) => {
      if (statusRef.current !== "playing") return;
      
      const elapsed = now - lastTickRef.current;
      const totalSteps = totalEstimatedStepsRef.current;
      const targetDuration = 20000;
      const stepsPerSecond = totalSteps / targetDuration;
      const speed = speedRef.current;
      const expectedSteps = Math.max(1, Math.floor(stepsPerSecond * elapsed * speed / 1000));
      
      const stepsToAdvance = Math.max(1, Math.floor(expectedSteps / 10));
      
      const continued = advanceGenerator(stepsToAdvance);
      if (!continued) {
        clearTimer();
        return;
      }
      
      lastTickRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    
    rafRef.current = requestAnimationFrame(tick);
  }, [graph, source, target, advanceGenerator, clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setStatus("paused");
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (!generatorRef.current) return;
    setStatus("playing");
    lastTickRef.current = performance.now();
    
    const tick = (now: number) => {
      if (statusRef.current !== "playing") return;
      
      const elapsed = now - lastTickRef.current;
      const totalSteps = totalEstimatedStepsRef.current;
      const targetDuration = 20000;
      const stepsPerSecond = totalSteps / targetDuration;
      const speed = speedRef.current;
      const expectedSteps = Math.max(1, Math.floor(stepsPerSecond * elapsed * speed / 1000));
      const stepsToAdvance = Math.max(1, Math.floor(expectedSteps / 10));
      
      const continued = advanceGenerator(stepsToAdvance);
      if (!continued) {
        clearTimer();
        return;
      }
      
      lastTickRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    
    rafRef.current = requestAnimationFrame(tick);
  }, [advanceGenerator, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    generatorRef.current = null;
    visitedSetRef.current = new Set();
    exploredEdgesRef.current = [];
    previousRef.current = new Map();
    currentNodeRef.current = null;
    currentEdgeRef.current = null;
    stepsAdvancedRef.current = 0;
    totalEstimatedStepsRef.current = 0;
    setPath([]);
    setStatus("idle");
    setDescription("");
    setVisitedCount(0);
    setExploredCount(0);
    setExploredEdges([]);
    setCurrentNode(null);
    setCurrentEdge(null);
    setProgress(0);
  }, [clearTimer]);

  const stepForward = useCallback(() => {
    if (!generatorRef.current) {
      generatorRef.current = dijkstraAnimation(graph, source, target);
      visitedSetRef.current = new Set();
      exploredEdgesRef.current = [];
      previousRef.current = new Map();
      currentNodeRef.current = null;
      currentEdgeRef.current = null;
      stepsAdvancedRef.current = 0;
      totalEstimatedStepsRef.current = Math.max(1, Math.floor(graph.getNodes().length * 1.5));
    }
    
    const continued = advanceGenerator(1);
    if (continued) {
      setStatus("paused");
    }
  }, [graph, source, target, advanceGenerator]);

  const stepBackward = useCallback(() => {
    setStatus("paused");
  }, []);

  const setSpeedControl = useCallback((newSpeed: number) => {
    speedRef.current = newSpeed;
  }, []);

  useEffect(() => {
    if (autoPlay && status === "idle" && source && target) {
      const timer = setTimeout(() => play(), 0);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, status, play, source, target]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (status === "playing") {
      const total = totalEstimatedStepsRef.current;
      if (total > 0) {
        const pct = Math.min(100, Math.round((stepsAdvancedRef.current / total) * 100));
        setProgress(pct);
      }
    }
  }, [status, visitedCount, exploredCount]);

  console.log("[Playback] status:", status, "visited:", visitedCount, "explored:", exploredCount, "speed:", speed);

  return {
    status,
    description,
    visitedCount,
    exploredCount,
    exploredEdges,
    currentNode,
    currentEdge,
    path,
    progress,
    play,
    pause,
    resume,
    reset,
    stepForward,
    stepBackward,
    setSpeed: setSpeedControl,
  };
}
