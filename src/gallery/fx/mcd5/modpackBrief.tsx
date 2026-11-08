// mcd-v-modpack-brief: mission-briefing card for a modpack (mission-threat-panel.png / mission-difficulty-levels.png).
// Chamfered dark panel on the red-brown inventory glow: scene header with tag chips, hard-shadow pack name, spec rows,
// I-VII hexagon difficulty ladder (selected node hops up and gets the bookmark tail), reward slots, and a START button that lights last.
// Props: name, tagline, version, mods, spec, gameVer, difficulty (1..7), rewards (item ids), tag, button, biome, bg (draw the backdrop).
import type {FC} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Audio} from 'remotion';
import {EASE} from '../../../mc/theme';
import {mcSound} from '../../../reel/kit';
import {BevelSlot, CutPanel, DifficultyBar, Embers, ItemIcon3D, KeyCap, MCD, McdBackdrop, McdText, MainButton, PxArt, PxChars, PxText, SKULL_ROWS, WhiteFlash, itemTex} from '../mcdkit/kit';
import {ScenePlate, type BiomeId} from '../mcdscene';
import {MobFigure, type MobId} from './mobCard';
import {BulletDiamond, CrossFlash, Label, Pop, Rise, Shine, countUp, stepQ, win} from './common';

export type ModpackBriefProps = {
  bg?: boolean;
  name?: string;
  tagline?: string;
  version?: string;
  mods?: number;
  spec?: string;
  gameVer?: string;
  difficulty?: number;
  rewards?: string[];
  tag?: string;
  button?: string;
  biome?: BiomeId;
  /** 小标题「MODS 模组数量」 */
  modsLabel?: string;
  /** 小标题「RECOMMENDED 推荐配置」 */
  specLabel?: string;
  /** 小标题「VERSION 游戏版本」 */
  versionLabel?: string;
  /** 难度条上方小标题 */
  difficultyLabel?: string;
  /** 难度名称前缀，后面接罗马数字，默认「冒险」 */
  levelPrefix?: string;
  /** 难度条下方三行说明（第一行大字）；不传则按 difficulty 自动算出「推荐战力 / 难度倍率 / 预计时长」 */
  facts?: string[];
  /** 奖励栏小标题 */
  rewardsLabel?: string;
  /** 头图里红描边的三个怪物 */
  threatMobs?: MobId[];
  /** 是否带上音效，默认 true */
  audio?: boolean;
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export const ModpackBrief: FC<ModpackBriefProps> = ({
  bg,
  name = '深渊远征',
  tagline = '从主世界到末地的硬核冒险，247 个模组，一个存档。',
  version = 'v2.4.1',
  mods = 247,
  spec = '16 GB 内存 · 4 核心',
  gameVer = '1.21.1 NeoForge',
  difficulty = 4,
  rewards = ['netherite_ingot', 'totem_of_undying', 'enchanted_book', 'diamond_sword', 'golden_apple'],
  tag = '整合包简报',
  button = '出发',
  biome = 'nether',
  modsLabel = 'MODS 模组数量',
  specLabel = 'RECOMMENDED 推荐配置',
  versionLabel = 'VERSION 游戏版本',
  difficultyLabel = '难度 DIFFICULTY',
  levelPrefix = '冒险',
  facts,
  rewardsLabel = '奖励 REWARDS',
  threatMobs = ['creeper', 'zombie', 'skeleton'],
  audio = true,
}) => {
  const f = useCurrentFrame();
  const PX = 180;
  const PY = 56;
  const PW = 1560;
  const PH = 968;
  // selected node hops up the ladder, then settles
  const hopStart = 66;
  const hopLevel = Math.min(difficulty, 1 + Math.floor(Math.max(0, f - hopStart) / 3));
  const level = f < hopStart ? 1 : hopLevel;
  const settled = f >= hopStart + (difficulty - 1) * 3;
  const barW = 740;
  const nodeX = PX + 740 + 150 + ((barW - 300) / 6) * (level - 1);
  const lit = f >= 122;
  const pulse = lit ? 0.5 + 0.5 * Math.sin((f - 122) * 0.3) : 0;
  const nameFont = 7;
  return (
    <AbsoluteFill>
      {bg && <McdBackdrop kind="inventory" drift={f * 0.5} cell={44} />}
      {bg && <Embers count={26} size={8} seed={5} speed={0.7} style={{opacity: 0.8}} />}
      <div style={{position: 'absolute', left: PX, top: PY}}>
        <Pop at={0} dur={8} from={0.94} origin="50% 0%">
          <CutPanel w={PW} h={PH} cuts={[44, 44, 44, 44]} fill="#16161A" edge="#34343A" glow="rgba(150,44,30,0.5)" corners>
            {/* scene header */}
            <div style={{position: 'absolute', left: 3, top: 3, width: PW - 6, height: 232, overflow: 'hidden', clipPath: 'polygon(42px 0,calc(100% - 42px) 0,100% 42px,100% 100%,0 100%,0 42px)', background: '#0A0608'}}>
              <div style={{position: 'absolute', left: 0, top: -250, width: PW - 6, height: ((PW - 6) * 9) / 16, opacity: win(f, 2, 10)}}>
                <ScenePlate biome={biome} camera="push" />
              </div>
              {/* red-outlined enemies, like the threat panel header */}
              <div style={{position: 'absolute', right: 200, bottom: 2, display: 'flex', alignItems: 'flex-end', gap: 40}}>
                {threatMobs.map((mob, i) => (
                  <Pop key={mob} at={8 + i * 4} dur={8} origin="50% 100%">
                    <div style={{filter: 'drop-shadow(3px 0 0 #E02A3A) drop-shadow(-3px 0 0 #E02A3A) drop-shadow(0 3px 0 #E02A3A) drop-shadow(0 -3px 0 #E02A3A) brightness(0.8)'}}>
                      <MobFigure mob={mob} scale={6} />
                    </div>
                  </Pop>
                ))}
              </div>
              <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,6,8,0.25) 0%, rgba(0,0,0,0) 40%, rgba(22,22,26,0.9) 100%)'}} />
              <div style={{position: 'absolute', left: 52, top: 40}}>
                <Pop at={6} dur={7} origin="0% 50%">
                  <div style={{display: 'flex', alignItems: 'center', gap: 16, background: '#2A2A2E', padding: '12px 22px 12px 18px', boxShadow: 'inset 0 0 0 3px #3E3E44'}}>
                    <PxArt rows={SKULL_ROWS} pal={{k: '#fff'}} px={4} />
                    <PxText text={tag} px={3} />
                  </div>
                </Pop>
              </div>
              <div style={{position: 'absolute', right: 52, top: 40}}>
                <Pop at={10} dur={7} origin="100% 50%">
                  <div style={{background: '#08080A', boxShadow: 'inset 0 0 0 4px #D8D8DC', padding: '12px 26px'}}>
                    <PxText text={version} px={3} />
                  </div>
                </Pop>
              </div>
            </div>

            {/* pack name */}
            <div style={{position: 'absolute', left: 64, top: 268, height: 16 * nameFont}}>
              <PxChars
                text={name}
                px={nameFont}
                gap={2}
                hi="#FFFFFF"
                glyph={(i) => {
                  const t = win(f, 14 + i * 3, 6);
                  return {opacity: t > 0 ? 1 : 0, transform: `translateY(${Math.round((1 - EASE.out(t)) * -60 / 4) * 4}px)`};
                }}
              />
            </div>
            <div style={{position: 'absolute', left: 68, top: 398}}>
              <Rise at={30} dur={8} dy={10}>
                <McdText size={30} color="#B4B8C0">{tagline}</McdText>
              </Rise>
            </div>
            <div style={{position: 'absolute', left: 64, top: 452, width: PW - 128, height: 3, background: 'rgba(255,255,255,0.08)', transformOrigin: '0 0', transform: `scaleX(${win(f, 30, 16)})`}} />

            {/* spec rows (left column) */}
            <div style={{position: 'absolute', left: 64, top: 480, width: 620}}>
              {[
                [modsLabel, <PxText key="v" text={countUp(f, 36, 28, mods, 14)} px={5} color={MCD.goldBright} shadowColor="#2A1600" />],
                [specLabel, <PxText key="v" text={spec} px={3} />],
                [versionLabel, <PxText key="v" text={gameVer} px={3} />],
              ].map(([label, val], i) => (
                <Rise key={i} at={36 + i * 8} dur={8} dy={14} style={{marginBottom: 14}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6}}>
                    <BulletDiamond size={24} />
                    <McdText size={24} weight={700} color="#9AA0AA" style={{letterSpacing: 2}}>{label as string}</McdText>
                  </div>
                  <div style={{marginLeft: 38, height: 56, display: 'flex', alignItems: 'center'}}>{val}</div>
                </Rise>
              ))}
            </div>

            {/* difficulty (right column) */}
            <div style={{position: 'absolute', left: 740, top: 474}}>
              <Rise at={54} dur={8} dy={10}>
                <div style={{display: 'flex', alignItems: 'center', gap: 20, marginLeft: 20}}>
                  <Label color="#9AA0AA">{difficultyLabel}</Label>
                  <PxText text={`${levelPrefix} ${ROMAN[level - 1]}`} px={3} color={settled ? MCD.goldBright : '#fff'} shadowColor={settled ? '#2A1600' : undefined} />
                </div>
              </Rise>
              <DifficultyBar level={level} w={barW} nodeW={46} reveal={win(f, 58, 24)} style={{marginTop: 8}} />
            </div>
            <div style={{position: 'absolute', left: 780, top: 676}}>
              {(facts ?? [`推荐战力  ${28 + difficulty * 18}`, `难度倍率  ${(difficulty * 0.3 - 0.3).toFixed(1)}x`, `预计时长  ${20 + difficulty * 6} 小时`])
                .map((t, i) => [t, i === 0 ? 34 : 28, i === 0] as const)
                .map(([t, sz, big], i) => (
                <Rise key={i} at={78 + i * 6} dur={8} dy={10} style={{marginBottom: 8}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                    <BulletDiamond size={big ? 34 : 22} color={big ? '#B9B6B1' : '#8A8A92'} />
                    <McdText size={sz as number} weight={big ? 700 : 400} color={big ? '#fff' : '#D8D8DC'}>{t as string}</McdText>
                  </div>
                </Rise>
              ))}
            </div>

            {/* rewards + start */}
            <div style={{position: 'absolute', left: 64, top: 800}}>
              <Rise at={92} dur={8} dy={10}>
                <Label color="#9AA0AA" size={22}>{rewardsLabel}</Label>
              </Rise>
              <div style={{display: 'flex', gap: 14, marginTop: 14}}>
                {rewards.map((r, i) => (
                  <Pop key={r} at={96 + i * 4} dur={8}>
                    <BevelSlot size={92} rarity={i === 0 ? 'gilded' : i < 3 ? 'unique' : 'common'} isNew={i < 2}>
                      <ItemIcon3D src={itemTex(r)} size={56} depth={4} />
                    </BevelSlot>
                  </Pop>
                ))}
              </div>
            </div>
            <div style={{position: 'absolute', right: 64, top: 836, width: 560, height: 100}}>
              {lit && <div style={{position: 'absolute', inset: -12, background: `rgba(96,207,115,${0.1 + pulse * 0.14})`}} />}
              <div style={{position: 'relative', overflow: 'hidden', opacity: win(f, 108, 6) > 0 ? 1 : 0}}>
                <MainButton label={button} w={560} h={100} tone={lit ? 'green' : 'disabled'} hover={lit ? pulse : 0} keycap={lit ? 'A' : undefined} textPx={5} />
                {lit && <Shine at={124} dur={14} w={80} opacity={0.4} />}
              </div>
            </div>
          </CutPanel>
        </Pop>
      </div>
      {/* hop landing flash */}
      <CrossFlash x={nodeX} y={PY + 570} at={hopStart + (difficulty - 1) * 3 + 1} arm={90} thick={10} color="#FFE680" />
      <WhiteFlash at={122} dur={6} peak={0.14} steps={3} />
      {audio && (
        <>
          <Sequence from={4}>
            <Audio src={mcSound('ui/toast/in')} volume={0.35} />
          </Sequence>
          {Array.from({length: difficulty - 1}, (_, i) => (
            <Sequence key={i} from={hopStart + 3 + i * 3}>
              <Audio src={mcSound('random/click')} volume={0.2} playbackRate={0.9 + i * 0.07} />
            </Sequence>
          ))}
          <Sequence from={122}>
            <Audio src={mcSound('random/levelup')} volume={0.3} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
void KeyCap;
void stepQ;
