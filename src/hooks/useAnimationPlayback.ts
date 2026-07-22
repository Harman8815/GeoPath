"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Graph } from "@/lib/graph";
import { dijkstraAnimation, type AnimationStep } from "@/lib/graph/dijkstraAnimation";

export type PlaybackStatus = "idle" | "building" | "playing" | "paused" | "finished";

export interface AnimationState {
  status: PlaybackStatus;
  step: AnimationStep | null;
  steps: AnimationStep[];
  currentIndex: number;
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

const CHUNK_SIZE = 2000;

export function useAnimationPlayback({
  graph,
  source,
  target,
  speed,
  autoPlay = false,
}: UseAnimationPlaybackOptions): UseAnimationPlaybackReturn {
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [steps, setSteps] = useState<AnimationStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const generatorRef = useRef<Generator<AnimationStep, void, unknown> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const statusRef = useRef(status);
  const stepsRef = useRef(steps);
  const speedRef = useRef(speed);
  const buildingRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
    stepsRef.current = steps;
    speedRef.current = speed;
  }, [status, steps, speed]);

  const step = currentIndex >= 0 && currentIndex < steps.length ? steps[currentIndex] : null;

  const clearTimer = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const buildGeneratorAsync = useCallback(() => {
    if (buildingRef.current) return;
    buildingRef.current = true;
    setStatus("building");
    setSteps([]);
    setCurrentIndex(-1);

    generatorRef.current = dijkstraAnimation(graph, source, target);
    const all: AnimationStep[] = [];
    let result = generatorRef.current.next();
    let index = 0;

    const processChunk = () => {
      const start = performance.now();
      while (index < CHUNK_SIZE && !result.done) {
        all.push(result.value);
        result = generatorRef.current!.next();
        index++;
      }

      if (!result.done) {
        setSteps([...all]);
        const elapsed = performance.now() - start;
        const delay = Math.max(0, 16 - elapsed);
        setTimeout(processChunk, delay);
      } else {
        setSteps(all);
        setCurrentIndex(0);
        setStatus("paused");
        buildingRef.current = false;
      }
    };

    processChunk();
  }, [graph, source, target]);

  const play = useCallback(() => {
    if (steps.length === 0 && !generatorRef.current) {
      buildGeneratorAsync();
      return;
    }
    if (steps.length === 0 && generatorRef.current) {
      buildGeneratorAsync();
      return;
    }
    setStatus("playing");
  }, [steps.length, buildGeneratorAsync]);

  const pause = useCallback(() => {
    clearTimer();
    setStatus("paused");
  }, [clearTimer]);

  const resume = useCallback(() => {
    setStatus("playing");
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    generatorRef.current = null;
    buildingRef.current = false;
    setSteps([]);
    setCurrentIndex(-1);
    setStatus("idle");
  }, [clearTimer]);

  const stepForward = useCallback(() => {
    setCurrentIndex((idx) => {
      if (idx < 0) {
        buildGeneratorAsync();
        return 0;
      }
      if (idx + 1 >= stepsRef.current.length) {
        setStatus("finished");
        return idx;
      }
      setStatus("paused");
      return idx + 1;
    });
  }, [buildGeneratorAsync]);

  const stepBackward = useCallback(() => {
    setCurrentIndex((idx) => {
      const next = Math.max(0, idx - 1);
      setStatus("paused");
      return next;
    });
  }, []);

  const setSpeedControl = useCallback((newSpeed: number) => {
    speedRef.current = newSpeed;
  }, []);

  const getInterval = useCallback(() => {
    const totalSteps = stepsRef.current.length;
    if (totalSteps === 0) return 500;
    const targetDuration = 15000;
    const adaptiveInterval = targetDuration / totalSteps;
    const baseInterval = Math.max(10, Math.min(500, adaptiveInterval));
    return Math.max(10, baseInterval / speedRef.current);
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    clearTimer();
    lastTickRef.current = performance.now();
    const interval = getInterval();

    const tick = (now: number) => {
      if (statusRef.current !== "playing") return;
      const elapsed = now - lastTickRef.current;
      if (elapsed >= interval) {
        lastTickRef.current = now - (elapsed % interval);
        setCurrentIndex((idx) => {
          const currentSteps = stepsRef.current;
          if (idx + 1 >= currentSteps.length) {
            setStatus("finished");
            clearTimer();
            return idx;
          }
          return idx + 1;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      clearTimer();
    };
  }, [status, speed, clearTimer, getInterval]);

  useEffect(() => {
    if (autoPlay && status === "idle") {
      const timer = setTimeout(() => play(), 0);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, status, play]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  console.log("[Playback] status:", status, "steps:", steps.length, "index:", currentIndex, "speed:", speed);

  return {
    status,
    step,
    steps,
    currentIndex,
    play,
    pause,
    resume,
    reset,
    stepForward,
    stepBackward,
    setSpeed: setSpeedControl,
  };
}
