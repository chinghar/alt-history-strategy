# The World of 1836

An alternate-history grand strategy simulator. Every country is run by a
rule-based AI unless you take it over; every decision compounds into a new,
divergent timeline. This is the first vertical slice: a deterministic
simulation core (economy, diplomacy, politics, military, AI, events,
timeline) plus a **Historical Probability Engine** that continuously
estimates how likely real historical outcomes — German unification, the
American Civil War, the decline of the Ottoman Empire — remain given the
current state of the simulated world.

See `.claude/plans` (or ask Claude) for the full architecture writeup; the
short version:

- `src/engine/` — the pure, deterministic simulation. No React, no
  `Math.random()`. Same seed + same turns in always produces the same
  `WorldState` out (see `tests/engine/determinism.test.ts`).
- `src/data/scenarios/1836.ts` — the one playable scenario for this slice:
  16 hand-authored 1836 powers.
- `src/state/gameStore.ts` — the only bridge between the engine and React.
- `src/render/` + `src/ui/` — the map and dashboard/timeline/news/probability
  panels.

## Running it

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — dev server
- `npm run build` — typecheck + production build
- `npm run typecheck` — TypeScript only
- `npm run test` — Vitest (engine unit tests + determinism check)
- `npm run lint` — oxlint
- `npm run format` — prettier --write

## Status

Vertical slice, not the full game. Real-world country borders (via
`world-atlas`), one scenario (1836), one time scale (yearly turns), minimal
military (no combat resolution yet), template-based news text. See the
project plan for what's deliberately deferred and why.
