"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * One-shot confetti burst, fired on mount. Self-contained (no library).
 * Pieces are generated client-side to avoid hydration mismatch.
 */
const COLORS = ["#22c55e", "#16a34a", "#4ade80", "#bbf7d0", "#2FDF84", "#ffffff"];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  drift: number;
  color: string;
  w: number;
  h: number;
  fall: number;
}

function build(): Piece[] {
  return Array.from({ length: 44 }, (_, i) => ({
    left: 6 + Math.random() * 88,
    delay: Math.random() * 0.35,
    duration: 1.7 + Math.random() * 1.4,
    rotate: Math.random() * 720 - 360,
    drift: (Math.random() - 0.5) * 180,
    color: COLORS[i % COLORS.length],
    w: 6 + Math.random() * 6,
    h: 9 + Math.random() * 8,
    fall: 360 + Math.random() * 260,
  }));
}

export default function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    setPieces(build());
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0 rounded-[2px]"
          style={{ left: `${p.left}%`, width: p.w, height: p.h, backgroundColor: p.color }}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: p.fall, x: p.drift, opacity: [0, 1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
