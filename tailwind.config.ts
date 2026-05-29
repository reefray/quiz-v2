import type { Config } from "tailwindcss";

/**
 * Brand tokens. Fixed brand greens are literal; mode-dependent surfaces/text
 * read CSS variables (see app/globals.css) so the dark/light toggle only flips
 * those. Type scale + weights tuned to match the prototype's proportions
 * (reference/BarbrWebOnboardingV2.jsx), rendered in the RN brand font Montserrat.
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Brand greens — themeable via RGB-channel CSS vars (so dark/neon
        //    variants can shift the accent while opacity modifiers still work) ──
        brand: {
          green: "rgb(var(--brand-green) / <alpha-value>)",
          greenDark: "rgb(var(--brand-green-dark) / <alpha-value>)",
          mint: "#2FDF84",
          deep: "#00B871",
        },
        bad: "#EB5757",
        // ── Mode-dependent (CSS vars) ──
        ink: "var(--c-ink)",
        muted: "var(--c-muted)",
        faint: "var(--c-faint)",
        line: "var(--c-line)",
        card: "var(--c-card)",
        surface: "var(--c-surface)",
        cta: { disabled: "#9ca3af" },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Prototype type scale (px → rem), Montserrat
        eyebrow: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.2em" }], // 11px .eyebrow
        heading: ["1.5rem", { lineHeight: "1.1", letterSpacing: "-0.4px" }], // 24px (compact)
        subtitle: ["0.875rem", { lineHeight: "1.5" }], // 14px .sub
        cta: ["1rem", { lineHeight: "1.25rem", letterSpacing: "0.2px" }], // 16px .btn
      },
      borderRadius: {
        chip: "11px", // RN/prototype icon chip (.opticon)
        input: "15px", // prototype handle/field box
        card: "16px", // prototype .opt
        back: "20px",
        sheet: "40px",
      },
      boxShadow: {
        cta: "var(--cta-shadow)",
        glass: "0 2px 8px rgba(0,0,0,0.06)",
        sheet: "0 -4px 20px rgba(0,0,0,0.1)",
        card: "0 4px 12px rgba(0,0,0,0.1)",
      },
      backgroundImage: {
        "brand-surface": "var(--bg-surface)",
        "progress-fill": "var(--progress-fill)",
        "green-gradient": "var(--progress-fill)", // brand green gradient (themeable) for text/accents
        "cta-fill": "var(--cta-fill)",
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
