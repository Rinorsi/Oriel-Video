import type {FC} from 'react';
import {Sequence} from 'remotion';
import {PlateA, PlateB} from '../../gallery/plates';
import {
  AtmBlockDebris,
  AtmDayNight,
  AtmFireflies,
  AtmFlash,
  AtmHurt,
  AtmLensFlare,
  AtmLetterbox,
  AtmRain,
  AtmRetroFilm,
  AtmShake,
  AtmSnow,
  AtmSpeedLines,
  AtmSpotlight,
  AtmThunder,
  AtmVignetteBreathe,
  AtmVignetteClose,
  AtmXpOrbs,
} from './atmo';

/** Runnable examples for the atmosphere group (classicOthers / atmo). Each is the runnable version of the catalog `example`. Plates stand in for real footage. */
const VignetteClose: FC = () => (
  <>
    <PlateA />
    <AtmVignetteClose />
  </>
);

const VignetteBreathe: FC = () => (
  <>
    <PlateA />
    <AtmVignetteBreathe />
  </>
);

const Spotlight: FC = () => (
  <>
    <PlateA />
    <AtmSpotlight />
  </>
);

const Letterbox: FC = () => (
  <>
    <PlateA />
    <AtmLetterbox />
  </>
);

/** Wrapper type: the footage goes inside <AtmShake>. */
const Shake: FC = () => (
  <>
    <AtmShake>
      <PlateA />
    </AtmShake>
  </>
);

/** Three flashes placed with <Sequence>; each AtmFlash has its own local frame 0. */
const Flash: FC = () => (
  <>
    <PlateA />
    <Sequence from={14} durationInFrames={60}>
      <AtmFlash kind="white" />
    </Sequence>
    <Sequence from={62} durationInFrames={70}>
      <AtmFlash kind="gold" />
    </Sequence>
    <Sequence from={110} durationInFrames={40}>
      <AtmFlash kind="red" />
    </Sequence>
  </>
);

const Hurt: FC = () => (
  <>
    <PlateA />
    <AtmHurt />
  </>
);

const LensFlare: FC = () => (
  <>
    <PlateA />
    <AtmLensFlare />
  </>
);

/** Wrapper form: the footage goes inside <AtmRetroFilm>; without children it is a transparent overlay. */
const RetroFilm: FC = () => (
  <AtmRetroFilm>
    <PlateA />
  </AtmRetroFilm>
);

const SpeedLines: FC = () => (
  <>
    <PlateA />
    <AtmSpeedLines />
  </>
);

const BlockDebris: FC = () => (
  <>
    <PlateA />
    <AtmBlockDebris />
  </>
);

const XpOrbs: FC = () => (
  <>
    <PlateA />
    <AtmXpOrbs />
  </>
);

/** Fireflies for the first 78 frames, then cross-fade to embers. */
const Fireflies: FC = () => (
  <>
    <PlateB />
    <AtmFireflies switchAt={78} />
  </>
);

const Rain: FC = () => (
  <>
    <PlateA />
    <AtmRain />
  </>
);

const Snow: FC = () => (
  <>
    <PlateB />
    <AtmSnow />
  </>
);

const Thunder: FC = () => (
  <>
    <PlateB />
    <AtmThunder />
  </>
);

const DayNight: FC = () => (
  <>
    <PlateA />
    <AtmDayNight />
  </>
);

export const examples: {id: string; Component: FC; frames: number}[] = [
  {id: 'atm-vignette-close', Component: VignetteClose, frames: 150},
  {id: 'atm-vignette-breathe', Component: VignetteBreathe, frames: 180},
  {id: 'atm-vignette-spotlight', Component: Spotlight, frames: 150},
  {id: 'atm-letterbox', Component: Letterbox, frames: 150},
  {id: 'atm-shake', Component: Shake, frames: 150},
  {id: 'atm-flash', Component: Flash, frames: 150},
  {id: 'atm-hurt', Component: Hurt, frames: 150},
  {id: 'atm-lens-flare', Component: LensFlare, frames: 150},
  {id: 'atm-retro-film', Component: RetroFilm, frames: 150},
  {id: 'atm-speed-lines', Component: SpeedLines, frames: 150},
  {id: 'atm-particles-blocks', Component: BlockDebris, frames: 150},
  {id: 'atm-particles-xp', Component: XpOrbs, frames: 150},
  {id: 'atm-fireflies', Component: Fireflies, frames: 180},
  {id: 'atm-rain', Component: Rain, frames: 150},
  {id: 'atm-snow', Component: Snow, frames: 150},
  {id: 'atm-thunder', Component: Thunder, frames: 150},
  {id: 'atm-day-night', Component: DayNight, frames: 180},
];
