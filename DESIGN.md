# DESIGN.md — CYCLE deck design system

## Theme
Dark, always (color-scheme: only dark). Scene: a funder watches this deck full-screen
in a dim meeting room; the rainforest photography must glow, so the surface is a deep
forest green, never grey or black.

## Color
- Surface family: --deep #0B2015, scrims of rgba(7,24,15,…) over the panorama.
- Ink: --ink #F2FAF3, --ink-dim 84%, --ink-mut 66%.
- Accent (restrained, ≤10%): mint --accent #8FE3B4.
- The cycle infographic is the one full-palette moment: logo gold/red/blue/cyan
  (--c1..--c4) at full saturation. Nothing else borrows these except its labels.

## Typography
Two families, fixed roles:
- **Montserrat** (self-hosted variable 400–800): all UI text: headlines (800),
  titles/ribbons (700), body/labels (400–700).
- **EB Garamond** (self-hosted 400 + italic): editorial accents only: slide ledes and
  the "Together, we regenerate." sign-off. Never for UI controls.

Fluid tokens (vmin-keyed so both orientations behave); all sizes must come from these,
never ad-hoc px outside the short-viewport density overrides:
- --fs-h1 (slide 1 headline), --fs-h2 (other headlines), --fs-lede, --fs-body,
  --fs-small (tertiary: carousel bios, credits), --fs-stat, --fs-chip, --fs-eyebrow.
- EB Garamond has a small x-height: ledes are sized ~15% larger than the equivalent
  Montserrat role to read equal.
- Hierarchy ratio ≥1.25 between adjacent steps. Body line length ≤ 70ch.

## Elevation / texture
Dark neumorphism over photography: translucent panels --surf/--surf-2 with dual
shadows (--neu, --neu-sm, --neu-in) and blur. Blur is purposeful (panels floating
over the photo), not decorative glass.

## Motion
- Slide panning: 900ms cubic-bezier(.62,.02,.18,1); pan layer and slides only.
- Background Ken Burns: `.zoom` layer scales 1.16 → 1.0 over 36s, alternating
  (72s round trip, ~4 px/s drift, ~6 px/s at mid-sweep). Ambient, never attention-seeking; the scrim sits above it
  so text contrast never moves.
- Cycle infographic idles clockwise 42s/turn (WAAPI), glides ~9° to a stop on hover.
- transform/opacity only; everything honours prefers-reduced-motion.

## Components
- .btn-primary: mint pill on deep. Ribbons (.rib): logo-colour bars, white/deep text.
- .stat: inset-neumorphic tiles, tabular numerals.
- Team carousel: 3 rows visible, middle on a glass card, edges mask-faded.
- Nav: circular neu arrows fixed mid-viewport; labelled dots bottom-left.

## Hard rules
- No scrolling on any slide at any viewport (harness-verified).
- No cookies/trackers/third-party requests. Photo credit stays on-page.
- No em dashes in UI copy. No side-stripe borders, no gradient text.
