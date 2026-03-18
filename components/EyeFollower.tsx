'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

// ─── Eye socket positions (px, relative to component top-left) ───────────────
// Calibrated from Pencil design: EyeSocketLeft (524,190) + EyeSocketRight (612,190)
// Adjust cx/cy if the rendered image scales differently.
const EYE_SOCKETS = [
  { id: 'left',  cx: 540, cy: 200, rx: 16, ry: 10 }, // cx/cy = center, rx/ry = socket radius
  { id: 'right', cx: 628, cy: 200, rx: 16, ry: 10 },
] as const;

// Max px a pupil can travel from its resting center
const MAX_TRAVEL = 7;

// ─── Iris / pupil sizes ───────────────────────────────────────────────────────
const IRIS_SIZE  = 20; // px diameter
const PUPIL_SIZE = 10; // px diameter

export default function EyeFollower({
  width  = 1200,
  height = 556,
  imageSrc = '/images/jingkai.png',
}: {
  width?:    number;
  height?:   number;
  imageSrc?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pupilRefs    = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      EYE_SOCKETS.forEach(({ id, cx, cy }) => {
        const el = pupilRefs.current[id];
        if (!el) return;

        // Vector from eye-center → cursor (in component-local space)
        const dx = e.clientX - (rect.left + cx);
        const dy = e.clientY - (rect.top  + cy);

        // Clamp travel to MAX_TRAVEL px
        const angle = Math.atan2(dy, dx);
        const dist  = Math.min(Math.hypot(dx, dy) * 0.08, MAX_TRAVEL);

        el.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`;
      });
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      style={{ width, height }}
    >
      {/* ── Layer 0 · Pupils (sit behind the character mask) ────────────── */}
      {EYE_SOCKETS.map(({ id, cx, cy }) => (
        <div
          key={id}
          ref={(el) => { pupilRefs.current[id] = el; }}
          className="absolute pointer-events-none"
          style={{
            left:        cx,
            top:         cy,
            transform:   'translate(-50%, -50%)',
            willChange:  'transform',
            zIndex:      0,
            width:       IRIS_SIZE,
            height:      IRIS_SIZE,
          }}
        >
          {/* Iris */}
          <div
            className="relative rounded-full flex items-center justify-center"
            style={{
              width:           IRIS_SIZE,
              height:          IRIS_SIZE,
              backgroundColor: '#3B2314',
            }}
          >
            {/* Pupil */}
            <div
              className="rounded-full bg-black"
              style={{ width: PUPIL_SIZE, height: PUPIL_SIZE }}
            />
            {/* Specular highlight */}
            <div
              className="absolute rounded-full bg-white/75"
              style={{ width: 5, height: 5, top: 3, right: 3 }}
            />
          </div>
        </div>
      ))}

      {/* ── Layer 1 · Character mask (PNG must have transparent eye sockets) ── */}
      <Image
        src={imageSrc}
        alt="Jing Kai"
        fill
        priority
        className="object-cover pointer-events-none"
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
