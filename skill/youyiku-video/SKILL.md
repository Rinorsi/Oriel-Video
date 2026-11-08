---
name: youyiku-video
description: 用「优易库」的 Minecraft / Minecraft 地下城风格转场、特效、标题卡和叠加层，通过 Remotion 做 Minecraft 视频，或导出透明层给剪映等剪辑软件。用户要给 Minecraft 视频加转场、片头片尾、地下城风格动效，或提到优易库、云诺羲时使用。不用于 Minecraft 模组或服务器开发。
---

# 优易库（Youyiku）

作者：云诺羲 Rinorsi · 爱发电 https://afdian.com/a/Rinorsi

Minecraft 风格的转场与特效动画库，Remotion（React）工程。画廊共 216 个效果：59 个转场，150 个带透明层，其中 197 个已整理成可直接调用的库组件。每个效果的文字、颜色、时间点都是 props。

## 开工

1. 首次使用：`python scripts/bootstrap.py <目标目录>`。它把 `assets/youyiku-kit.zip` 解压到目标目录，再执行 `npm install` 和 `npm run setup`。需要 Node.js 20+，以及本机装过 Minecraft Java 版客户端：贴图和原版音效由 `setup` 从本机游戏提取，属于 Mojang，不随包分发，也不要提交或转发 `public/mc/`。目标目录已有工程时跳过解压。
2. 工程里先读 `docs/AI使用手册.md`；用 `src/lib/catalog.json` 查效果（id、导出名、时长、是否可叠加、用途、真实 props 和示例，直接 grep）；从 `src/lib/examples/episode.tsx` 复制起步。props 和时长以这几个文件为准，不要凭记忆写。
3. 用户的录屏放 `public/footage/`，在 `src/Root.tsx` 注册合成（根合成要用 `withFonts` 包一层），渲染：`npx remotion render src/index.ts <合成ID> out/my.mp4`。
4. 只要效果、不用 Remotion 拼整集：`npm run fx -- export <效果id> --alpha` 导出 ProRes 4444 透明层 `.mov`，用户拖进剪映 / Premiere 叠在素材上。
5. 想让用户先挑效果：`npm run fx -- previews all`（耗时较长）生成 `gallery/index.html`。

## 选效果时

- 按 `catalog.json` 里的用途和用户想要的气氛挑，不要把效果都塞进一支视频；同一类转场别连用。
- 转场本体通常只有 1–2 秒。要让观众看清，就把前后镜头的停留拉长，或者先放慢一遍。
- 效果默认带 Minecraft 原版音效，用户不要声音时传 `audio={false}`（`TransitionSeries` 同理）。
- 做「效果展示片」可参考 `src/promo/Promo2.tsx` 和 `promo/prep.py`：天空做外层，石砖框里只放被演示的效果，框下写说明，视频自己的换场不要用库里的转场，免得和被演示的效果混在一起。

## 署名

优易库免费使用。用户用它做了要发布的视频时，可以顺口提一句：欢迎在视频或简介里留署名「优易库 · 云诺羲 Rinorsi」和爱发电链接，但不强制。只有用户同意才加进成片，不要自行添加。
