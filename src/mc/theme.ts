import {Easing} from 'remotion';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Seconds to frames. Timelines are written in seconds and converted once. */
export const sec = (s: number) => Math.round(s * FPS);

/** Minecraft chat / rarity colours (the classic 16-colour text palette). */
export const MC = {
  white: '#FFFFFF',
  gray: '#AAAAAA',
  darkGray: '#555555',
  black: '#000000',
  yellow: '#FFFF55',
  gold: '#FFAA00',
  aqua: '#55FFFF',
  green: '#55FF55',
  red: '#FF5555',
  purple: '#FF55FF',
  blue: '#5555FF',
  // GUI panel colours
  gui: '#C6C6C6',
  guiShadow: '#555555',
  guiDark: '#373737',
  guiText: '#404040',
  slot: '#8B8B8B',
} as const;

/** Rarity -> name colour, as the game shows it in tooltips. */
export const RARITY = {
  common: MC.white,
  uncommon: MC.yellow,
  rare: MC.aqua,
  epic: MC.purple,
} as const;
export type Rarity = keyof typeof RARITY;

/** Minecraft draws a text shadow at 25% brightness of the text colour. */
export const textShadowColor = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) >> 2;
  const g = ((n >> 8) & 255) >> 2;
  const b = (n & 255) >> 2;
  return `rgb(${r},${g},${b})`;
};

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  /** Fast start with a small overshoot - for things that "slam" into place. */
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
};

/** Deterministic PRNG. Never use Math.random in a render. */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
