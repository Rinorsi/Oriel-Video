# AI 使用手册：用这套库做真实视频

> 读这份就够开工。目标：让 AI 直接用 `src/lib` 里的组件拼出一集 Minecraft 视频，不需要翻 `gallery/` 里的展示代码。
> 位置：就是本仓库根目录（Remotion 4 工程）。

## 0. 先读这三样

1. 本手册。
2. `src/lib/catalog.json`：**全部 198 个效果的机器可读目录**（id、导出名、种类、时长、是否可叠加、用在哪、真实 props 表、可复制示例）。找效果就在这里 grep。人读版：`docs/库目录.md`。
3. `src/lib/examples/episode.tsx`：一集完整视频的示例（素材占位 → 调色层 → 标题 → 目标 → 转场 → 终卡）。**复制它当起点。**

## 1. 只从 `src/lib` 引用

```ts
import {TransitionSeries, seriesFrames, mcdBlackCut, makeMcdLoadingLabel, ScenePlate, McdSeriesTitle, McdVObjectives, McdLGradeForest} from '../lib';
```
不要从 `src/gallery/fx/*` 直接 import（那是展示用代码，参数和背景不保证可复用）。

## 2. 核心约定（每个效果都遵守）

- **时间**：所有效果由 `useCurrentFrame()` 驱动。用 `<Sequence from={起点帧} durationInFrames={帧数}>` 摆放，效果的本地第 0 帧就是它的第一帧。`durationInFrames` 用目录里的 `frames`（很多效果的淡出点按默认时长写死，缩短会截断淡出）。
- **背景**：组件默认**不画预设背景**（透明，可直接叠在你的素材上）。目录里 `overlayReady:false` 的必须有背景才成立（标题卡、结算页、整屏地图、`ScenePlate` 等），它们有 `bg` 开关或自带背景。
- **文字/数据**：已开放的文字、物品、数字、颜色、时间点通过 props 修改，以目录和实际类型为准，默认值就是画廊演示值。改 props 即可。
- **音效**：默认带原版音效，`audio={false}` 关闭（转场用 `TransitionSeries audio={false}`）。
- **素材**：你自己的录屏放进 `public/footage/`，用 `<OffthreadVideo src={staticFile('footage/part1.mp4')} />`（来自 `remotion`）。库里示例的 `ScenePlate` 只是占位，替换它，其余不动。
- **分辨率/帧率**：1920×1080，30fps（`src/mc/theme.ts`）。

## 3. 四种用法

### 3.1 转场（A 镜头 → B 镜头）
转场是 `LibTransition` 对象（`mcdBlackCut`、`tMosaic`、`cuteCreeperRush`、`t2BookFlip`、`jumpChapter`…）。用 `TransitionSeries` 串起镜头：

```tsx
const shots = [
  {dur: 240 + mcdBlackCut.frames - mcdBlackCut.bStart, C: ShotA},   // dur 包含与相邻转场的重叠
  {dur: 240, C: ShotB},
];
export const Episode = () => <TransitionSeries shots={shots} transitions={[mcdBlackCut]} />;
// 合成 durationInFrames = seriesFrames(shots, [mcdBlackCut])
```
- `transitions[i]` 在 `shots[i]` 与 `shots[i+1]` 之间；传 `null` 就是硬切。
- 每个转场的 `frames`（过渡本体）和 `bStart`（B 镜头本地第 0 帧出现在过渡的第几帧）见目录。cut 型（覆盖层盖满后切换）`bStart` 约一半；dual 型（A/B 各自动）为 0。
- 带参数的转场用工厂：`makeMcdLoadingLabel({place:'红石矿山', difficulty:'III', biome:'nether'})`，**在模块顶层调用一次**，别放进渲染函数。
- 有 `Overlay`（透明层）的 cut 型转场，可以只把覆盖层叠在你自己的素材上（不接管 A/B）：`<TransitionOverlay t={mcdPortalWhiteout} />`；或导出成透明 .mov 给剪映/Premiere（见 §5）。

### 3.2 叠加层（标题、目标、字幕、地名标签、调色、光柱、粒子…）
放在镜头内部，叠在素材上方：
```tsx
<AbsoluteFill>
  <OffthreadVideo src={staticFile('footage/a.mp4')} />
  <McdLGradeForest /><McdLGradeForestGlow />      {/* 调色：正片叠底 + 滤色 */}
  <Sequence from={20} durationInFrames={150}><McdSeriesTitle ep={5} title="沉入地牢深处" /></Sequence>
</AbsoluteFill>
```
调色/光效层自带 `blend`、`opacity` props（默认就是推荐的混合模式，写在目录 `blend` 字段）。层要和素材放在同一个 `AbsoluteFill` 里、位于素材上方。

### 3.3 整屏场景/背景
`<ScenePlate biome="forest-day|forest-night|desert|nether|end|snow|world-map|camp" />` 是 3D 光影体素场景（可做背景、转场 A/B、加载底图）。首帧要烘焙数秒；同时挂载太多会变慢。

### 3.4 整屏卡片（结算页、世界地图选关、简报卡、章节卡…）
组件自带布局；看目录里的 `overlayReady`。要叠在素材上就放在压暗的素材上方。

## 4. 怎么找效果

```bash
# 例：找"叠在录屏上的、带标题"的
node -e "const c=require('./src/lib/catalog.json');console.log(c.filter(e=>e.overlayReady&&/标题/.test(e.name+e.usage)).map(e=>e.export+' — '+e.usage))"
```
`kind`：`transition`（转场）、`overlay`（可叠加层/特效）、`card`（整屏卡片）、`title`（标题卡）、`scene`（场景/背景）、`util`（工具/零件，如 `McdKit`）。

## 5. 渲染与导出

```bash
# 在当前工程根目录运行
npx remotion render src/index.ts <CompositionId> out.mp4          # 你自己的整集（在 Root 里注册后）
npm run fx -- export <id>                                          # 导出某个画廊效果的完整 mp4
npm run fx -- export <id> --alpha                                  # 导出透明层 .mov (ProRes 4444)，叠到剪映/Premiere
npx remotion studio src/lib-entry.tsx                              # 预览所有示例 (composition lib-<id>)
```
给 Remotion 工程加一集：在 `src/Root.tsx` 里 `<Composition id="MyEp" component={withFonts(MyEpisode)} durationInFrames={seriesFrames(shots, transitions)} fps={FPS} width={WIDTH} height={HEIGHT} />`。**每个根合成都要用 `withFonts` 包一层**（像素字体加载），`withFonts`、`FPS/WIDTH/HEIGHT` 都从 `src/lib` 引用。

## 6. 已知限制（做视频前先知道）

- **加载转场、传送门涡旋、宝箱位置、闪电落点、地图推近节点**：少数位置写死，目录里已注明；换了 A 镜头构图可能对不上。
- **`TransitionSeries` 的 A/B 在过渡期间并存**：含 `ScenePlate` 的两个镜头同时存在，首帧烘焙更慢。
- **调色层不是真透明**：画布不透明，靠 `multiply` 生效；真泛光需要知道素材哪里亮，只能围绕你指定的光源位置画。
- **移轴 `McdLTiltShift` 需要包裹素材**（children），叠加层拿不到底下画面。`AtmShake`/`AtmRetroFilmWrap` 同理。
- **结算页、标题卡、终卡、片尾滚动、制作组呈现**必须有黑场/背景才成立；`bg={false}` 只留文字和火星。
- **Boss 击败的结尾白闪**会盖住素材；**白闪峰值**在用到爆发类效果时可调低。
- **中文大字**在像素字里笔画多的字会糊（如「红」「僵」），标题字数少时清楚；字数多用小字号。
- **有的效果淡出点按默认时长写死**（`durationInFrames` 应取目录的 `frames`）。
- 未提取的音效应先补全 setup 的 SOUNDS 列表，不让缺失资源悄悄变成静音。

## 7. 效果制作约定

- 不要扩散圆环（冲击用 `Shockwave`：像素十字闪光+阶梯碎片，在 `src/mc/Fx.tsx`）。
- 不要拟声字、不要用文字代替动作；功能性文字（标题/数字/名字）可以有。
- Minecraft 生物/方块/物品用真实贴图（`public/mc/textures/entity/*`，裁切助手 `src/gallery/mob.tsx`），不要手绘山寨。
- 文字居中不出框不重叠；画面饱满有层次；不堆砌「AI 味」装饰（乱放射线、乱飞星星爱心、多重光晕）。
- 稀有度颜色（地下城风）白 / 绿 / 橙；地下城 UI 没有圆角，几何是六边形/菱形/斜切角。
- 音效：转场里**不要用**素材库的 `whoosh-fast`(又细又长的扫过声)、`impact-cine`(4 秒冲击)、`transition-soft`/`transition-snap`(柔和脉冲)。声音一律用原版 Minecraft 真实音效(`mc:` 前缀，文件在 `public/mc/sounds`，来自资源索引，`scripts/setup.mjs` 的 SOUNDS 列表负责提取)：村民用 `mob/villager/yes*|no*|idle*`，翻页用 `item/book/open_flip*`，传送门 `portal/travel`，箱子 `block/chest/*`。
- 不用 `Math.random`，用 `mulberry32(seed)`；所有运动由 `useCurrentFrame()` 推出。
- 新效果先登记到画廊（`src/gallery/fx/<area>/index.tsx`），再整理进 `src/lib/<group>.tsx` + `src/lib/catalog/<group>.json` + `src/lib/examples/<group>.tsx`，`npm run catalog` 必须 0 问题，`npx tsc --noEmit` 必须零报错。

## 8. 目录速查

| 路径 | 内容 |
|---|---|
| `src/lib/index.ts` | 唯一入口 |
| `src/lib/types.ts`、`transition.tsx` | 约定与转场工具（`TransitionSeries`、`fromDef`、`seriesFrames`、`TransitionOverlay`） |
| `src/lib/mcdTrans.tsx` | 地下城转场 13 + 3D 场景引擎(`ScenePlate` 等) |
| `src/lib/mcdShow.tsx` | 地下城展示动效 15 + 标题卡/片头片尾 11 |
| `src/lib/mcdLayers.tsx` | 地下城氛围、调色、冒险信息、镀金锻造与 `McdKit` |
| `src/lib/classicTrans.tsx` | 通用/可爱/进阶/维度跳转转场 50 |
| `src/lib/classicOthers/*` | 地图旅程、互动关注、合成物品、信息字幕、氛围层 63 |
| `src/lib/catalog.json` | 机器可读目录（`npm run catalog` 重建） |
| `src/lib/examples/` | 每个效果的可运行示例 + `episode.tsx` 整集示例 |
| `src/gallery/` | 画廊（展示用）；`fx/*` 是原始实现 |

## 9. 安装、预览与改源码

安装与 Skill 调用见 [README](../README.md)。默认 npm run dev 预览库示例，npm run dev:gallery 预览全部展示效果。新建合成入口、修改物品动画、扩展接口和重新打包见 [开发指南](开发指南.md)。
