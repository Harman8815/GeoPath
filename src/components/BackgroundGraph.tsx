import React, { useEffect, useRef } from 'react';

interface ParticleNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulseOffset: number;
}

interface PulsePacket {
  fromIndex: number;
  toIndex: number;
  progress: number; // 0 to 1
  speed: number;
  color: string;
}

export const BackgroundGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    window.addEventListener('resize', handleResize);

    // Node Count based on screen size
    const nodeCount = Math.min(Math.floor((width * height) / 22000), 55);
    let nodes: ParticleNode[] = [];
    const pulses: PulsePacket[] = [];

    function initNodes() {
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1.5,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    initNodes();

    // Spawn pulses along connected nodes
    const pulseInterval = setInterval(() => {
      if (nodes.length < 2) return;
      const from = Math.floor(Math.random() * nodes.length);
      // Find nearest neighbor
      let bestDist = Infinity;
      let to = -1;
      for (let j = 0; j < nodes.length; j++) {
        if (from === j) continue;
        const dx = nodes[from].x - nodes[j].x;
        const dy = nodes[from].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist < bestDist) {
          bestDist = dist;
          to = j;
        }
      }

      if (to !== -1) {
        pulses.push({
          fromIndex: from,
          toIndex: to,
          progress: 0,
          speed: 0.012 + Math.random() * 0.008,
          color: Math.random() > 0.5 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(148, 163, 184, 0.75)',
        });
      }
    }, 500);

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle cartographic river curve (Thames style)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(width * 0.1, height * 0.35);
      ctx.bezierCurveTo(
        width * 0.35, height * 0.42,
        width * 0.52, height * 0.68,
        width * 0.95, height * 0.55
      );
      ctx.strokeStyle = 'rgba(35, 43, 56, 0.85)';
      ctx.lineWidth = Math.max(28, width * 0.025);
      ctx.lineCap = 'round';
      ctx.stroke();

      // Inner subtle river highlight
      ctx.strokeStyle = 'rgba(48, 59, 78, 0.35)';
      ctx.lineWidth = Math.max(12, width * 0.012);
      ctx.stroke();
      ctx.restore();

      // Draw subtle background road/grid network in grey
      const gridSize = 70;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.035)';
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw subtle diagonal vector street paths
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1.2;
      for (let i = -width; i < width * 2; i += 180) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height * 0.6, height);
        ctx.stroke();
      }

      // Draw district watermarks in subtle grey
      ctx.save();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.07)';
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('CITY OF LONDON', width * 0.68, height * 0.32);
      ctx.fillText('WESTMINSTER', width * 0.38, height * 0.76);
      ctx.fillText('BLOOMSBURY', width * 0.45, height * 0.22);
      ctx.fillText('SOUTHWARK', width * 0.62, height * 0.58);
      ctx.fillText('PADDINGTON', width * 0.12, height * 0.28);
      ctx.restore();

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        // Bounce on boundaries
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        // Connections
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.08;
            ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }

        // Draw node circle
        const glow = Math.sin(time + n.pulseOffset) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(148, 163, 184, ${0.25 + glow * 0.25})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render pulses traveling along edges
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const n1 = nodes[pulse.fromIndex];
        const n2 = nodes[pulse.toIndex];
        if (!n1 || !n2) continue;

        const px = n1.x + (n2.x - n1.x) * pulse.progress;
        const py = n1.y + (n2.y - n1.y) * pulse.progress;

        ctx.fillStyle = pulse.color;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(pulseInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-80" />;
};
