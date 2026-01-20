"use client";

import { useEffect, useRef, useState } from "react";

interface ScanLinesProps {
  lineCount?: number;
  color?: string;
  maxOpacity?: number;
  mouseInfluence?: number;
}

export function ParticleField({
  lineCount = 40,
  color = "26, 26, 26",
  maxOpacity = 0.15,
  mouseInfluence = 250,
}: ScanLinesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let mouse = { x: -1000, y: -1000 };
    let time = 0;

    // Line properties
    interface Line {
      baseY: number;
      phase: number;
      speed: number;
      amplitude: number;
      opacity: number;
    }

    let lines: Line[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initLines();
    };

    const initLines = () => {
      lines = [];
      const spacing = canvas.height / lineCount;
      for (let i = 0; i < lineCount; i++) {
        lines.push({
          baseY: i * spacing + spacing / 2,
          phase: Math.random() * Math.PI * 2,
          speed: 0.02 + Math.random() * 0.01,
          amplitude: 2 + Math.random() * 3,
          opacity: maxOpacity * (0.3 + Math.random() * 0.7),
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseLeave = () => {
      mouse = { x: -1000, y: -1000 };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        line.phase += line.speed;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${color}, ${line.opacity})`;
        ctx.lineWidth = 1;

        // Draw line with wave distortion
        const segments = 100;
        const segmentWidth = canvas.width / segments;

        for (let j = 0; j <= segments; j++) {
          const x = j * segmentWidth;

          // Base wave
          let y = line.baseY + Math.sin(line.phase + x * 0.005 + time * 0.01) * line.amplitude;

          // Mouse influence - create a bulge/wave near cursor
          const dx = x - mouse.x;
          const dy = line.baseY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseInfluence) {
            const influence = 1 - dist / mouseInfluence;
            const bulge = Math.sin(influence * Math.PI) * 30 * influence;
            // Push away from mouse vertically
            const direction = dy > 0 ? 1 : -1;
            y += bulge * direction;

            // Also add some horizontal wave distortion
            y += Math.sin(time * 0.05 + j * 0.1) * influence * 10;
          }

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    resize();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mounted, lineCount, color, maxOpacity, mouseInfluence]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ pointerEvents: "none" }}
    />
  );
}
