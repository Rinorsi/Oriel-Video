# 优易库

Minecraft / Minecraft 地下城风格的**转场、特效、标题卡、信息层**动画库，基于 Remotion（React）。
画廊里有 216 个效果，其中 197 个整理成了可以直接调用的库组件，150 个可以导出透明层，直接拖进剪映 / Premiere 叠在录屏上。

源码就是素材：每个效果都是一个 React 组件，所有文字、颜色、时间点都是 props，改参数就能换内容，所以很适合交给 AI 来改、来拼。

作者：**云诺羲 Rinorsi** · 爱发电：<https://afdian.com/a/Rinorsi> · B 站：<https://b23.tv/hjUvs0c>

免费使用。如果你的视频里用到了优易库的转场或效果，欢迎保留署名「优易库 · 云诺羲 Rinorsi」，不强制，但留个名字我会很开心。

## 能做什么

| 类型 | 例子 |
|---|---|
| 转场 | 暗场切镜、下界传送门、白闪、紫红光柱、TNT 爆破、苦力怕冲脸、史莱姆糊脸、爱心像素波、维度跳转（主世界 / 下界 / 末地） |
| 地下城风格 | Boss 登场、章节卡、通关结算页、目标栏、地图旅程 |
| 调色与氛围层 | 森林 / 下界调色、光柱、灵魂、火星、体素场景背景 |
| 标题与片头片尾 | 体素大标题、片尾卡、系列标题 |
| 原版音效 | 效果默认带 Minecraft 原版音效，`audio={false}` 可关 |

完整清单：[`docs/库目录.md`](docs/库目录.md)（人读）、[`docs/效果索引.md`](docs/效果索引.md)、[`src/lib/catalog.json`](src/lib/catalog.json)（机器读，含真实 props 和可复制示例）。

## 快速开始

需要 Node.js 20+，以及本机装过 Minecraft（Java 版）客户端或 Gradle 的 loom 缓存，用来提取贴图和音效。

```bash
npm install
npm run setup          # 从本机 Minecraft 提取贴图和原版音效到 public/（不进 git）
npm run dev            # 打开 Remotion Studio，边看边改
```

Mojang 的贴图和音效**不随仓库分发**，由 `npm run setup` 从你本机的游戏里提取。字体（OFL 协议）已随仓库带上。

## 怎么用

### 让 AI 来用（推荐）

1. 把 [`docs/AI使用手册.md`](docs/AI使用手册.md) 和 `src/lib/catalog.json` 交给 AI。
2. 用大白话讲你的想法，例如「开场用传送门转场，中间加下界调色，结尾放片尾卡」。AI 会从目录里挑效果、排时间轴，写出一个新的合成。
3. 让 AI 渲染：

```bash
npx remotion render src/index.ts <合成ID> out/my.mp4
```

### 导出透明层，拖进剪映

```bash
npm run fx -- export <效果id> --alpha     # 输出 ProRes 4444 的 .mov
```

把 `.mov` 拖进剪映 / Premiere 的上方轨道，直接叠在你的素材上。

### 自己写

从 `src/lib/examples/episode.tsx` 复制一集完整示例开始，所有组件都从 `src/lib` 引用。

### 打包成 Skill，让 AI 直接用

`skill/youyiku-video/` 是给 AI 用的 Skill 源文件。构建下载包：

```bash
git commit -a            # 打包的是已提交的内容
npm run skill:build      # 生成 out/skill/youyiku-video/（含 assets/youyiku-kit.zip）
```

装上 Skill 后，AI 会用 `scripts/bootstrap.py` 解压工程、安装依赖，再按手册和效果目录帮你拼视频。

## 目录

```
src/lib/        可直接调用的库组件、catalog.json、示例
src/gallery/    画廊里的全部效果（展示用代码）
src/mc/ src/mg/ 底层积木（主题、字体、体素、转场骨架）
src/promo/      「优易库」宣传片的完整源码（时间轴、画面、字幕）
promo/          宣传片的台词稿、配音与对齐脚本
scripts/        setup、渲染、导出、目录生成
docs/           使用手册、目录、视觉方法
```

## 宣传片是怎么做的

宣传片（无配音，约 2 分钟）本身就是用这个库做的，源码在 `src/promo/`。画面分三层，一眼能分清谁是谁：

- **外层**：随时间走完一天的像素天空（日出 → 正午 → 日落 → 夜晚），是视频自己的风格。
- **中间**：像素风的石砖框，框里只放被演示的效果。每个主打转场先正常速度播一遍，再慢放一遍，并标出「镜头 A / 转场 / 镜头 B」。
- **框下**：木牌字幕牌，写效果名、说明和速度。

视频自己的换场用「屏幕开关机」，不使用库里的任何转场，避免和被演示的转场混在一起。中间有按页展示的 59 个转场总览墙，每一格都是真实效果在循环播放。

```bash
npm run setup                 # 提取贴图
npm run fx -- previews all    # 生成画廊预览（gallery/）
npm run promo:prep            # 准备天空、主打转场、总览墙和数据（需要 ffmpeg 和 python + numpy）
# 把你的背景音乐放到 public/promo2/audio/bgm.mp3
npm run promo                 # 渲染成片 out/promo.mp4
```

`promo/prep.py` 里的 `HEROES` 是主打转场，改这个列表就能换。BGM 和中间素材不在仓库里，需要自行准备。
