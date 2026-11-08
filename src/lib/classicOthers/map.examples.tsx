import type {FC} from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {MapFlatModern, MapHome, MapPinPop, MapRespawn, MapRouteA2B, MapRouteBoat, MapRouteChain, MapRouteElytra, MapRouteHorse, MapRouteMinecart, MapRoutePearl} from './map';

/**
 * Runnable examples for classicOthers/map (composition ids lib-<id>). Journey scenes are full-screen shots: they fill the whole
 * frame, so the example just places them in a <Sequence> with custom nodes/titles. MapPinPop is a transparent overlay and sits on a placeholder gradient.
 * The JSX here is the same as the catalog's `example`.
 */

const ExA2B: FC = () => (
  <Sequence durationInFrames={300}>
    <MapRouteA2B
      nodes={[
        {name: '雪松镇', xz: [-480, 210], pos: [0.28, 0.62], icon: 'house', sub: '出发地'},
        {name: '黑曜石要塞', xz: [960, -520], pos: [0.7, 0.36], icon: 'castle', sub: '终点 · 最终关卡'},
      ]}
      title="前往黑曜石要塞"
      seed={7}
    />
  </Sequence>
);

const ExChain: FC = () => (
  <Sequence durationInFrames={480}>
    <MapRouteChain
      nodes={[
        {name: '出生点', xz: [0, 0], pos: [0.26, 0.64], icon: 'bed', sub: '第 1 站'},
        {name: '蘑菇岛', xz: [420, 300], pos: [0.42, 0.4], icon: 'tent', sub: '第 2 站 · 休整'},
        {name: '海底神殿', xz: [900, 120], pos: [0.62, 0.62], icon: 'anchor', sub: '第 3 站 · 打怪'},
        {name: '末地门户', xz: [1500, -200], pos: [0.74, 0.38], icon: 'ender_eye', sub: '终点'},
      ]}
      title="通关四站"
    />
  </Sequence>
);

const ExMinecart: FC = () => (
  <Sequence durationInFrames={300}>
    <MapRouteMinecart
      nodes={[
        {name: '地下车站', xz: [-700, 300], pos: [0.27, 0.36], icon: 'iron_pickaxe', sub: '入口'},
        {name: '红石工坊', xz: [880, 520], pos: [0.71, 0.6], icon: 'diamond', sub: '终点 · 矿车到站'},
      ]}
      title="地铁一号线"
      hud={false}
    />
  </Sequence>
);

const ExHorse: FC = () => (
  <Sequence durationInFrames={270}>
    <MapRouteHorse
      nodes={[
        {name: '马场', xz: [1100, 240], pos: [0.74, 0.6], icon: 'house', sub: '出发'},
        {name: '瞭望塔', xz: [-500, -300], pos: [0.27, 0.34], icon: 'tower', sub: '终点'},
      ]}
      title="赶往瞭望塔"
      subtitle="全速骑行"
    />
  </Sequence>
);

const ExPearl: FC = () => (
  <Sequence durationInFrames={240}>
    <MapRoutePearl
      nodes={[
        {name: '悬崖边', xz: [-300, -200], pos: [0.28, 0.36], icon: 'house', sub: '投掷点'},
        {name: '对岸', xz: [700, 480], pos: [0.74, 0.62], icon: 'ender_eye', sub: '落点'},
      ]}
      title="一秒过河"
    />
  </Sequence>
);

const ExElytra: FC = () => (
  <Sequence durationInFrames={320}>
    <MapRouteElytra
      nodes={[
        {name: '山顶发射台', xz: [-900, 300], pos: [0.26, 0.62], icon: 'house', sub: '起飞'},
        {name: '浮空岛', xz: [1400, -480], pos: [0.68, 0.4], icon: 'elytra', sub: '终点'},
      ]}
      title="飞越群山"
    />
  </Sequence>
);

const ExBoat: FC = () => (
  <Sequence durationInFrames={300}>
    <MapRouteBoat
      nodes={[
        {name: '渔村码头', xz: [-640, 200], pos: [0.27, 0.58], icon: 'anchor', sub: '出港'},
        {name: '骷髅岛', xz: [1000, -280], pos: [0.74, 0.4], icon: 'chest', sub: '终点 · 宝藏'},
      ]}
      title="出海寻宝"
      arriveText="宝藏就在这里"
    />
  </Sequence>
);

const ExHome: FC = () => (
  <Sequence durationInFrames={340}>
    <MapHome houseName="我的家" welcomeText="我回来啦" title="回家" />
  </Sequence>
);

const ExRespawn: FC = () => (
  <Sequence durationInFrames={300}>
    <MapRespawn deadText="你被击败了" scoreText="得分: 1280" />
  </Sequence>
);

const ExPinPop: FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(135deg, #3a5a3a, #a8c88a)'}}>
    <Sequence from={10} durationInFrames={150}>
      <MapPinPop
        pins={[
          {x: 520, y: 700, name: '主基地', coord: 'X: 0   Z: 0', at: 14, color: '#e5483f'},
          {x: 960, y: 450, name: '刷怪塔', coord: 'X: 320   Z: -140', at: 42, color: '#3fb0e8'},
          {x: 1400, y: 720, name: '末地要塞', coord: 'X: 1800   Z: 960', at: 70, color: '#8f6bff'},
        ]}
      />
    </Sequence>
  </AbsoluteFill>
);

const ExFlat: FC = () => (
  <Sequence durationInFrames={270}>
    <MapFlatModern
      nodes={[
        {name: '工坊', xz: [-312, 148], pos: [0.24, 0.66], icon: 'house'},
        {name: '集市广场', xz: [1204, -388], pos: [0.78, 0.3], icon: 'castle'},
      ]}
      title="步行去集市"
      tags={['最快路线', '不堵车', '风景好']}
    />
  </Sequence>
);

export const examples: {id: string; Component: FC; frames: number}[] = [
  {id: 'map-route-a2b', Component: ExA2B, frames: 300},
  {id: 'map-route-chain', Component: ExChain, frames: 480},
  {id: 'map-route-minecart', Component: ExMinecart, frames: 300},
  {id: 'map-route-horse', Component: ExHorse, frames: 270},
  {id: 'map-route-pearl', Component: ExPearl, frames: 240},
  {id: 'map-route-elytra', Component: ExElytra, frames: 320},
  {id: 'map-route-boat', Component: ExBoat, frames: 300},
  {id: 'map-home', Component: ExHome, frames: 340},
  {id: 'map-respawn', Component: ExRespawn, frames: 300},
  {id: 'map-pin-pop', Component: ExPinPop, frames: 160},
  {id: 'map-flat-modern', Component: ExFlat, frames: 270},
];
