import { useState, useCallback, useRef } from 'react';
import { PathfindingState } from '../models/PathfindingState';
import { Graph } from '../models/Graph';
import type { AnimationStep, AlgorithmType, WaypointData } from '../types';

export function usePathfinding() {
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [waypoints, setWaypoints] = useState<WaypointData[]>([]);
  
  const stateRef = useRef(PathfindingState.getInstance());
  const requestRef = useRef<number | null>(null);
  const timerRef = useRef(0);

  const startPathfinding = useCallback((algorithm: AlgorithmType) => {
    try {
      stateRef.current.start(algorithm);
      setIsRunning(true);
      setIsFinished(false);
      setAnimationSteps([]);
      setWaypoints([]);
      timerRef.current = 0;
    } catch (error) {
      console.error('[GeoPath] Failed to start pathfinding:', error);
      setIsRunning(false);
    }
  }, []);

  const stopPathfinding = useCallback(() => {
    setIsRunning(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const resetPathfinding = useCallback(() => {
    stopPathfinding();
    stateRef.current.reset();
    setIsFinished(false);
    setAnimationSteps([]);
    setWaypoints([]);
    timerRef.current = 0;
  }, [stopPathfinding]);

  const processAnimationStep = useCallback((step: AnimationStep) => {
    const node = stateRef.current.getNode(step.nodeId);
    if (!node) return;

    if (step.parent !== null) {
      const parentNode = stateRef.current.getNode(step.parent);
      if (parentNode) {
        const distance = Math.hypot(
          node.longitude - parentNode.longitude,
          node.latitude - parentNode.latitude
        );
        const timeAdd = distance * 50000;

        const newWaypoint: WaypointData = {
          path: [[parentNode.longitude, parentNode.latitude], [node.longitude, node.latitude]],
          timestamps: [timerRef.current, timerRef.current + timeAdd],
          color: step.visited ? 'path' : 'route',
        };

        setWaypoints(prev => [...prev, newWaypoint]);
        timerRef.current += timeAdd;
      }
    }
  }, []);

  const animate = useCallback(() => {
    const updatedSteps = stateRef.current.nextStep();
    
    if (updatedSteps.length > 0) {
      setAnimationSteps(prev => [...prev, ...updatedSteps]);
      updatedSteps.forEach(processAnimationStep);
    }

    if (stateRef.current.isFinished()) {
      setIsFinished(true);
      setIsRunning(false);
      return;
    }

    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [isRunning, processAnimationStep]);

  const setGraph = useCallback((graph: Graph) => {
    stateRef.current.setGraph(graph);
  }, []);

  const setEndNodeId = useCallback((nodeId: number) => {
    stateRef.current.setEndNodeId(nodeId);
  }, []);

  return {
    animationSteps,
    isRunning,
    isFinished,
    waypoints,
    startPathfinding,
    stopPathfinding,
    resetPathfinding,
    setGraph,
    setEndNodeId,
    timer: timerRef.current,
  };
}
