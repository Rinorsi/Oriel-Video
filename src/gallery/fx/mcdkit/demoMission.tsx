// mcd-kit-mission-panel: mission select. Targets: mission-threat-panel.png (scene header, ADVENTURE tag, big title, locked/selected difficulty
// hexagons with green-orange track, power rows, GEAR DROPS slots, BELOW MINIMUM DIFFICULTY button), mission-difficulty-levels.png,
// mission-map-mainland.png / marker-mission.png (parchment world map with gold skull nodes), teleport-menu.png, hero-select.png.
import type {FC} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {block} from '../../../mc/assets';
import {EASE} from '../../../mc/theme';
import {Cap, Pop, Rise, win} from './common';
import {McdFloor} from './floor';
import {
  BevelSlot,
  CutPanel,
  DifficultyBar,
  ItemIcon3D,
  KeyCap,
  MCD,
  McdBackdrop,
  McdText,
  MainButton,
  PlayerBust,
  PlayerFigure,
  PowerBadge,
  PxArt,
  PxText,
  SKULL_ROWS,
  SkullBadge,
  WhiteFlash,
  itemTex,
} from './kit';

const ISLANDS: {x: number; y: number; rows: string[]}[] = [
  {x: 30, y: 60, rows: ['..ggggg.....', '.gggggggg...', 'gggggkkgggg.', 'ggggkkkggg..', '.gggkkgggg..', '..ggggggg...', '....ggg.....']},
  {x: 440, y: 40, rows: ['...sssss...', '..sssssss..', '.ssssggsss.', 'sssssggssss', '.sssssssss.', '..ssssss...']},
  {x: 250, y: 330, rows: ['.ggggg....', 'gggggggg..', 'ggggddggg.', '.gggddggg.', '..gggggg..', '...gggg...']},
  {x: 620, y: 320, rows: ['..kkkkk...', '.kkkkkkk..', 'kkkdkkkkk.', 'kkkkkkkk..', '.kkkkkk...']},
];
const TILE = 36;
const TEX: Record<string, string> = {g: 'grass_block_top', s: 'sand', k: 'stone', d: 'podzol_top'};

const NODES = [
  {x: 150, y: 150},
  {x: 330, y: 250},
  {x: 520, y: 150},
  {x: 690, y: 270},
  {x: 790, y: 420},
  {x: 420, y: 430},
];

const WorldMap: FC<{f: number; sel: number}> = ({f, sel}) => (
  <div style={{position: 'relative', width: 880, height: 600, background: MCD.parchment, boxShadow: `inset 0 0 0 6px ${MCD.parchmentShade}, inset 0 0 0 10px #F4E8D4`, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(190,170,140,0.35) 1px, transparent 1px)', backgroundSize: '12px 12px'}} />
    {ISLANDS.map((isl, k) => {
      const t = EASE.out(win(f, 6 + k * 6, 14));
      return (
        <div key={k} style={{position: 'absolute', left: isl.x, top: isl.y + (1 - t) * 40, opacity: t}}>
          {/* soft offset shadow */}
          <div style={{position: 'absolute', left: 18, top: 34}}>
            {isl.rows.map((r, y) => (
              <div key={y} style={{display: 'flex'}}>
                {[...r].map((c, x) => (
                  <div key={x} style={{width: TILE, height: TILE, background: c === '.' ? 'transparent' : 'rgba(110,90,60,0.28)'}} />
                ))}
              </div>
            ))}
          </div>
          <div style={{position: 'relative'}}>
            {isl.rows.map((r, y) => (
              <div key={y} style={{display: 'flex'}}>
                {[...r].map((c, x) => {
                  const below = isl.rows[y + 1]?.[x];
                  const edge = c !== '.' && (!below || below === '.');
                  return (
                    <div key={x} style={{width: TILE, height: TILE, flex: 'none', position: 'relative', boxShadow: edge ? `0 12px 0 #6B4A2A` : undefined}}>
                      {c !== '.' && <Img src={block(TEX[c])} style={{width: TILE, height: TILE, imageRendering: 'pixelated', filter: c === 'g' || c === 'd' ? 'saturate(0.9) brightness(1.05)' : undefined}} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    })}
    {/* path */}
    {NODES.slice(0, -1).map((n, i) => {
      const m = NODES[i + 1];
      const steps = 12;
      const t = win(f, 30 + i * 6, 10);
      return Array.from({length: steps}, (_, s) => {
        if (s / steps > t) return null;
        const u = s / steps;
        return <div key={`${i}-${s}`} style={{position: 'absolute', left: Math.round((n.x + (m.x - n.x) * u) / 6) * 6, top: Math.round((n.y + (m.y - n.y) * u) / 6) * 6 + 30, width: 8, height: 8, background: '#7A6446', opacity: s % 2 ? 0 : 1}} />;
      });
    })}
    {NODES.map((n, i) => {
      const on = i === sel;
      const t = win(f, 34 + i * 6, 10);
      return (
        <div key={i} style={{position: 'absolute', left: n.x - (on ? 50 : 36), top: n.y - (on ? 56 : 42), transform: `scale(${EASE.back(t)})`, transformOrigin: '50% 100%', opacity: t > 0 ? 1 : 0}}>
          {on ? <SkullBadge size={100} selected numeral={['I', 'II', 'III', 'IV', 'V', 'VI'][i]} /> : <SkullBadge size={72} />}
        </div>
      );
    })}
    <div style={{position: 'absolute', left: 0, right: 0, top: 508, display: 'flex', justifyContent: 'center'}}>
      <Rise at={52} dur={8} dy={10} style={{background: 'rgba(30,20,12,0.82)', padding: '14px 32px 18px', boxShadow: 'inset 0 0 0 3px #5A4630'}}>
        <PxText text={['CREEPER WOODS', 'SOGGY SWAMP', 'DESERT TEMPLE', 'OBSIDIAN PINNACLE', 'FIERY FORGE', 'CAMP'][sel]} px={4} color="#FCD448" shadowColor="#5A3A10" />
      </Rise>
    </div>
  </div>
);

export const MissionPanelDemo: FC = () => {
  const f = useCurrentFrame();
  const level = f < 76 ? 4 : f < 92 ? 5 : f < 108 ? 6 : 7;
  const unlocked = f >= 108;
  const sel = f < 60 ? 0 : f < 96 ? 3 : 4;
  return (
    <McdBackdrop kind="inventory" drift={f * 0.5} cell={44}>
      {/* details panel */}
      <div style={{position: 'absolute', left: 80, top: 50}}>
        <Pop at={0} origin="50% 0%">
          <CutPanel w={800} h={980} cuts={[0, 0, 0, 0]} fill="#16161A" edge="#2A2A30" glow="rgba(140,40,30,0.45)">
            <div style={{position: 'absolute', left: 0, top: 0, width: 800, height: 250, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: -500, top: -300, width: 1920, height: 1080}}>
                <McdFloor tint="crypt" path="polished_deepslate" base="deepslate_tiles" shift={f * 0.3} />
              </div>
              {[
                ['zuri', 120, 78, 6],
                ['kai', 250, 96, 7],
                ['efe', 420, 70, 6],
                ['makena', 560, 90, 7],
              ].map(([s, x, y, sc]) => (
                <div key={s as string} style={{position: 'absolute', left: x as number, top: y as number, filter: 'drop-shadow(3px 0 0 #D8302C) drop-shadow(-3px 0 0 #D8302C) drop-shadow(0 3px 0 #D8302C) drop-shadow(0 -3px 0 #D8302C)'}}>
                  <PlayerFigure skin={s as string} scale={sc as number} />
                </div>
              ))}
              <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, #16161A 100%)'}} />
              <div style={{position: 'absolute', left: 24, top: 20, display: 'flex', alignItems: 'center', gap: 14, background: '#2A2A2E', padding: '10px 18px 10px 14px', boxShadow: 'inset 0 0 0 3px #3A3A40'}}>
                <PxArt rows={SKULL_ROWS} pal={{k: '#fff'}} px={3} />
                <PxText text="ADVENTURE" px={2} />
              </div>
              <div style={{position: 'absolute', right: 24, top: 20}}>
                <MainButton label="STORY" tone="ghost" w={120} h={52} textPx={2} />
              </div>
            </div>
            <div style={{position: 'absolute', left: 48, top: 286}}>
              <Rise at={10}>
                <PxText text="OBSIDIAN PINNACLE" px={5} />
              </Rise>
            </div>
            <div style={{position: 'absolute', left: 130, top: 356}}>
              <Rise at={14}>
                <PxText text={`ADVENTURE ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][level - 1]}`} px={2} />
              </Rise>
            </div>
            <div style={{position: 'absolute', left: 0, top: 380}}>
              <DifficultyBar level={level} locked={f < 76 ? 3 : 0} w={800} nodeW={50} reveal={win(f, 18, 30)} />
            </div>
            <div style={{position: 'absolute', left: 48, top: 590}}>
              <Rise at={50} dur={8}>
                <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                  <svg width={34} height={34} viewBox="0 0 10 10"><polygon points="5,0 10,5 5,10 0,5" fill="#8A8A92" /><polygon points="5,2.6 7.4,5 5,7.4 2.6,5" fill="#16161A" /></svg>
                  <McdText size={30} weight={700}>Recommended power:  {33 + (level - 4) * 24}</McdText>
                </div>
              </Rise>
              <Rise at={56} dur={8}>
                <McdText size={26} color="#D8D8DC" style={{display: 'block', marginTop: 12, marginLeft: 50}}>{`${((level - 4) * 0.3).toFixed(1)}x difficulty`}</McdText>
              </Rise>
              <Rise at={60} dur={8}>
                <McdText size={26} color="#D8D8DC" style={{display: 'block', marginTop: 8, marginLeft: 50}}>Gear and artifact power: 35-95</McdText>
              </Rise>
            </div>
            <div style={{position: 'absolute', right: 48, top: 590, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10}}>
              <Rise at={54} dur={8}>
                <McdText size={26} weight={700}>YOUR POWER</McdText>
              </Rise>
              <Rise at={58} dur={8}>
                <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                  <PowerBadge power={143} w={58} label={false} />
                  <PxText text="143" px={5} />
                  <svg width={22} height={20} viewBox="0 0 11 10" shapeRendering="crispEdges"><polygon points="5.5,0 11,10 0,10" fill="#58D038" /></svg>
                </div>
              </Rise>
            </div>
            <div style={{position: 'absolute', left: 48, top: 746}}>
              <Rise at={66} dur={8}>
                <McdText size={24} weight={700} style={{letterSpacing: 1}}>GEAR DROPS</McdText>
              </Rise>
              <div style={{display: 'flex', gap: 8, marginTop: 12}}>
                {['iron_sword', 'iron_axe', 'bow', 'crossbow_standby', 'trident', 'iron_helmet', 'bone'].map((s, i) => (
                  <Pop key={s} at={70 + i * 3}>
                    <BevelSlot size={74} rarity="common">
                      <ItemIcon3D src={itemTex(s)} size={48} depth={3} />
                    </BevelSlot>
                  </Pop>
                ))}
              </div>
            </div>
            <div style={{position: 'absolute', left: 48, top: 880, width: 704}}>
              {unlocked ? <MainButton label="START MISSION" w={704} h={76} /> : <MainButton label="BELOW MINIMUM DIFFICULTY" tone="disabled" w={704} h={76} textPx={3} />}
            </div>
          </CutPanel>
        </Pop>
      </div>

      {/* world map */}
      <div style={{position: 'absolute', left: 940, top: 50}}>
        <Pop at={4} origin="50% 0%">
          <WorldMap f={f} sel={sel} />
        </Pop>
      </div>

      {/* teleport menu */}
      <div style={{position: 'absolute', left: 940, top: 680}}>
        <Pop at={30} origin="0% 0%">
          <CutPanel w={460} h={350} cuts={[0, 0, 0, 0]} fill={MCD.teleport} edge="#3A3F4A" corners>
            <div style={{position: 'absolute', left: 36, top: 28}}>
              <Cap size={22}>Teleport</Cap>
            </div>
            {[
              ['deanomatic98', 'Y', 'steve', '#E058B8'],
              ['vrvylive', 'X', 'efe', '#D8A038'],
              ['albertplays04', 'A', 'alex', '#48D8A8'],
            ].map(([n, k, sk, c], i) => (
              <Rise key={n} at={40 + i * 5} dur={8} dy={10}>
                <div style={{position: 'absolute', left: 36, top: 70 + i * 80, width: 388, height: 68, background: '#10141A', boxShadow: 'inset 0 0 0 3px #2A2E36', display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 12}}>
                  <div style={{width: 48, height: 48, boxShadow: `0 0 0 4px ${c}`, overflow: 'hidden', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'flex-end'}}>
                    <PlayerBust skin={sk} scale={3} />
                  </div>
                  <McdText size={24}>{n}</McdText>
                  <div style={{marginLeft: 'auto', marginRight: 12}}>
                    <KeyCap label={k} size={40} color={k === 'Y' ? MCD.keyY : k === 'X' ? MCD.keyX : MCD.keyA} />
                  </div>
                </div>
              </Rise>
            ))}
            <div style={{position: 'absolute', right: 36, bottom: 22, display: 'flex', alignItems: 'center', gap: 12}}>
              <McdText size={20} color="#9AA3AE">CLOSE</McdText>
              <KeyCap label="B" size={36} color={MCD.keyB} />
            </div>
          </CutPanel>
        </Pop>
      </div>

      {/* hero select cards */}
      <div style={{position: 'absolute', left: 1440, top: 680, display: 'grid', gridTemplateColumns: 'repeat(2, 190px)', gap: 20}}>
        {['steve', 'alex', 'zuri', 'noor'].map((s, i) => (
          <Pop key={s} at={44 + i * 5}>
            <div style={{position: 'relative', width: 190, height: 160, background: '#0B0C10', boxShadow: i === 1 ? `inset 0 0 0 5px ${MCD.goldSel}` : 'inset 0 0 0 3px #3A3A40', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', overflow: 'hidden'}}>
              <PlayerBust skin={s} scale={9} style={{transform: 'translateY(18px)'}} />
              {i === 1 && (
                <div style={{position: 'absolute', right: 6, top: -2, background: MCD.goldSel, padding: '2px 8px'}}>
                  <PxText text="SELECTED" px={1} color="#2A1600" shadow={0} bold={1} />
                </div>
              )}
              {i !== 1 && <div style={{position: 'absolute', right: 6, top: 6, width: 22, height: 22, clipPath: 'polygon(0 0,100% 0,100% 100%)', background: '#FFE000'}} />}
            </div>
          </Pop>
        ))}
      </div>
      <WhiteFlash at={108} dur={5} peak={0.2} steps={2} />
    </McdBackdrop>
  );
};
