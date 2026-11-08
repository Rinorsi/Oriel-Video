// Library exports for the classicOthers group: non-transition classic effects.
// Implementation lives in ./classicOthers/<area>.tsx (map | social | item | info | atmo); this file is the public entry
// (src/lib/index.ts re-exports it). Value exports are listed explicitly so `npm run catalog` can verify them; types come via `export *`.
//
//   map     Map*   整屏地图旅程场景（overlayReady:false）+ MapPinPop 透明图钉层
//   social  Soc*   互动关注：点赞/关注/投币/收藏/三连/小铃铛/弹幕/分享/角落关注/粉丝里程碑（透明全屏叠加层）
//   item    Item*  合成物品：合成/熔炼/锻造/附魔/酿造/掉落/拾取/升级链/稀有度/战利品/整理背包（bg 默认 false）
//   info    Info*  信息字幕：章节卡/下三分之一/成就提示/属性条/对比/排行榜/倒计时/坐标/配方/对话字幕/片尾
//   atmo    Atm*   氛围层：暗角/聚光/黑边/震屏/闪光/受伤/光斑/复古胶片/速度线/碎屑/经验球/萤火/雨/雪/雷/昼夜
export {MapJourney, MapRouteA2B, MapRouteChain, MapRouteMinecart, MapRouteHorse, MapRoutePearl, MapRouteElytra, MapRouteBoat, MapHome, MapRespawn, MapPinPop, MapFlatModern} from './classicOthers/map';
export * from './classicOthers/map';

export {SocLike, SocFollow, SocCoin, SocFavorite, SocTriple, SocBell, SocDanmaku, SocShare, SocFollowCorner, SocMilestone} from './classicOthers/social';
export * from './classicOthers/social';

export {ItemCraft, ItemFurnace, ItemSmithing, ItemEnchant, ItemBrew, ItemDropBounce, ItemPickup, ItemUpgradeChain, ItemRarityShowcase, ItemChestLoot, ItemInventorySort} from './classicOthers/item';
export * from './classicOthers/item';

export {InfoChapterOre, InfoChapterStone, InfoChapterFlat, InfoLowerThirdOre, InfoLowerThirdCute, InfoAdvancementToasts, InfoStatBars, InfoCompareBars, InfoLeaderboard, InfoCountdownBig, InfoCoordTags, InfoIngredientList, InfoDialogSubtitle, InfoCreditsRoll, infoFrames} from './classicOthers/info';
export * from './classicOthers/info';

export {AtmVignetteClose, AtmVignetteBreathe, AtmSpotlight, AtmLetterbox, AtmShake, AtmShakeDust, AtmFlash, AtmHurt, AtmLensFlare, AtmRetroFilm, AtmRetroFilmWrap, AtmSpeedLines, AtmBlockDebris, AtmXpOrbs, AtmFireflies, AtmRain, AtmSnow, AtmThunder, AtmDayNight} from './classicOthers/atmo';
export * from './classicOthers/atmo';
