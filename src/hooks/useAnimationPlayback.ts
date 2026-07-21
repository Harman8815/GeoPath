"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Graph } from "@/lib/graph";
import { dijkstraAnimation, type AnimationStep } from "@/lib/graph/dijkstraAnimation";

export type PlaybackStatus = "idle" | "playing" | "paused" | "finished";

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = currentIndex >= 0 && currentIndex < steps.length ? steps[currentIndex] : null;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const buildGenerator = useCallback(() => {
    generatorRef.current = dijkstraAnimation(graph, source, target);
    const all: AnimationStep[] = [];
    let result = generatorRef.current.next();
    while (!result.done) {
      all.push(result.value);
      result = generatorRef.current.next();
    }
    setSteps(all);
    setCurrentIndex(0);
    setStatus("paused");
    return all;
  }, [graph, source, target]);

  const play = useCallback(() => {
    if (steps.length === 0) {
      buildGenerator();
      return;
    }
    setStatus("playing");
  }, [steps.length, buildGenerator]);

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
    setSteps([]);
    setCurrentIndex(-1);
    setStatus("idle");
  }, [clearTimer]);

  const stepForward = useCallback(() => {
    setCurrentIndex((idx) => {
      if (idx < 0) {
        const all = buildGenerator();
        return 0;
      }
      if (idx + 1 >= steps.length) {
        setStatus("finished");
        return idx;
      }
      setStatus("paused");
      return idx + 1;
    });
  }, [steps.length, buildGenerator]);

  const stepBackward = useCallback(() => {
    setCurrentIndex((idx) => {
      const next = Math.max(0, idx - 1);
      setStatus("paused");
      return next;
    });
  }, []);

  const setSpeedControl = useCallback((newSpeed: number) => {
    void newSpeed;
  }, []);

  useEffect(() => {
    if (status === "playing") {
      clearTimer();
      const interval = Math.max(50, 1000 / speed);
      intervalRef.current = setInterval(() => {
        setCurrentIndex((idx) => {
          if (idx + 1 >= steps.length) {
            setStatus("finished");
            clearTimer();
            return idx;
          }
          return idx + 1;
        });
      }, interval);
      return () => clearTimer();
    }
  }, [status, speed, steps.length, clearTimer]);

  useEffect(() => {
    if (autoPlay && status === "idle") {
      play();
    }
  }, [autoPlay, status, play]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

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