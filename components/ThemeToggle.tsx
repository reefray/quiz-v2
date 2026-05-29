"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Zap } from "lucide-react";

type Theme = "light" | "dark" | "neon";
const ORDER: Theme[] = ["light", "dark", "neon"];

function current(): Theme {
  const c = document.documentElement.classList;
  if (c.contains("neon")) return "neon";
  if (c.contains("dark")) return "dark";
  return "light";
}

function apply(theme: Theme) {
  const c = document.documentElement.classList;
  c.toggle("dark", theme === "dark" || theme === "neon");
  c.toggle("neon", theme === "neon");
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* ignore */
  }
}

/**
 * Top-right theme cycler: light → dark → neon (landing-page style) → light.
 * Three-way experiment toggle. Persists choice to localStorage.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(current());
  }, []);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    apply(next);
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Zap;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${theme}. Tap to switch.`}
      className="grid h-10 w-10 place-items-center rounded-back border border-[color:var(--glass-border)] bg-[var(--glass-bg)] text-ink shadow-glass backdrop-blur-sm transition active:scale-95"
    >
      {mounted && <Icon size={18} strokeWidth={2.25} />}
    </button>
  );
}
