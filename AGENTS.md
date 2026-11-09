# 优易库 Agent 入口

这是 Remotion 视频动画库。先读 docs/AI使用手册.md，按 src/lib/catalog.json 查参数，按 docs/开发指南.md 修改源码。

- 做视频：从 src/lib 引用组件；src/lib/examples/episode.tsx 是整集示例。npm run dev 预览库示例，npm run dev:gallery 预览全部展示效果。
- 素材准备：npm ci → npm run setup。自定义游戏目录使用 --minecraft；只给 --jar 仍需本机完整音效资源。
- 修改效果：公开接口在 src/lib/；底层实现可能在 src/gallery/fx/，不能删掉后者。不是每个展示效果都有稳定库接口，也不是所有位置都支持 props。
- 每次改能力同步目录、示例和手册。npm run catalog、npm run typecheck；涉及画面时渲染并亲自查看代表帧，涉及声音时验证音轨。
- 生成物放 out/ 或 gallery/；不提交录屏、原版资源、音乐、node_modules、日志或本地路径。不要自动复制其他工程或其他 Skill 的素材。
- 源码与下载包的第三方声明见 NOTICE.md。视频署名可选，不自行往用户作品中添加署名。
- 发布网站、推送仓库与上传 Skill 按用户当次授权执行；本地打包不等于已经发布。
