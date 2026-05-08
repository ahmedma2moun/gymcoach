// Gym Coach — design tokens

export const colors = {
  // ── Surfaces ────────────────────────────────────────────────────────────────
  background: '#0a0a12',     // deep neutral, slight cool undertone
  surface: '#14141f',        // primary card surface
  surface2: '#1c1c2b',       // raised / nested surface
  surfaceHover: '#262638',   // pressed / hover state

  // ── Brand ───────────────────────────────────────────────────────────────────
  primary: '#ff7849',        // refined athletic coral
  primaryDark: '#e85a2a',
  primaryLight: '#ffa07a',
  secondary: '#a78bfa',      // soft violet
  secondaryDark: '#8b5cf6',

  // ── Status ──────────────────────────────────────────────────────────────────
  success: '#10d4a8',        // vibrant teal-emerald
  successDark: '#0eaa86',
  accent: '#fb6da3',         // soft fuchsia accent
  info: '#5ec5f0',           // calm cyan
  danger: '#f87171',
  dangerDark: '#dc2626',
  warning: '#fbbf24',

  // ── Text ────────────────────────────────────────────────────────────────────
  text: '#fafafe',           // near-white
  textSub: '#d0d0e2',        // primary subtext
  textMuted: '#7d7d9a',      // muted helper text
  textDim: '#4d4d68',        // disabled / placeholder

  // ── Lines ───────────────────────────────────────────────────────────────────
  border: '#2e2e42',         // standard border
  borderSubtle: '#1f1f30',   // hairline border on cards
} as const;
