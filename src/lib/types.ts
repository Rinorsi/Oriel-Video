import type {FC} from 'react';

/**
 * The reusable layer of the video library (what a real video imports).
 * Everything here is driven by Remotion's `useCurrentFrame()`, so place it with <Sequence from=... durationInFrames=...>
 * and its local frame 0 is the effect's first frame. Nothing in `lib/` draws a preset background unless you ask (`bg`).
 */

export type Kind = 'transition' | 'overlay' | 'card' | 'title' | 'scene' | 'util';

export type PropDoc = {
  name: string;
  /** TypeScript type as written, e.g. 'string', "'cut' | 'slide'", 'number'. */
  type: string;
  /** Default value as written in code, e.g. "'下一章'". */
  default?: string;
  /** Chinese one-liner. */
  desc: string;
};

/** One row of the machine-readable catalog (`src/lib/catalog.json`, built by `npm run catalog`). */
export type CatalogEntry = {
  /** Same id as the gallery (`fx-<id>` composition). */
  id: string;
  name: string;
  kind: Kind;
  category: string;
  /** Export name from `src/lib/index.ts`, e.g. 'McdBlackCut' (component) or 'mcdBlackCut' (transition object). */
  export: string;
  /** Default duration in frames at 30 fps (transitions: the transition body only, without lead/tail). */
  frames: number;
  /** true if it renders on a transparent background by default (can be laid over real footage). */
  overlayReady: boolean;
  /** Chinese: what you see. */
  blurb: string;
  /** Chinese: when to use it in a video. */
  usage: string;
  props?: PropDoc[];
  /** Minimal copy-paste JSX that works inside a Remotion composition. */
  example: string;
  /** Source file, relative to the project root. */
  source: string;
};

// ---------------------------------------------------------------- transitions

export type Cue = {at: number; src: string; volume?: number; rate?: number};

/**
 * A transition between two shots. `Scene` draws the whole frame during the transition body:
 *   p = 0..1 progress, f = frames since the body started, A / B = the outgoing / incoming shot as components.
 * `Overlay` is the same effect on transparent (cut-type transitions only) for putting over footage in an editor.
 */
export type LibTransition = {
  id: string;
  name: string;
  /** Frames of the transition body. */
  frames: number;
  /**
   * Frame inside the body at which the incoming shot's local frame 0 happens.
   * 0 for dual-type transitions (both shots move during it); about `round(frames / 2) - 6` for cut-type (cover, then switch).
   * TransitionSeries uses it to start the next shot at the right time.
   */
  bStart: number;
  Scene: FC<{p: number; f: number; A: FC; B: FC}>;
  Overlay?: FC<{p: number; f: number}>;
  cues: Cue[];
};

export type SeriesShot = {
  /** Total frames this shot lives, INCLUDING the transition overlaps at its two ends. */
  dur: number;
  C: FC;
};
