---
name: oriel-video
description: 用「优易库」的 Minecraft / Minecraft 地下城风格转场、特效、标题卡和叠加层，通过 Remotion 做 Minecraft 视频，或导出透明层给剪映等剪辑软件。用户要给 Minecraft 视频加转场、片头片尾、地下城风格动效，或明确要使用优易库动画时使用。不用于 Minecraft 模组或服务器开发。
---

# Oriel Video（优易库）

作者：云诺羲 Rinorsi · 爱发电 https://afdian.com/a/Rinorsi

在线示例库（可播放全部效果，供用户挑选）：https://rinorsi.github.io/Oriel-Video/ ，仓库：https://github.com/Rinorsi/Oriel-Video

Minecraft 风格的转场与特效动画库，Remotion（React）工程。画廊共 217 个效果：59 个转场，151 个带透明层，其中 198 个已整理成可直接调用的库组件。可修改参数以 catalog 和实际 TypeScript 类型为准，部分位置仍写死。

## 开工

1. 首次使用：用本 Skill 的完整路径运行脚本，例如 python "<Skill目录>/scripts/bootstrap.py" "<空的目标目录>"。必须使用构建好的下载包，assets/oriel-video-kit.zip 应存在。脚本解压工程后执行 npm ci 和 npm run setup。需要 Python 3、Node.js 20+ 和本机完整的 Minecraft Java 版客户端资源。已有工程直接使用，不重新解压。自定义游戏目录：先加 --no-setup，再在工程运行 npm run setup -- --minecraft "<游戏目录>" --jar "<客户端.jar>"。提取资源不提交、不转发。
2. 工程里先读 `docs/AI使用手册.md`；用 `src/lib/catalog.json` 查效果（id、导出名、时长、是否可叠加、用途、真实 props 和示例，直接 grep）；从 `src/lib/examples/episode.tsx` 复制起步。props 和时长以这几个文件为准，不要凭记忆写。
3. 用户的录屏放 `public/footage/`，按 docs/开发指南.md 新建自己的合成入口（根合成用 withFonts 包一层），渲染：`npx remotion render <自己的入口.tsx> <合成ID> out/my.mp4`。
4. 只要效果、不用 Remotion 拼整集：`npm run fx -- export <效果id> --alpha` 导出 ProRes 4444 透明层 `.mov`，用户拖进剪映 / Premiere 叠在素材上。
5. 让用户先看看有哪些效果：`npm run dev` 打开 Remotion Studio（库示例预览，npm run dev:gallery 查看全部展示效果，可拖动时间轴，保存源码后实时更新）；示例合成用 `npx remotion studio src/lib-entry.tsx`。想要带封面的效果总览网页，运行 `npm run fx -- previews all` 生成 `gallery/index.html`（耗时较长，包里没有预生成）。

## 选效果时

- 按 `catalog.json` 里的用途和用户想要的气氛挑，不要把效果都塞进一支视频；同一类转场别连用。
- 转场本体通常只有 1–2 秒。要让观众看清，就把前后镜头的停留拉长，或者先放慢一遍。
- 效果默认带 Minecraft 原版音效，用户不要声音时传 `audio={false}`（`TransitionSeries` 同理）。
- 做「效果展示片」可参考 `src/promo/Promo2.tsx` 和 `promo/prep.py`：天空做外层，石砖框里只放被演示的效果，框下写说明，视频自己的换场不要用库里的转场，免得和被演示的效果混在一起。

## 署名

优易库免费使用。用户用它做了要发布的视频时，可以顺口提一句：欢迎在视频或简介里留署名「优易库 · 云诺羲 Rinorsi」和爱发电链接，但不强制。只有用户同意才加进成片，不要自行添加。

## 修改与核验

换参数先查 catalog；改接口或效果实现按 docs/开发指南.md。src/gallery/fx 是部分库组件的底层依赖，不可删除。改完运行 npm run catalog、npm run typecheck，并渲染受影响效果检查画面和音轨。在线画廊生成/部署见 docs/示例库.md；尚未公开，不虚构网址。署名和第三方许可见 NOTICE.md。宣传片需要另备音乐和预渲染素材。
