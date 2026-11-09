# Oriel Video（优易库）

Minecraft / Minecraft 地下城风格的 Remotion 动画库：217 个展示效果，198 个可复用库条目，59 个转场，151 个支持透明层导出。

| 效果 | 示例 |
|---|---|
| 转场 | 传送门、TNT、苦力怕冲脸、史莱姆、翻书、维度跳转 |
| 物品动画 | 合成、熔炼、锻造、附魔、酿造、掉落、拾取、战利品 |
| 标题与信息 | 片头片尾、章节卡、Boss 登场、结算页、目标栏、字幕 |
| 背景与氛围 | 体素场景、地图旅程、调色、光柱、雨雪、粒子 |

**[在线示例库：浏览并播放全部效果](https://rinorsi.github.io/Oriel-Video/)**

[效果目录](docs/库目录.md) · [全部展示效果](docs/效果索引.md) · [AI 使用手册](docs/AI使用手册.md)

## 安装与预览

需要 Node.js 20+，以及带完整资源的 Minecraft Java 版客户端。

```bash
npm ci
npm run setup
npm run dev             # Remotion Studio：库组件与整集示例
npm run dev:gallery     # 全部展示效果，可拖动时间轴
```

游戏在自定义目录时：

```bash
npm run setup -- --minecraft "你的游戏目录" --jar "客户端.jar的完整路径"
```

贴图与原版音效从本机游戏提取。需要自行准备录屏和背景音乐。

## 用 Skill 做视频

下载包的文件夹名应为 `oriel-video`，里面包含 `SKILL.md`、`scripts/` 和 `assets/`。

- **Cindy**：将整个文件夹放入项目的 `.agents/skills/`，重新开启 Agent 会话，在 Skill 列表选择「Oriel Video」。
- **其他支持 Skills 的 Agent**：将整个文件夹放入该工具的 Skills 目录。
- **直接交给 AI**：提供 `SKILL.md` 的完整路径，让 AI 读取并按它操作。

调用示例：

> 使用 $oriel-video，把我的录屏做成一段 Minecraft 视频：传送门开场，合成物品时加动画，最后加片尾卡。

只需要转场：

> 使用 $oriel-video，预览苦力怕冲脸转场，然后导出透明层给剪映。

[从源码构建 Skill 下载包](docs/开发指南.md#skill-下载包)

## 导出

```bash
npm run fx -- export cute-creeper-rush          # 完整 MP4
npm run fx -- export cute-creeper-rush --alpha  # ProRes 4444 透明 MOV
```

文件在 `out/fx/fx-export/`。透明 MOV 可叠到剪辑软件上方轨道；仅带透明层的效果支持 `--alpha`。调色等依赖混合模式的效果应在 Remotion 中与素材合成。

整集示例：

```bash
npx remotion render src/lib-entry.tsx lib-example-episode out/example.mp4
```

改文字、物品、配色和时间点：查 [catalog.json](src/lib/catalog.json) 的 props 与示例。[修改或新增效果](docs/开发指南.md)

## 效果画廊

```bash
npm run fx -- previews all
```

生成 `gallery/index.html`，可搜索、分类、播放动画和复制导出命令。首次需要渲染全部预览，耗时较长。

在线版：<https://rinorsi.github.io/Oriel-Video/> · [部署方法](docs/示例库.md)

## 作者与使用

作者：**云诺羲 Rinorsi** · [爱发电](https://afdian.com/a/Rinorsi) · [B 站](https://b23.tv/hjUvs0c)

用这些效果制作视频完全免费，视频可以随意发布、盈利。禁止的只有把本库本身拿去商用，比如转卖、打包进付费产品。许可证：[PolyForm Noncommercial 1.0.0 + 附加许可](LICENSE)。

如方便，可以在视频简介保留「优易库 · 云诺羲 Rinorsi」及本仓库链接，署名不强制。[素材与第三方许可](NOTICE.md)
