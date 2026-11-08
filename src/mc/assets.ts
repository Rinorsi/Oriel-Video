import {staticFile} from 'remotion';

// All Minecraft files come from `npm run setup`, which extracts them from the local game.
// Paths mirror assets/minecraft/textures/ and assets/minecraft/sounds/ in the jar.

/** Any texture, e.g. tex('gui/container/crafting_table.png'). */
export const tex = (p: string) => staticFile(`mc/textures/${p}`);
/** Item sprite by id, e.g. item('diamond_sword'). */
export const item = (id: string) => tex(`item/${id}.png`);
/** Block texture by name, e.g. block('ancient_debris_side'). */
export const block = (id: string) => tex(`block/${id}.png`);
/** Sound by name without extension, e.g. sound('random/levelup'). Must be listed in scripts/setup.mjs. */
export const sound = (id: string) => staticFile(`mc/sounds/${id}.ogg`);
/** Background music copied by `npm run setup` (Mixkit free licence). */
export const bgm = (file: string) => staticFile(`audio/bgm/${file}`);
/** Sound effect copied into public/audio/sfx/ (not committed; see the clip that uses it for sources). */
export const sfx = (file: string) => staticFile(`audio/sfx/${file}`);
