// Builds the gallery page (index.html + assets/) from manifest.json. See fx.mjs.
import fs from 'node:fs';
import path from 'node:path';

const CATEGORIES = [
  ['rpg', '地下城风格'],
  ['transition', '转场'],
  ['cute', '可爱转场'],
  ['map', '地图旅程'],
  ['social', '互动关注'],
  ['item', '合成物品'],
  ['info', '信息字幕'],
  ['atmosphere', '氛围层'],
  ['scene', '完整镜头'],
  ['uiref', '界面参考'],
];

const ORE_FILES = ['panel', 'panel_raised', 'panel_glass', 'button_neutral', 'button_neutral_hover', 'button_neutral_pressed', 'button_primary', 'button_primary_hover', 'button_primary_pressed', 'field', 'field_focus', 'slot', 'slot_hover', 'tooltip', 'tooltip_rare', 'track', 'fill_green'];

export function buildGallery({ROOT, GAL, manifest}) {
  fs.mkdirSync(path.join(GAL, 'assets', 'ore'), {recursive: true});
  fs.mkdirSync(path.join(GAL, 'assets', 'fonts'), {recursive: true});
  for (const f of ORE_FILES) fs.copyFileSync(path.join(ROOT, 'public', 'oriel', 'ore', `${f}.png`), path.join(GAL, 'assets', 'ore', `${f}.png`));
  for (const f of ['fusion_pixel_12.ttf', 'fusion_pixel_8.ttf']) fs.copyFileSync(path.join(ROOT, 'public', 'fonts', f), path.join(GAL, 'assets', 'fonts', f));

  const order = (m) => {
    const i = CATEGORIES.findIndex(([k]) => k === m.category);
    return i < 0 ? 99 : i;
  };
  const items = Object.values(manifest)
    .map((m) => ({...m, seconds: +(m.frames / 30).toFixed(1), hasVideo: fs.existsSync(path.join(GAL, 'previews', `${m.id}.mp4`))}))
    .sort((a, b) => order(a) - order(b));

  const data = JSON.stringify({categories: CATEGORIES, items});
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>优易库 · 视频动效画廊</title>
<style>
@font-face{font-family:Px12;src:url(assets/fonts/fusion_pixel_12.ttf)}
@font-face{font-family:Px8;src:url(assets/fonts/fusion_pixel_8.ttf)}
:root{--bg:#131314;--s1:#1c1c1e;--s2:#242426;--s3:#2e2e31;--line:#3a3a3e;--text:#f4f4f5;--dim:#b4b5b9;--faint:#82838a;--green:#6cc349;--green2:#3c8527;--gold:#f8af2b;--purple:#8b5cf6;--r:0}
*{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:#58595d #1c1c1e}
*::-webkit-scrollbar{width:10px;height:10px}
*::-webkit-scrollbar-track{background:#1c1c1e}
*::-webkit-scrollbar-thumb{background:#4b4c50;border:2px solid #1c1c1e}
*::-webkit-scrollbar-thumb:hover{background:var(--green)}
*::-webkit-scrollbar-corner{background:#1c1c1e}
html,body{margin:0;background:var(--bg);color:var(--text);font-family:Px12,"Microsoft YaHei","PingFang SC",system-ui,sans-serif;font-size:16px;line-height:1.5;-webkit-font-smoothing:none}
img,video{image-rendering:pixelated}
button{font:inherit;color:inherit}
.app{min-height:100vh;overflow-x:clip}
/* header */
.top{position:sticky;top:0;z-index:30;background:rgba(19,19,20,.95);backdrop-filter:blur(8px);border-bottom:2px solid var(--line)}
header{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;padding:12px 24px}
header h1{font-size:24px;margin:0;font-weight:400;white-space:nowrap;letter-spacing:.5px}
header h1 b{color:var(--green);font-weight:400}
.search{flex:1 1 280px;max-width:560px;position:relative}
.search input{width:100%;height:40px;background:var(--s1);border:2px solid var(--line);color:var(--text);padding:0 14px 0 40px;font:inherit;font-size:15px;outline:none}
.search input:focus{border-color:var(--green)}
.search input::placeholder{color:var(--faint)}
.search svg{position:absolute;left:12px;top:11px;width:16px;height:16px;fill:none;stroke:var(--faint);stroke-width:2}
.hint{margin-left:auto;color:var(--faint);font-size:14px;white-space:nowrap}
/* layout */
.layout{display:grid;grid-template-columns:248px minmax(0,1fr);gap:24px;padding:20px 24px 48px;align-items:start}
aside{position:sticky;top:var(--top,76px);max-height:calc(100vh - var(--top,76px) - 16px);display:flex;flex-direction:column;gap:18px}
.group{flex:none}
.group.tagsgrp{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding-right:6px}
.fbar{display:none;flex-direction:column;gap:8px;padding:0 14px 10px}
.fcats{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.fcats::-webkit-scrollbar{display:none}
.frow{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.tagpop{display:none;position:absolute;left:0;right:0;top:100%;background:var(--s1);border-bottom:2px solid var(--line);padding:12px 14px;max-height:52vh;overflow-y:auto}
.tagpop.open{display:block}
.active{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}
.active .tag{border-color:var(--gold);color:var(--gold)}
.group h3{margin:0 0 8px;font-size:13px;font-weight:400;color:var(--faint);letter-spacing:1px}
.cats{display:flex;flex-direction:column;gap:4px}
.cat{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;background:transparent;border:2px solid transparent;color:var(--dim);padding:8px 12px;cursor:pointer;white-space:nowrap}
.cat span:first-child{overflow:hidden;text-overflow:ellipsis}
.cat small{font-family:Px8;font-size:12px;color:var(--faint);background:var(--s2);padding:1px 7px;min-width:28px;text-align:center}
.cat:hover{background:var(--s1);color:var(--text)}
.cat.on{background:var(--green2);border-color:var(--green);color:#fff}
.cat.on small{background:rgba(0,0,0,.25);color:#fff}
.tags{display:flex;flex-wrap:wrap;gap:6px}
.tag{background:var(--s1);border:2px solid var(--line);color:var(--dim);font-size:13px;padding:2px 9px;cursor:pointer}
.tag:hover{border-color:var(--faint);color:var(--text)}
.tag.on{border-color:var(--gold);color:var(--gold)}
.toggle{display:flex;align-items:center;gap:10px;cursor:pointer;color:var(--dim);font-size:14px;user-select:none}
.toggle i{width:34px;height:18px;background:var(--s3);border:2px solid var(--line);position:relative;flex:none}
.toggle i::after{content:"";position:absolute;left:1px;top:1px;width:10px;height:10px;background:var(--faint)}
.toggle.on{color:var(--text)}
.toggle.on i{background:var(--green2);border-color:var(--green)}
.toggle.on i::after{left:17px;background:#fff}
.bar{display:flex;align-items:baseline;gap:12px;margin:0 0 14px}
.bar h2{margin:0;font-size:20px;font-weight:400}
.bar span{color:var(--faint);font-size:14px}
/* cards */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px}
.card{background:var(--s1);border:2px solid var(--line);cursor:pointer;display:flex;flex-direction:column;min-width:0;transition:border-color .12s,transform .12s;text-align:left;padding:0}
.card:hover{border-color:var(--green);transform:translateY(-3px)}
.thumb{position:relative;aspect-ratio:16/9;background:#000;overflow:hidden}
.thumb video,.thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.thumb .ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--faint);font-size:14px}
.chips{position:absolute;left:8px;top:8px;display:flex;gap:6px;flex-wrap:wrap;right:8px}
.chip{font-family:Px8;font-size:12px;padding:2px 7px;background:rgba(0,0,0,.72);color:#fff;border:1px solid rgba(255,255,255,.12)}
.chip.a{background:var(--purple)}
.dur{position:absolute;right:8px;bottom:8px;font-family:Px8;font-size:12px;padding:2px 7px;background:rgba(0,0,0,.72)}
.info{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px;min-width:0}
.info h3{margin:0;font-size:18px;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.info p{margin:0;font-size:14px;color:var(--dim);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:42px}
.mini{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:12px;color:var(--faint)}
.empty{padding:80px 20px;text-align:center;color:var(--faint)}
/* modal */
dialog{border:0;padding:0;background:transparent;color:inherit;max-width:none;max-height:none;width:100%;height:100%}
dialog::backdrop{background:rgba(5,5,6,.82)}
.shell{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:20px;z-index:60}
.shell.open{display:flex}
.scrim{position:absolute;inset:0;background:rgba(5,5,6,.84)}
.modal{position:relative;width:min(1120px,100%);max-height:100%;display:flex;flex-direction:column;background:var(--s1);border:2px solid var(--line)}
.mhead{display:flex;align-items:center;gap:14px;padding:12px 16px;border-bottom:2px solid var(--line);flex:none}
.mhead h2{margin:0;font-size:22px;font-weight:400;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mhead .meta{color:var(--faint);font-size:13px;white-space:nowrap}
.iconbtn{background:var(--s3);border:2px solid var(--line);color:var(--text);width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none}
.iconbtn:hover{border-color:var(--green);color:var(--green)}
.mbody{overflow:auto;overscroll-behavior:contain;padding:16px;display:flex;flex-direction:column;gap:16px}
.vwrap{background:#000;border:2px solid #000;display:flex;justify-content:center}
.vwrap video{width:100%;max-height:min(58vh,560px);aspect-ratio:16/9;object-fit:contain;background:#000;display:block}
.cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px}
.cols section{min-width:0}
.cols h4{margin:0 0 4px;font-size:13px;font-weight:400;color:var(--gold);letter-spacing:1px}
.cols p{margin:0 0 14px;color:var(--dim);font-size:15px}
ul.params{margin:0 0 14px;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px}
ul.params li{color:var(--dim);font-size:14px;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
ul.params code{font-family:Consolas,monospace;font-size:13px;color:#cfe8c5;background:var(--s3);padding:0 6px}
.cmds{display:flex;flex-direction:column;gap:8px;margin-bottom:6px}
.cmd{display:flex;gap:8px;align-items:stretch}
.cmd code{flex:1;min-width:0;font:13px/1.5 Consolas,monospace;background:var(--bg);border:2px solid var(--line);padding:6px 10px;color:#cfe8c5;white-space:pre-wrap;word-break:break-all}
.btn{background:var(--green2);border:2px solid var(--green);color:#fff;padding:0 14px;cursor:pointer;font-size:14px;white-space:nowrap}
.btn:hover{background:#4a9a31}
.btn.n{background:var(--s3);border-color:var(--line)}
.btn.n:hover{border-color:var(--green)}
.nav{display:flex;gap:6px}
/* responsive */
@media(max-width:1020px){
  .layout{grid-template-columns:minmax(0,1fr);gap:14px;padding:14px 14px 40px}
  aside{display:none}
  .fbar{display:flex}
  .fcats .cat{width:auto;flex:none;background:var(--s1);border-color:var(--line)}
  header{padding:10px 14px}
  .hint{display:none}
}
@media(max-width:680px){
  .cols{grid-template-columns:minmax(0,1fr)}
  .grid{grid-template-columns:minmax(0,1fr);gap:14px}
  .shell{padding:0}
  .modal{height:100%}
  header h1{font-size:20px}
}
</style></head><body><div class="app">
<div class="top"><header><h1><b>优易库</b> · 视频动效画廊</h1>
<label class="search"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="M15 15l6 6"/></svg><input id="q" placeholder="搜索名称、用途、标签…" autocomplete="off"></label>
<span class="hint" id="count"></span></header>
<div class="fbar"><div class="fcats" id="fcats"></div><div class="frow"><div class="toggle" id="alpha2"><i></i>只看透明层</div><button class="tag" id="tagbtn">标签</button><div class="active" id="active2" style="margin:0"></div></div><div class="tagpop" id="tagpop"><div class="tags" id="tags2"></div></div></div></div>
<div class="layout">
<aside>
 <div class="group"><h3>分类</h3><div class="cats" id="cats"></div></div>
 <div class="group"><h3>筛选</h3><div class="toggle" id="alpha"><i></i>只看带透明层</div></div>
 <div class="group tagsgrp"><h3>标签（可多选）<button id="clr" class="tag" style="margin-left:8px;display:none">清除</button></h3><div class="tags" id="tags"></div></div>
</aside>
<main><div class="bar"><h2 id="title">全部</h2><span id="sub"></span></div><div class="active" id="active"></div><div class="grid" id="grid"></div><div class="empty" id="empty" hidden>没有找到匹配的效果</div></main>
</div></div>
<div class="shell" id="shell"><div class="scrim" id="scrim"></div><div class="modal" id="modal"></div></div>
<script>
const DATA=${data.replace(/</g, '\\u003c')};
const state={cat:'all',tags:[],q:'',alpha:false};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const catName=k=>(DATA.categories.find(c=>c[0]===k)||[0,k])[1];
let shown=[];
function filtered(){const q=state.q.trim().toLowerCase();return DATA.items.filter(m=>(state.cat==='all'||m.category===state.cat)&&(!state.alpha||m.alpha)&&(state.tags.every(t=>m.tags.includes(t)))&&(!q||[m.name,m.blurb,m.usage,m.id,...m.tags].join(' ').toLowerCase().includes(q)))}
function renderSide(){
  const n=c=>DATA.items.filter(m=>(c==='all'||m.category===c)&&(!state.alpha||m.alpha)).length;
  $('#cats').innerHTML=[['all','全部'],...DATA.categories].filter(([k])=>k==='all'||n(k)).map(([k,v])=>'<button class="cat'+(state.cat===k?' on':'')+'" data-c="'+k+'"><span>'+v+'</span><small>'+n(k)+'</small></button>').join('');
  const tc={};DATA.items.filter(m=>(state.cat==='all'||m.category===state.cat)&&(!state.alpha||m.alpha)).forEach(m=>m.tags.forEach(t=>tc[t]=(tc[t]||0)+1));
  state.tags.forEach(t=>{if(!(t in tc))tc[t]=0});
  $('#tags').innerHTML=Object.entries(tc).sort((a,b)=>b[1]-a[1]).slice(0,48).map(([t])=>'<button class="tag'+(state.tags.includes(t)?' on':'')+'" data-t="'+esc(t)+'">'+esc(t)+'</button>').join('');
  const catsHtml=$('#cats').innerHTML;$('#fcats').innerHTML=catsHtml;$('#tags2').innerHTML=$('#tags').innerHTML;
  $('#alpha').classList.toggle('on',state.alpha);$('#alpha2').classList.toggle('on',state.alpha);$('#clr').style.display=state.tags.length?'inline-block':'none';
  const act=state.tags.map(t=>'<button class="tag on" data-rm="'+esc(t)+'">#'+esc(t)+' ✕</button>').join('');$('#active').innerHTML=act;$('#active2').innerHTML=act;
  $('#tagbtn').textContent='标签'+(state.tags.length?' ('+state.tags.length+')':'')+' ▾';
}
function renderGrid(){
  shown=filtered();
  $('#count').textContent=shown.length+' / '+DATA.items.length+' 个效果';
  $('#title').textContent=state.cat==='all'?'全部效果':catName(state.cat);
  $('#sub').textContent=shown.length+' 个'+(state.tags.length?' · '+state.tags.map(t=>'#'+t).join(' '):'');
  $('#empty').hidden=shown.length>0;
  $('#grid').innerHTML=shown.map(m=>'<button class="card" data-id="'+esc(m.id)+'"><div class="thumb">'+(m.hasVideo?'<img src="previews/'+esc(m.id)+'.jpg" alt="" loading="lazy"><video muted loop playsinline preload="none" data-src="previews/'+esc(m.id)+'.mp4"></video>':'<div class="ph">暂无预览</div>')+'<div class="chips"><span class="chip">'+catName(m.category)+'</span>'+(m.alpha?'<span class="chip a">透明层</span>':'')+'</div><span class="dur">'+m.seconds+'s</span></div><div class="info"><h3>'+esc(m.name)+'</h3><p>'+esc(m.blurb)+'</p><div class="mini">'+m.tags.slice(0,4).map(t=>'<span>#'+esc(t)+'</span>').join('')+'</div></div></button>').join('');
}
function refresh(){renderSide();renderGrid()}
$('#grid').addEventListener('mouseover',e=>{const c=e.target.closest('.card');if(!c)return;const v=c.querySelector('video');if(!v)return;if(!v.src)v.src=v.dataset.src;v.play().catch(()=>{})});
$('#grid').addEventListener('mouseout',e=>{const c=e.target.closest('.card');if(!c||c.contains(e.relatedTarget))return;const v=c.querySelector('video');if(v){v.pause();v.currentTime=0}});
$('#grid').addEventListener('click',e=>{const c=e.target.closest('.card');if(c)openModal(c.dataset.id)});
const onCat=e=>{const b=e.target.closest('.cat');if(!b)return;state.cat=b.dataset.c;state.tags=[];refresh();$('#tagpop').classList.remove('open')};
$('#fcats').addEventListener('click',onCat);
const onTag=e=>{const b=e.target.closest('.tag');if(!b||!b.dataset.t)return;const t=b.dataset.t;state.tags=state.tags.includes(t)?state.tags.filter(x=>x!==t):[...state.tags,t];refresh()};
$('#tags2').addEventListener('click',onTag);
$('#alpha2').addEventListener('click',()=>{state.alpha=!state.alpha;refresh()});
$('#tagbtn').addEventListener('click',e=>{e.stopPropagation();$('#tagpop').classList.toggle('open')});
document.addEventListener('click',e=>{if(!e.target.closest('#tagpop'))$('#tagpop').classList.remove('open')});
const onRm=e=>{const b=e.target.closest('[data-rm]');if(!b)return;state.tags=state.tags.filter(x=>x!==b.dataset.rm);refresh()};
$('#active').addEventListener('click',onRm);$('#active2').addEventListener('click',onRm);
const topEl=document.querySelector('.top');const setTop=()=>document.documentElement.style.setProperty('--top',(topEl.offsetHeight+12)+'px');new ResizeObserver(setTop).observe(topEl);setTop();
$('#cats').addEventListener('click',e=>{const b=e.target.closest('.cat');if(!b)return;state.cat=b.dataset.c;state.tags=[];refresh()});
$('#tags').addEventListener('click',e=>{const b=e.target.closest('.tag');if(!b)return;const t=b.dataset.t;state.tags=state.tags.includes(t)?state.tags.filter(x=>x!==t):[...state.tags,t];refresh()});
$('#clr').addEventListener('click',()=>{state.tags=[];refresh()});
$('#alpha').addEventListener('click',()=>{state.alpha=!state.alpha;refresh()});
$('#q').addEventListener('input',e=>{state.q=e.target.value;renderGrid()});
function copy(btn,text){navigator.clipboard.writeText(text).then(()=>{const o=btn.textContent;btn.textContent='已复制';setTimeout(()=>btn.textContent=o,1200)}).catch(()=>{})}
let cur=null;
function openModal(id){
  const m=DATA.items.find(x=>x.id===id);if(!m)return;cur=id;history.replaceState(null,'','#'+id);
  const c1='npm run fx -- export '+m.id,c2=c1+' --alpha';
  $('#modal').innerHTML=
   '<div class="mhead"><h2>'+esc(m.name)+'</h2><span class="meta">'+catName(m.category)+' · '+m.seconds+' 秒 · '+m.frames+' 帧'+(m.alpha?' · 带透明层':'')+'</span><div class="nav"><button class="iconbtn" data-nav="-1" title="上一个 ←">‹</button><button class="iconbtn" data-nav="1" title="下一个 →">›</button><button class="iconbtn" id="x" title="关闭 Esc">✕</button></div></div>'+
   '<div class="mbody"><div class="vwrap">'+(m.hasVideo?'<video src="previews/'+esc(m.id)+'.mp4" controls autoplay loop muted playsinline></video>':'<div class="empty">暂无预览</div>')+'</div>'+
   '<div class="cols"><section><h4>效果</h4><p>'+esc(m.blurb)+'</p><h4>用在哪</h4><p>'+esc(m.usage)+'</p><h4>标签</h4><div class="tags">'+m.tags.map(t=>'<span class="tag" style="cursor:default">#'+esc(t)+'</span>').join('')+'</div></section>'+
   '<section>'+(m.params&&m.params.length?'<h4>可调参数</h4><ul class="params">'+m.params.map(p=>'<li><code>'+esc(p.name)+'</code><span>'+esc(p.desc)+'</span></li>').join('')+'</ul>':'')+
   '<h4>导出成片（在 video/ 目录运行）</h4><div class="cmds"><div class="cmd"><code>'+esc(c1)+'</code><button class="btn n" data-copy="'+esc(c1)+'">复制</button></div>'+(m.alpha?'<div class="cmd"><code>'+esc(c2)+'</code><button class="btn n" data-copy="'+esc(c2)+'">复制</button></div>':'')+'</div>'+
   '<h4>Remotion 里直接用</h4><p>组合 id：<code style="font-family:Consolas,monospace;color:#cfe8c5">fx-'+esc(m.id)+'</code>'+(m.alpha?'；透明层：<code style="font-family:Consolas,monospace;color:#cfe8c5">fx-'+esc(m.id)+'-alpha</code>':'')+'</p></section></div></div>';
  $('#shell').classList.add('open');document.body.style.overflow='hidden';
}
function closeModal(){$('#shell').classList.remove('open');document.body.style.overflow='';const v=$('#modal video');if(v)v.pause();history.replaceState(null,'','#');cur=null}
function step(d){if(!cur)return;const i=shown.findIndex(x=>x.id===cur);if(i<0)return;const n=shown[(i+d+shown.length)%shown.length];openModal(n.id)}
$('#modal').addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(b){copy(b,b.dataset.copy);return}const n=e.target.closest('[data-nav]');if(n){step(+n.dataset.nav);return}if(e.target.closest('#x'))closeModal()});
$('#scrim').addEventListener('click',closeModal);
addEventListener('keydown',e=>{if(!cur)return;if(e.key==='Escape')closeModal();else if(e.key==='ArrowLeft')step(-1);else if(e.key==='ArrowRight')step(1)});
refresh();
if(location.hash.length>1)openModal(decodeURIComponent(location.hash.slice(1)));
</script></body></html>`;
  fs.writeFileSync(path.join(GAL, 'index.html'), html);
}
