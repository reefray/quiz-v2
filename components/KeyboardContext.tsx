"use client";

import { createContext } from "react";

/**
 * Keyboard inset (px the on-screen keyboard covers at the viewport bottom), 0
 * when no keyboard. Provided by QuizShell, consumed by CtaButton so the CTA can
 * pin just above the keyboard. Lives in its own module to avoid a QuizShell ↔
 * CtaButton import cycle.
 */
export const KeyboardInsetContext = createContext(0);
