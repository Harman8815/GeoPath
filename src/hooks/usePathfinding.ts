import { useState, useCallback, useRef } from 'react';
import { PathfindingState } from '../models/PathfindingState';
import { Graph } from '../models/Graph';
import type { AnimationStep, AlgorithmType, WaypointData } from '../types';

export function usePathfinding() {
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [waypoints, setWaypoints] = useState<WaypointData[]>([]);
  const [exploredEdges, setExploredEdges] = useState<WaypointData[]>([]);
  const [finalPath, setFinalPath] = useState<WaypointData[]>([]);
  
  const stateRef = useRef(PathfindingState.getInstance());
  const timeoutRef = useRef<number | null>(null);
  const timerRef = useRef(0);
  const exploredTimerRef = useRef(0);
  const isRunningRef = useRef(false);
  const animationDelay = 50; // ms between steps

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

  const processExploredEdge = useCallback((step: AnimationStep) => {
    const node = stateRef.current.getNode(step.nodeId);
    if (!node || step.parent === null) return;

    const parentNode = stateRef.current.getNode(step.parent);
    if (!parentNode) return;

    const exploredWaypoint: WaypointData = {
      path: [[parentNode.longitude, parentNode.latitude], [node.longitude, node.latitude]],
      timestamps: [exploredTimerRef.current, exploredTimerRef.current + 100],
      color: 'explored',
    };

    console.log("[GeoPath] Adding explored edge:", {
      from: step.parent,
      to: step.nodeId,
      totalExplored: exploredEdges.length + 1
    });

    setExploredEdges(prev => [...prev, exploredWaypoint]);
    exploredTimerRef.current += 100;
  }, [exploredEdges]);

  const animateFinalPath = useCallback(() => {
    const endNodeId = stateRef.current.getEndNodeId();
    const startNodeId = stateRef.current.getStartNodeId();
    
    console.log("[GeoPath] Reconstructing final path:", { startNodeId, endNodeId });
    
    if (!endNodeId || !startNodeId) {
      console.log("[GeoPath] Cannot reconstruct path - missing start or end node");
      return;
    }

    // Reconstruct the final path by following parent pointers
    const path: number[] = [];
    let currentNodeId = endNodeId;
    let currentNode = stateRef.current.getNode(currentNodeId);
    
    while (currentNodeId !== startNodeId && currentNode) {
      path.unshift(currentNodeId);
      currentNodeId = currentNode.parent || 0;
      currentNode = stateRef.current.getNode(currentNodeId);
    }
    
    if (currentNodeId === startNodeId) {
      path.unshift(startNodeId);
    }

    console.log("[GeoPath] Final path reconstructed with", path.length, "nodes");

    // Create waypoints for the final path
    const finalPathWaypoints: WaypointData[] = [];
    let finalTimer = 0;
    
    for (let i = 0; i < path.length - 1; i++) {
      const fromNode = stateRef.current.getNode(path[i]);
      const toNode = stateRef.current.getNode(path[i + 1]);
      
      if (fromNode && toNode) {
        const distance = Math.hypot(
          toNode.longitude - fromNode.longitude,
          toNode.latitude - fromNode.latitude
        );
        const timeAdd = distance * 30000;
        
        finalPathWaypoints.push({
          path: [[fromNode.longitude, fromNode.latitude], [toNode.longitude, toNode.latitude]],
          timestamps: [finalTimer, finalTimer + timeAdd],
          color: 'finalPath',
        });
        
        finalTimer += timeAdd;
      }
    }
    
    console.log("[GeoPath] Final path waypoints created:", finalPathWaypoints.length);
    setFinalPath(finalPathWaypoints);
  }, []);

  const animate = useCallback(() => {
    const updatedSteps = stateRef.current.nextStep();
    
    console.log("[GeoPath] Animation step:", {
      stepsProcessed: updatedSteps.length,
      isRunning: isRunningRef.current,
      isFinished: stateRef.current.isFinished(),
      totalExploredEdges: exploredEdges.length
    });
    
    if (updatedSteps.length > 0) {
      setAnimationSteps(prev => [...prev, ...updatedSteps]);
      updatedSteps.forEach(processAnimationStep);
      updatedSteps.forEach(processExploredEdge);
    }

    if (stateRef.current.isFinished()) {
      console.log("[GeoPath] Animation finished - reconstructing final path");
      setIsFinished(true);
      setIsRunning(false);
      isRunningRef.current = false;
      animateFinalPath();
      return;
    }

    if (isRunningRef.current) {
      timeoutRef.current = window.setTimeout(animate, animationDelay);
    }
  }, [processAnimationStep, processExploredEdge, animateFinalPath, exploredEdges, animationDelay]);

  const startPathfinding = useCallback((algorithm: AlgorithmType) => {
    try {
      console.log("[GeoPath] Starting pathfinding animation with algorithm:", algorithm);
      stateRef.current.start(algorithm);
      setIsRunning(true);
      isRunningRef.current = true;
      setIsFinished(false);
      setAnimationSteps([]);
      setWaypoints([]);
      setExploredEdges([]);
      setFinalPath([]);
      timerRef.current = 0;
      exploredTimerRef.current = 0;
      
      // Start animation loop with delay
      console.log("[GeoPath] Animation loop started with delay:", animationDelay, "ms");
      timeoutRef.current = window.setTimeout(animate, animationDelay);
    } catch (error) {
      console.error('[GeoPath] Failed to start pathfinding:', error);
      setIsRunning(false);
      isRunningRef.current = false;
    }
  }, [animate, animationDelay]);

  const stopPathfinding = useCallback(() => {
    setIsRunning(false);
    isRunningRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetPathfinding = useCallback(() => {
    stopPathfinding();
    stateRef.current.reset();
    setIsFinished(false);
    setAnimationSteps([]);
    setWaypoints([]);
    setExploredEdges([]);
    setFinalPath([]);
    timerRef.current = 0;
    exploredTimerRef.current = 0;
  }, [stopPathfinding]);

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
    exploredEdges,
    finalPath,
    startPathfinding,
    stopPathfinding,
    resetPathfinding,
    setGraph,
    setEndNodeId,
    timer: timerRef.current,
  };
}
