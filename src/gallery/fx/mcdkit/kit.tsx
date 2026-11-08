/**
 * MCD UI KIT - Minecraft Dungeons style interface pieces for Remotion (1920x1080, 30 fps).
 * Everything is aligned to the real screenshots in refs-mcd/ui (see STYLE-UI.md). Import from this file only:
 *
 *   import {MCD, PxText, BevelSlot, HexBadge, DiamondFrame, MainButton, StatCard, CutPanel, HudBase} from '../mcdkit/kit';
 *
 * All sizes are screen pixels at 1920x1080. Anything built from art pixels takes `px` (screen px per art pixel, use whole numbers).
 * Rules baked in: no rounded corners, no expanding rings, shadows are hard offsets, text sits on an integer pixel grid,
 * Minecraft items / mobs / chests / skins come from the real textures (ItemIcon3D, PlayerFigure, CreeperFigure, ChestIcon ...).
 *
 * PALETTE
 *   MCD.*                       hex constants: void/panel/slot/bevel, invBg (red-brown), resultsBg, statCard, parchment,
 *                               gold/title/victory, red, purple, soul, emerald, btn/btnHi/btnLo, danger, rarity (common/rare/unique/gilded), keyA/B/X/Y
 *   BODY_FONT                   Noto Sans stack for body copy
 * TEXT  (art-pixel display text, hard bottom-right shadow; the wrapper is the tight INK box, so flex-centring is exact)
 *   <PxText text px color hi bands shadow shadowColor outline bold gap cjkRows caps rowShift />
 *   <McdTitle ... />            PxText with the Dungeons defaults; presets TITLE_WHITE / TITLE_GOLD / TITLE_VICTORY / TITLE_SMALL_GOLD
 *   <PxChars text glyph=(i,n)=>CSS />    one canvas per letter: stagger, drop, jitter
 *   <GlitchTitle text at glitch amp />   rows jump by whole pixels for a few frames, then snap (trailer title card)
 *   <McdText size weight color>          Noto Sans body copy with a 1px hard shadow;   useTextSize(text, opts) -> {w,h}
 * FRAMES / SHAPES
 *   <BevelSlot size rarity selected isNew empty plus keycap count drop>   3-layer hard-bevel item slot (plain/common/rare/unique/gilded)
 *   <KeyCap label size color wide>                                       controller / keyboard cap (auto-widens for ENT, BSP ...)
 *   <HexBadge w ring ringHi fill ...>   <LevelBadge level accent>   <PowerBadge power>   <SkullBadge size selected numeral locked empty>
 *   <DifficultyBar level locked w reveal>                                I-VII hexagon ladder, green-to-orange track
 *   <DiamondFrame size tier glow badge clip rotateContent>               gilded | unique | rare | common | enchant | empty
 *   <EnchantSlot lit icon tier>   <DiamondTag text>   <Runes />
 *   <MainButton label tone press hold hover keycap>                      green | red | gold | ghost | disabled, three-band bevel
 *   <StatCard label value reveal>   <CutPanel w h cuts glow corners>   <ParchmentScroll reveal>   <RarityTag rarity>
 *   <Laurel tone w grow>                                                 silver | gold | orange | green wreath
 * ITEMS / CHARACTERS
 *   <ItemIcon3D src size depth rot glow>      voxel-extruded render of a real item texture   (src: itemTex('bow'))
 *   <PotionIcon color>   <ChestIcon variant scale open>   <PlayerFigure skin|texture scale>   <PlayerBust skin scale>
 *   <CreeperFigure scale>   <SkeletonFigure scale>
 * COUNTERS / HUD
 *   <EmeraldCounter value bump>   <SoulCounter value bump tone>   <XpBar value>
 *   <HudBase hp hurt level xp arrows emeralds souls cd press appear scale ...>   bottom-centre HUD plate (hud.tsx)
 * BACKDROP + ANIMATION HELPERS
 *   <McdBackdrop kind="inventory|void|results|defeat|trailer" drift>     mosaic-noise dark backdrop with the red-brown glow
 *   <Embers count color area>     gold sparks drifting up        <WhiteFlash at dur peak steps />    stepped white flash
 *   <BlackCut at fade hold reveal />   darken, hold, hard cut / fade in      stepFade(frame, from, to, steps)
 *   Pop / Rise / win(frame, at, dur) / countUp(frame, at, dur, to, steps) / Cap   small timeline helpers used by every demo
 * Pixel art: <PxArt rows pal px /> draws string grids; EMERALD_*, SOUL_ROWS, SKULL_ROWS, LOCK_ROWS, HEART_*, CHEVRON_*, ENCH_* are ready-made.
 */

export * from './parts';
export * from './hud';
export * from './common';
