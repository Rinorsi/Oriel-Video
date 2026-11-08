import type {FxEntry} from '../../types';
import {Compare, GRADED, GRADED_NOTE, VanillaPlate} from './lib';
import {GradeMap, type GradeBiome} from './grade';
import {BloomFog, type FogToneId} from './glow';
import {DustMotes, GodRays, HurtVignette, TiltShift, TiltHaze} from './light';
import {Embers, LightningStorm, LootBeams, SoulsDrift, TorchGlow} from './fx';

type PB = 'forest-day' | 'forest-night' | 'nether' | 'end' | 'snow' | 'desert' | 'camp';
const N = 210;

const meta = (id: string, name: string, frames: number, tags: string[], blurb: string, usage: string, params: {name: string; desc: string}[]) => ({
  id,
  name,
  category: 'rpg' as const,
  tags: ['地下城', '氛围层', ...tags],
  frames,
  blurb,
  usage,
  params,
});

const GLOW_DIM: Record<GradeBiome, number> = {forest: 0.5, nether: 0.2, end: 0, snow: 0.45, desert: 0.3};
const gradeEntry = (biome: GradeBiome, plate: PB, tone: FogToneId, name: string, blurb: string): FxEntry[] => [{
  meta: meta(`mcd-l-grade-${biome}`, name, N, ['调色', '泛光', '体积雾', '暗角'], blurb, '叠在真实录屏上：正片叠底 100% + 同色系 mcd-l-bloom-fog（滤色 70–80%），再把素材饱和度 +15~20、对比度 +8。', [
    {name: 'biome', desc: 'forest | nether | end | snow | desert'},
    {name: 'intensity', desc: '0–1，整张光影图向中性白淡出'},
    {name: 'lights', desc: '额外亮区 [{x,y,r,color,a}]（0–1 屏幕坐标），在贴图里“挖”出光源照亮的地方'},
  ]),
  Demo: () => (
    <Compare
      frames={N}
      plate={<VanillaPlate biome={plate} loop={N} />}
      after={<VanillaPlate biome={plate} loop={N} post={GRADED} />}
      stack={[
        {node: <GradeMap biome={biome} loop={N} />, mode: 'multiply'},
        {node: <BloomFog loop={N} tone={tone} />, mode: 'screen', opacity: 0.8},
      ]}
      chip={['正片叠底 100% + 滤色 80%', GRADED_NOTE]}
    />
  ),
  Layer: () => <GradeMap biome={biome} loop={N} />,
},
{
  meta: meta(`mcd-l-grade-${biome}-glow`, `${name} · 雾光层`, N, ['调色', '泛光', '体积雾'], `${name} 的搭档层：黑位染色、地面缓雾、屏外主光的双层泛光（滤色）。`, '与同群系调色层叠用：滤色 70–80%。', [
    {name: 'tone', desc: 'cool | forest | nether | end | snow | desert'},
    {name: 'strength', desc: '强度倍率'},
    {name: 'lights', desc: '[{x,y,color,size,a}] 给素材里的光源加双层泛光'},
  ]),
  Demo: () => (
    <Compare frames={N} plate={<VanillaPlate biome={plate} loop={N} dim={GLOW_DIM[biome]} />} stack={[{node: <BloomFog loop={N} tone={tone} />, mode: 'screen', opacity: 0.8}]} chip="滤色 80%" />
  ),
  Layer: () => <BloomFog loop={N} tone={tone} />,
}];

const BF_N = 180;
const bfLights = [
  {x: 606 / 1920, y: 380 / 1080, color: '#ffc870', a: 0.7},
  {x: 266 / 1920, y: 652 / 1080, color: '#ffc870', a: 0.7},
  {x: 724 / 1920, y: 800 / 1080, color: '#ffa850', a: 0.8, size: 1.3},
  {x: 1290 / 1920, y: 784 / 1080, color: '#ffc870', a: 0.7},
  {x: 1260 / 1920, y: 190 / 1080, color: '#c070ff', a: 0.8, size: 1.2},
];

const GR_N = 210;
const BEAM_N = 180;
const SOUL_N = 240;
const EMB_N = 180;
const LN_N = 240;
const HURT_N = 180;
const DUST_N = 210;
const TORCH_N = 180;
const TILT_N = 180;

export const entries: FxEntry[] = [
  ...gradeEntry('forest', 'forest-day', 'forest', '地下城调色·森林夜', '原版白天森林被压成青蓝夜色：中心留一块被光托住的亮区，四周深青暗角，蓝灰体积雾沉在地面。'),
  ...gradeEntry('nether', 'nether', 'nether', '地下城调色·下界', '深红压暗配金橙雾，熔岩一侧的亮区被托起，暗角带红。'),
  ...gradeEntry('end', 'end', 'end', '地下城调色·末地', '紫色虚空光影：深紫暗部、粉白亮区、紫雾。'),
  ...gradeEntry('snow', 'snow', 'snow', '地下城调色·雪地', '冰蓝夜雪：压低色温，亮区偏白蓝，暗角钴蓝。'),
  ...gradeEntry('desert', 'desert', 'desert', '地下城调色·沙漠', '暖黄尘雾：整体偏金，暗角焦褐，亮区发白。'),
  {
    meta: meta('mcd-l-bloom-fog', '泛光 + 体积雾', BF_N, ['泛光', '雾', '黑位抬升'], '给黑位染上群系色相，地面沉一层缓慢飘动的雾，光源周围套紧(1%)和宽(5%)两层泛光。', '滤色 60–100%；光源位置用 lights 对准素材里的火把/灯笼/熔岩。', [
      {name: 'tone', desc: 'cool | forest | nether | end | snow | desert'},
      {name: 'strength', desc: '整体强度倍率'},
      {name: 'lights', desc: '[{x,y,color,size,a}]，0–1 屏幕坐标；默认只有左上角一盏屏外主光'},
    ]),
    Demo: () => <Compare frames={BF_N} plate={<VanillaPlate biome="camp" loop={BF_N} camera="static" />} stack={[{node: <BloomFog loop={BF_N} tone="cool" lights={bfLights} />, mode: 'screen'}]} chip="滤色 100%" />,
    Layer: () => <BloomFog loop={BF_N} tone="cool" />,
  },
  {
    meta: meta('mcd-l-god-rays', '金色 God Rays', GR_N, ['光束', '尘埃'], '#e2ae4b 金色斜射光柱缓慢摆动，光柱里浮着方形尘埃。', '滤色 70–100%，素材里有树荫/窗洞/洞口时最合适。', [
      {name: 'n', desc: '光柱数量，默认 6'},
      {name: 'angle', desc: '倾斜角度（度），默认 15'},
      {name: 'strength', desc: '强度'},
      {name: 'color', desc: '光柱主色，默认 #e2ae4b'},
      {name: 'dust', desc: '是否带尘埃'},
    ]),
    Demo: () => <Compare frames={GR_N} plate={<VanillaPlate biome="camp" loop={GR_N} camera="static" dim={0.15} />} stack={[{node: <GodRays loop={GR_N} />, mode: 'screen'}]} chip="滤色 100%" />,
    Layer: () => <GodRays loop={GR_N} />,
  },
  {
    meta: meta('mcd-l-tiltshift', '移轴浅景深', TILT_N, ['移轴', '特写'], '上下边缘渐隐模糊 + 冷色雾化 + 轻微暗角，把大场景压成“小积木世界”。', '特写/过场镜头；Remotion 里用 <TiltShift> 包裹素材得到真模糊，导出层只含雾化与暗角（正常 100%）。', [
      {name: 'blur', desc: '最大模糊像素，默认 7'},
      {name: 'top / bottom', desc: '上下模糊带占画面高度比例'},
      {name: 'strength', desc: '雾化与暗角强度'},
    ]),
    Demo: () => (
      <Compare
        frames={TILT_N}
        plate={<VanillaPlate biome="forest-day" loop={TILT_N} />}
        after={
          <TiltShift loop={TILT_N}>
            <VanillaPlate biome="forest-day" loop={TILT_N} post={GRADED} />
          </TiltShift>
        }
        stack={[]}
        chip={['移轴模糊 + 雾化 + 暗角', '导出层只含雾化 + 暗角']}
      />
    ),
    Layer: () => <TiltHaze loop={TILT_N} />,
  },
  {
    meta: meta('mcd-l-loot-beams', '稀有度光柱', BEAM_N, ['光柱', '战利品', '稀有度'], '白 / 绿 / 橙 / 品红光柱 4 帧冲出，白核硬边，底部光斑，细十字粒子上喷。', '滤色 100%；beams 指定屏幕位置与颜色，at 指定冲出帧。', [
      {name: 'beams', desc: '[{x,y,kind:white|green|orange|magenta,at,end,width}]，x/y 为光柱落地点像素坐标（1920×1080）'},
      {name: 'fadeOut', desc: '消失渐隐帧数'},
    ]),
    Demo: () => (
      <Compare frames={BEAM_N} plate={<VanillaPlate biome="camp" loop={BEAM_N} camera="static" />} stack={[{node: <LootBeams loop={BEAM_N} />, mode: 'screen'}]} chip="滤色 100%" timing={{hold0: 0.06, sweep: 0.12, holdAfter: 0.5}} />
    ),
    Layer: () => <LootBeams loop={BEAM_N} />,
  },
  {
    meta: meta('mcd-l-souls-drift', '灵魂飘浮', SOUL_N, ['灵魂', '飘过'], '白色小鬼脸带青蓝拖尾，沿弧线缓慢飘过画面，远近两条通道。', '滤色 100%；夜景、击败敌人、墓地/下界类镜头。', [{name: 'loop', desc: '循环帧数（灵魂按它严格循环）'}]),
    Demo: () => <Compare frames={SOUL_N} plate={<VanillaPlate biome="forest-night" loop={SOUL_N} />} stack={[{node: <SoulsDrift loop={SOUL_N} />, mode: 'screen'}]} chip="滤色 100%" />,
    Layer: () => <SoulsDrift loop={SOUL_N} />,
  },
  {
    meta: meta('mcd-l-embers', '下界灰烬火星', EMB_N, ['火星', '灰烬', '下界'], '红橙火星与灰红碎屑三层景深上飘，小方块、细长片，大颗带光晕。', '滤色 100%；下界、熔炉、Boss 战。', [
      {name: 'variant', desc: 'nether | gold'},
      {name: 'density', desc: '粒子密度倍率'},
      {name: 'wind', desc: '横向风，默认 0.22'},
    ]),
    Demo: () => <Compare frames={EMB_N} plate={<VanillaPlate biome="nether" loop={EMB_N} dim={0.4} />} stack={[{node: <Embers loop={EMB_N} />, mode: 'screen'}]} chip="滤色 100%" />,
    Layer: () => <Embers loop={EMB_N} />,
  },
  {
    meta: meta('mcd-l-embers-gold', '金色火星', EMB_N, ['火星', '金色', '标题'], '金色火星上飘（同一套粒子，金色色带）。', '滤色 100%；标题卡、胜利结算、营地篝火。', [{name: 'variant', desc: 'gold'}]),
    Demo: () => <Compare frames={EMB_N} plate={<VanillaPlate biome="camp" loop={EMB_N} camera="static" />} stack={[{node: <Embers loop={EMB_N} variant="gold" />, mode: 'screen'}]} chip="滤色 100%" />,
    Layer: () => <Embers loop={EMB_N} variant="gold" />,
  },
  {
    meta: meta('mcd-l-lightning-storm', '夜丛林闪电', LN_N, ['闪电', '泛闪', '雷暴'], '阶梯折线闪电、双次泛闪、远处地平线泛光，间隔不规则。', '滤色 100%；夜丛林/暴风雨/Boss 登场。', [
      {name: 'strikes', desc: '[{frame,x,y,seed,kind:bolt|far}]，x/y 为 0–1 落点'},
      {name: 'flash', desc: '泛闪强度倍率'},
    ]),
    Demo: () => (
      <Compare frames={LN_N} plate={<VanillaPlate biome="forest-night" loop={LN_N} />} stack={[{node: <LightningStorm loop={LN_N} />, mode: 'screen'}]} chip="滤色 100%" timing={{hold0: 0.04, sweep: 0.1, holdAfter: 0.7}} />
    ),
    Layer: () => <LightningStorm loop={LN_N} />,
  },
  {
    meta: meta('mcd-l-hurt-vignette', '受伤/低血量晕影', HURT_N, ['受伤', '血量', '晕影'], '四周猩红径向晕影随心跳（双搏）脉动，开头一次受击重闪。', '正常 100%；低血量/受击段落。', [
      {name: 'hp', desc: '危险度 0–1（越大晕影越深）'},
      {name: 'beats', desc: '一个循环内心跳次数'},
      {name: 'hitAt', desc: '受击闪烁发生的帧'},
    ]),
    Demo: () => (
      <Compare frames={HURT_N} plate={<VanillaPlate biome="forest-day" loop={HURT_N} />} stack={[{node: <HurtVignette loop={HURT_N} hitAt={14} />, mode: 'normal'}]} chip="正常 100%" timing={{hold0: 0.05, sweep: 0.1, holdAfter: 0.7}} />
    ),
    Layer: () => <HurtVignette loop={HURT_N} hitAt={14} />,
  },
  {
    meta: meta('mcd-l-dust-motes', '空气尘埃光斑', DUST_N, ['尘埃', '光斑'], '三层景深的方形尘埃缓慢漂浮，前景是柔和的六边形光斑。', '滤色 60–100%；沙漠神殿、矿洞、光束下。', [
      {name: 'color', desc: '尘埃主色，默认 #f6d98a'},
      {name: 'strength', desc: '强度'},
    ]),
    Demo: () => <Compare frames={DUST_N} plate={<VanillaPlate biome="camp" loop={DUST_N} camera="static" dim={0.2} />} stack={[{node: <DustMotes loop={DUST_N} />, mode: 'screen'}]} chip="滤色 100%" />,
    Layer: () => <DustMotes loop={DUST_N} />,
  },
  {
    meta: meta('mcd-l-torch-glow', '火把/篝火暖光', TORCH_N, ['火把', '篝火', '暖光'], '台阶状方块光斑（菱形光域）+ 柔和暖光 + 白热核心 + 上飘火星，摇曳闪烁。', '滤色 100%；torches 对准素材中的火把/篝火。', [
      {name: 'torches', desc: '[{x,y,size,kind:torch|camp|soul|lava}]，x/y 为火焰像素位置（1920×1080）'},
      {name: 'strength', desc: '强度倍率'},
    ]),
    Demo: () => <Compare frames={TORCH_N} plate={<VanillaPlate biome="camp" loop={TORCH_N} camera="static" />} stack={[{node: <TorchGlow loop={TORCH_N} />, mode: 'screen'}]} chip="滤色 100%" />,
    Layer: () => <TorchGlow loop={TORCH_N} />,
  },
];
