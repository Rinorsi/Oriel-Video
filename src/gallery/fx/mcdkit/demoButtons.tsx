// mcd-kit-buttons: the three-band bevel button in all its states plus the surrounding chrome.
// Targets: salvage.png (green SALVAGE + white-framed CANCEL on the #06080C pop-up with corner frame), mission-random-button.png
// (RANDOM card with VIEW [F]), tower-rewards-accept-undo.jpg (green ACCEPT / pink-red UNDO), mission-threat-panel.png (BELOW MINIMUM DIFFICULTY),
// merchant-village.jpg (hold to confirm), hud-strip-controller.png (key caps).
import type {FC, ReactNode} from 'react';
import {useCurrentFrame} from 'remotion';
import {Cap, Pop, Rise, win} from './common';
import {
  CutPanel,
  EmeraldCounter,
  ItemIcon3D,
  KeyCap,
  MCD,
  McdBackdrop,
  McdTitle,
  MainButton,
  PxArt,
  PxText,
  TITLE_GOLD,
  WhiteFlash,
  itemTex,
} from './kit';

const interp = (t: number, a: number, b: number) => a + (b - a) * t;

const Row: FC<{label: string; at: number; children: ReactNode}> = ({label, at, children}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 760, height: 130}}>
    <Rise at={at} dur={8} dy={10}>
      <Cap size={22}>{label}</Cap>
    </Rise>
    <Pop at={at} origin="100% 50%">
      {children}
    </Pop>
  </div>
);

const PixelCursor: FC<{x: number; y: number; show: number}> = ({x, y, show}) => (
  <div style={{position: 'absolute', left: x, top: y, opacity: show, zIndex: 20}}>
    <PxArt
      rows={['k.........', 'kk........', 'kwk.......', 'kwwk......', 'kwwwk.....', 'kwwwwk....', 'kwwwwwk...', 'kwwwwwwk..', 'kwwwwkkkk.', 'kwkwwk....', 'kk.kwwk...', '....kwk...', '....kkk...']}
      pal={{k: '#000', w: '#fff'}}
      px={5}
    />
  </div>
);

export const ButtonsDemo: FC = () => {
  const f = useCurrentFrame();
  const cyc = (f % 48) / 48;
  const pressV = cyc < 0.25 ? cyc / 0.25 : cyc < 0.5 ? 1 - (cyc - 0.25) / 0.25 : 0;
  const hoverV = 0.5 + 0.5 * Math.sin(f * 0.2);
  const holdV = ((f - 30) % 72) / 56;
  const salvagePress = f >= 128 && f < 140 ? Math.min(1, (f - 128) / 4) : f >= 140 && f < 146 ? 1 - (f - 140) / 6 : 0;
  const undoPress = f >= 150 && f < 162 ? Math.min(1, (f - 150) / 4) : f >= 162 && f < 168 ? 1 - (f - 162) / 6 : 0;
  const curP = Math.min(1, win(f, 100, 28));
  return (
    <McdBackdrop kind="inventory" drift={f * 0.4} cell={44}>
      {/* left: states */}
      <div style={{position: 'absolute', left: 80, top: 70}}>
        <Pop at={0} origin="0% 0%">
          <CutPanel w={860} h={940} cuts={[0, 0, 0, 40]} fill="#101014" edge="#3A3A3E" corners>
            <div style={{position: 'absolute', left: 48, top: 36}}>
              <McdTitle text="BUTTON STATES" px={4} {...TITLE_GOLD} />
            </div>
            <div style={{position: 'absolute', left: 50, top: 110, display: 'flex', flexDirection: 'column'}}>
              <Row label="Idle" at={8}>
                <MainButton label="START MISSION" w={470} h={100} />
              </Row>
              <Row label="Hover" at={14}>
                <MainButton label="START MISSION" w={470} h={100} hover={hoverV} />
              </Row>
              <Row label="Press" at={20}>
                <MainButton label="START MISSION" w={470} h={100} press={pressV} />
              </Row>
              <Row label="Hold to confirm" at={26}>
                <MainButton label="BUY ITEM" w={470} h={100} hold={Math.min(1, Math.max(0, holdV))} keycap="E" />
              </Row>
              <Row label="Disabled" at={32}>
                <MainButton label="BELOW MINIMUM" w={470} h={100} tone="disabled" />
              </Row>
              <Row label="Gold" at={38}>
                <MainButton label="UPGRADE" w={470} h={100} tone="gold" />
              </Row>
            </div>
          </CutPanel>
        </Pop>
      </div>

      {/* right top: salvage pop-up */}
      <div style={{position: 'absolute', left: 1000, top: 70}}>
        <Pop at={10} origin="50% 0%">
          <div style={{position: 'relative', width: 840, height: 420}}>
            <CutPanel w={840} h={420} cuts={[0, 0, 0, 0]} fill={MCD.void} edge="#1A1C22" corners>
              <div style={{position: 'absolute', left: 54, top: 54}}>
                <PxText text="SALVAGE PAYBACK" px={3} color="#FCC830" shadowColor="#2A1600" />
              </div>
              <div style={{position: 'absolute', left: 54, top: 126}}>
                <EmeraldCounter value={15} px={3} />
              </div>
              <div style={{position: 'absolute', left: 54, bottom: 50}}>
                <MainButton label="CANCEL" tone="ghost" w={220} h={80} textPx={3} />
              </div>
              <div style={{position: 'absolute', right: 54, bottom: 46}}>
                <MainButton label="SALVAGE" w={360} h={96} press={salvagePress} />
              </div>
            </CutPanel>
            <div style={{position: 'absolute', right: -10, top: -60}}>
              <ItemIcon3D src={itemTex('iron_sword')} size={290} depth={10} />
            </div>
          </div>
        </Pop>
      </div>

      {/* right middle: random card + key caps */}
      <div style={{position: 'absolute', left: 1000, top: 540}}>
        <Pop at={46} origin="0% 0%">
          <div style={{position: 'relative', width: 400, height: 260, background: '#2E302E', boxShadow: 'inset 0 0 0 4px #1A1C1A, inset 0 0 0 8px #3E403E'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 30, display: 'flex', justifyContent: 'center'}}>
              <PxText text="RANDOM" px={4} />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 96, display: 'flex', justifyContent: 'center'}}>
              <PxText text="EARN BONUS AP" px={2} />
            </div>
            <div style={{position: 'absolute', left: 36, top: 150}}>
              <MainButton label="VIEW" w={328} h={80} keycap="F" textPx={3} press={f >= 96 && f < 106 ? 1 : 0} />
            </div>
          </div>
        </Pop>
      </div>
      <div style={{position: 'absolute', left: 1440, top: 540}}>
        <Pop at={52} origin="0% 0%">
          <CutPanel w={400} h={260} cuts={[0, 28, 0, 0]} fill="#14161C" edge="#3A3A3E">
            <div style={{position: 'absolute', left: 36, top: 34, display: 'flex', gap: 22}}>
              <KeyCap label="A" color={MCD.keyA} size={64} />
              <KeyCap label="B" color={MCD.keyB} size={64} />
              <KeyCap label="X" color={MCD.keyX} size={64} />
              <KeyCap label="Y" color={MCD.keyY} size={64} />
            </div>
            <div style={{position: 'absolute', left: 36, top: 126, display: 'flex', gap: 22, alignItems: 'center'}}>
              <KeyCap label="LB" size={64} wide />
              <KeyCap label="RB" size={64} wide />
              <KeyCap label="RT" size={64} wide />
            </div>
            <div style={{position: 'absolute', left: 36, top: 202, display: 'flex', gap: 22, alignItems: 'center'}}>
              <KeyCap label="E" size={48} />
              <KeyCap label="F" size={48} />
              <KeyCap label="BSP" size={48} wide />
            </div>
          </CutPanel>
        </Pop>
      </div>

      {/* right bottom: accept / undo */}
      <div style={{position: 'absolute', left: 1000, top: 880, display: 'flex', gap: 40}}>
        <Pop at={60} origin="0% 100%">
          <MainButton label="ACCEPT" w={400} h={112} keycap="ENT" textPx={4} />
        </Pop>
        <Pop at={66} origin="0% 100%">
          <MainButton label="UNDO" w={400} h={112} tone="red" keycap="BSP" press={undoPress} textPx={4} />
        </Pop>
      </div>
      <PixelCursor x={interp(curP, 1180, 1300)} y={interp(curP, 760, 410)} show={f >= 100 && f < 150 ? 1 : 0} />
      <WhiteFlash at={140} dur={4} peak={0.14} steps={2} />
    </McdBackdrop>
  );
};
