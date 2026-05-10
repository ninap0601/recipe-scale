// ═══════════════════════════════════════
// 智能菜谱秤 - 前端界面
// 托管在GitHub Pages，所有改动只改这个文件
// ═══════════════════════════════════════

(function(){
const RECIPE_URL='https://ninap0601.github.io/recipe-scale/recipes.json';
const API=window.SCALE_ORIGIN||'';

// ── 注入CSS ──
const style=document.createElement('style');
style.textContent=`
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#1a1a2e;color:#e8e8e8;max-width:420px;margin:0 auto;min-height:100vh;display:block!important;align-items:initial!important;justify-content:initial!important;text-align:left!important}
.hd{padding:12px 16px;border-bottom:2px solid #333;display:flex;justify-content:space-between;align-items:center}
.b{background:#2d2d44;border:2px solid #444;color:#e8e8e8;padding:8px 14px;border-radius:4px;font-size:16px;cursor:pointer}
.bp{background:#ff6b35;border-color:#ff8c42;color:#1a1a2e;font-weight:bold}
.bg{background:#2ecc71;border-color:#27ae60;color:#1a1a2e;font-weight:bold}
.c{background:#16213e;border:2px solid #333;border-radius:6px;padding:14px;margin:8px 16px}
.wb{background:#0a0a1a;border:3px solid #333;border-radius:8px;padding:20px;text-align:center;margin:12px 16px}
.wn{font-size:48px;font-weight:bold;color:#ffd166;font-family:'Courier New',monospace}
.bar{height:6px;background:#222;border-radius:3px;margin:8px 0;overflow:hidden}
.bf{height:100%;background:#ffd166;border-radius:3px;transition:width .3s}
.sc{background:#0a0a1a;border:2px solid #ff6b35;border-radius:8px;padding:16px;margin:12px 16px}
.tm{font-size:36px;font-family:'Courier New';color:#ffd166;text-align:center}
.warn{background:#2d1810;border:2px solid #ff6b35;border-radius:6px;padding:12px;margin:8px 16px}
h3{font-size:13px;color:#ff6b35;padding:0 16px;margin:8px 0}
.hidden{display:none}
.fire{display:flex;align-items:flex-end;gap:2px;height:30px;justify-content:center}
.fl{width:5px;border-radius:2px 2px 0 0;animation:fk .3s infinite alternate}
@keyframes fk{0%{opacity:.7}100%{opacity:1}}
.page{display:none}.page.active{display:block}
`;
document.head.appendChild(style);

// ── 状态 ──
let recipes=[],R=null,bw=0,si=0,ci=0,tmr=0,tmrT=0,tmrR=false,paused=false,cw=0;

// ── 工具 ──
function $(id){return document.getElementById(id);}
function show(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');}
function speak(t){if(!t||!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='zh-CN';u.rate=.9;speechSynthesis.speak(u);}
function fmt(s){return Math.floor(s/60)+':'+(s%60<10?'0':'')+(s%60);}

// ── 构建HTML ──
document.body.innerHTML=`

<div class="page" id="pg-home">
  <div class="hd"><span style="color:#ff6b35;font-size:14px">🍳 智能菜谱秤</span><span style="font-size:11px;color:#555" id="ver"></span></div>
  <div class="wb">
    <div class="wn" id="w0">0.0<span style="font-size:18px;color:#888">g</span></div>
    <p style="font-size:12px;color:#555;margin-top:4px">实时重量</p>
    <button class="b" style="width:80%;margin-top:8px" onclick="doTare()">归零</button>
  </div>
  <h3>▸ 菜谱</h3>
  <div id="rl"></div>
</div>

<div class="page" id="pg-prep">
  <div class="hd"><button class="b" onclick="goHome()">← 返回</button><span style="font-size:13px" id="pt"></span></div>
  <div id="pw"></div><div id="pl"></div>
  <div style="padding:16px"><button class="b bp" style="width:100%;padding:12px;font-size:18px" onclick="goMain()">都准备好了 →</button></div>
</div>

<div class="page" id="pg-main">
  <div class="hd"><button class="b" onclick="goPrep()">← 备料</button><span style="font-size:13px">⚖️ 称主料</span></div>
  <div style="padding:16px;text-align:center"><p style="color:#ffd166;font-size:16px;margin-bottom:4px">📦 放上主料</p><p style="font-size:14px;color:#888" id="mh"></p></div>
  <div class="wb" style="border-color:#ff6b35">
    <div class="wn" id="wm">0.0<span style="font-size:18px;color:#888">g</span></div>
    <p style="font-size:13px;color:#888;margin-top:4px" id="ms"></p>
    <button class="b" style="width:60%;margin-top:8px" onclick="doTare()">归零</button>
  </div>
  <div id="mc" class="hidden" style="padding:0 16px"><div class="c" style="margin:0;cursor:default" id="ml"></div><button class="b bp" style="width:100%;margin-top:12px;padding:12px;font-size:18px" onclick="goS()">确认，开始称调料 →</button></div>
  <div style="padding:16px"><button class="b" style="width:100%" onclick="speak('把'+R.base.name+'放在秤上')">🔊 再说一遍</button></div>
</div>

<div class="page" id="pg-s">
  <div class="hd"><button class="b" onclick="goMain()">←</button><span style="font-size:12px;color:#888" id="sp"></span></div>
  <div class="c" id="si2" style="cursor:default"></div>
  <div class="wb">
    <div class="wn" id="ws2">0.0<span style="font-size:18px;color:#888">g</span></div>
    <div id="wst" style="font-size:13px;color:#888;margin:4px 0"></div>
    <div class="bar"><div class="bf" id="sb"></div></div>
    <div id="wss" style="font-size:14px;margin-top:4px"></div>
    <button class="b" style="width:60%;margin-top:8px" onclick="doTare()">归零</button>
  </div>
  <div style="padding:0 16px">
    <button class="b bg hidden" id="bsn" style="width:100%;padding:12px;font-size:16px" onclick="sN()">✓ 好了，下一个</button>
    <button class="b" style="width:100%;margin-top:8px" onclick="speak(sSpk())">🔊 再说一遍</button>
  </div>
</div>

<div class="page" id="pg-cook">
  <div class="hd"><button class="b" id="bpp" onclick="tP()">⏸ 暂停</button><span style="font-size:12px;color:#888" id="cp2"></span><button class="b" onclick="goHome()">✕</button></div>
  <div style="height:4px;background:#333"><div id="cb2" style="height:100%;background:linear-gradient(90deg,#ff6b35,#ffd166);transition:width .5s"></div></div>
  <div id="fd" style="display:flex;justify-content:center;gap:20px;padding:12px 0"></div>
  <div class="sc"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:12px;color:#ff6b35" id="cl2"></span><span style="font-size:11px;color:#888" id="cs2"></span></div><p style="font-size:18px;line-height:1.5" id="ctt"></p></div>
  <div id="tb" class="hidden" style="text-align:center;padding:12px 16px"><p style="font-size:12px;color:#888" id="tl2"></p><div class="tm" id="tn2"></div><div class="bar"><div class="bf" id="tb2"></div></div></div>
  <div style="padding:8px 16px;display:flex;gap:8px"><button class="b" style="flex:1;font-size:14px" onclick="speakStep()">🔊</button><button class="b" style="flex:1;font-size:14px" onclick="cP()">←</button><button class="b bp" style="flex:1;font-size:14px" onclick="cN()">下一步 →</button></div>
  <div style="margin:8px 16px" id="csl"></div>
</div>

<div class="page" id="pg-done">
  <div style="padding:60px 20px;text-align:center"><div style="font-size:60px;margin-bottom:16px">🎉</div><p style="font-size:20px;color:#2ecc71;font-weight:bold;margin-bottom:8px">做好啦！</p><p style="font-size:18px;margin-bottom:30px" id="dn"></p><button class="b bp" style="padding:12px 32px;font-size:16px" onclick="goHome()">再做一个</button></div>
</div>
`;

// ── 归零 ──
window.doTare=function(){fetch(API+'/tare').then(()=>{cw=0;}).catch(()=>{});};

// ── 加载菜谱 ──
async function loadRecipes(){
  try{const r=await fetch(RECIPE_URL+'?t='+Date.now());recipes=await r.json();}
  catch(e){recipes=[{name:'酱油鸡丁',icon:'🍗',base:{name:'鸡胸肉',amount:300,unit:'g'},warns:['冷冻鸡肉提前2小时解冻'],ingredients:['鸡胸肉（切丁）','姜（切丝）','蒜（切末）'],tools:['砧板和刀','腌肉碗','调料碗','炒锅'],seasonings:[{name:'生抽',r:.05,unit:'ml'},{name:'料酒',r:.033,unit:'ml'},{name:'淀粉',r:.02,unit:'g'},{name:'蚝油',r:.033,unit:'ml'},{name:'白糖',r:.01,unit:'g'}],cook:[{text:'腌料倒入鸡丁抓匀',fire:'off',timer:900,label:'腌制',speak:'把腌料倒进鸡丁碗抓匀，腌15分钟。'},{text:'中火热锅倒油',fire:'medium',timer:20,label:'热油',speak:'开中火，倒油，等微微冒烟。'},{text:'放姜蒜爆香',fire:'medium',timer:15,label:'爆香',speak:'放入姜蒜翻炒。'},{text:'鸡丁大火翻炒',fire:'large',timer:120,label:'炒鸡丁',speak:'鸡丁倒进去大火快炒到变白。'},{text:'倒酱汁中火翻炒',fire:'medium',timer:30,label:'收汁',speak:'酱汁倒进去中火翻匀。'},{text:'关火出锅',fire:'off',timer:0,label:'',speak:'关火盛盘，做好了！'}]}];}
  goHome();
}

// ── 称重轮询 ──
async function poll(){
  try{const r=await fetch(API+'/w');const j=await r.json();cw=j.w;}catch(e){}
  if($('w0'))$('w0').innerHTML=cw.toFixed(1)+'<span style="font-size:18px;color:#888">g</span>';
  if($('pg-main')&&$('pg-main').classList.contains('active'))updM();
  if($('pg-s')&&$('pg-s').classList.contains('active'))updS();
  setTimeout(poll,400);
}

// ── 首页 ──
window.goHome=function(){R=null;show('pg-home');$('ver').textContent=recipes.length+'道菜谱';
  let h='';recipes.forEach((r,i)=>{h+='<div class="c" style="cursor:pointer" onclick="startR('+i+')"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">'+(r.icon||'🍳')+'</span><div><div style="font-weight:bold">'+r.name+'</div><div style="color:#888;font-size:13px">'+r.base.name+' '+r.base.amount+r.base.unit+' · '+r.cook.length+'步</div></div></div></div>';});
  $('rl').innerHTML=h;};
window.startR=function(i){R=recipes[i];goPrep();};

// ── 备料 ──
window.goPrep=function(){show('pg-prep');$('pt').textContent=(R.icon||'🍳')+' '+R.name;
  let w='';if(R.warns&&R.warns.length)R.warns.forEach(t=>{w+='<div class="warn"><p style="color:#ffd166;font-size:14px">⚠️ '+t+'</p></div>';});$('pw').innerHTML=w;
  let h='';
  if(R.ingredients&&R.ingredients.length){h+='<div class="c" style="cursor:default"><p style="font-size:13px;color:#888;margin-bottom:8px">🥩 食材</p>';R.ingredients.forEach(i=>{h+='<p style="font-size:14px;padding:3px 0">○ '+i+'</p>';});h+='</div>';}
  if(R.seasonings&&R.seasonings.length){h+='<div class="c" style="cursor:default"><p style="font-size:13px;color:#888;margin-bottom:8px">🧂 调料</p>';R.seasonings.forEach(s=>{h+='<p style="font-size:14px;padding:3px 0">○ '+s.name+'</p>';});h+='</div>';}
  if(R.tools&&R.tools.length){h+='<div class="c" style="cursor:default"><p style="font-size:13px;color:#888;margin-bottom:8px">🔧 工具</p>';R.tools.forEach(t=>{h+='<p style="font-size:14px;padding:3px 0">○ '+t+'</p>';});h+='</div>';}
  h+='<div class="c" style="cursor:default;background:#0a0a1a"><p style="font-size:13px;color:#888">💡 全部摆在手边再开始</p></div>';
  $('pl').innerHTML=h;};

// ── 称主料 ──
window.goMain=function(){show('pg-main');bw=0;$('mh').textContent='把'+R.base.name+'放在秤上（参考量 '+R.base.amount+R.base.unit+'）';$('mc').classList.add('hidden');speak('把碗放在秤上，装入'+R.base.name);};
function updM(){$('wm').innerHTML=cw.toFixed(1)+'<span style="font-size:18px;color:#888">g</span>';
  if(cw>5){bw=cw;$('ms').textContent='检测到 '+cw.toFixed(1)+R.base.unit;
    let h='<p style="font-size:12px;color:#888;margin-bottom:8px">按 '+cw.toFixed(1)+R.base.unit+' 换算</p>';
    R.seasonings.forEach(s=>{h+='<div style="display:flex;justify-content:space-between;padding:3px 0"><span style="font-size:14px">'+s.name+'</span><span style="color:#ffd166;font-family:monospace">'+(Math.round(cw*s.r*10)/10)+' '+s.unit+'</span></div>';});
    $('ml').innerHTML=h;$('mc').classList.remove('hidden');
  }else{$('ms').textContent='等待放入...';$('mc').classList.add('hidden');}}

// ── 称调料 ──
window.goS=function(){si=0;show('pg-s');updSS();};
function gc(){return R.seasonings.map(s=>({...s,val:Math.round(bw*s.r*10)/10}));}
window.sSpk=function(){const s=gc()[si];return'添加'+s.name+'，'+s.val+s.unit;};
function updSS(){const items=gc(),s=items[si];$('sp').textContent='调料 '+(si+1)+'/'+items.length;
  let h='<p style="color:#ffd166;font-weight:bold;margin-bottom:4px">🧂 调料 '+(si+1)+'/'+items.length+'</p><p style="font-size:18px">请添加 <span style="color:#ff6b35;font-weight:bold">'+s.name+'</span></p>';
  h+='<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">';items.forEach((g,i)=>{h+='<span style="display:inline-block;font-size:12px;padding:2px 8px;border-radius:10px;background:'+(i===si?'#ff6b35':'#2d2d44')+';color:'+(i===si?'#1a1a2e':(i<si?'#2ecc71':'#888'))+'">'+(i<si?'✓ ':'')+g.name+'</span>';});h+='</div>';
  $('si2').innerHTML=h;$('wst').textContent='/ '+s.val.toFixed(1)+' '+s.unit;speak(sSpk());}
function updS(){const items=gc();if(si>=items.length)return;const s=items[si];
  $('ws2').innerHTML=cw.toFixed(1)+'<span style="font-size:18px;color:#888">g</span>';
  const pct=Math.min(cw/s.val*100,100),close=Math.abs(cw-s.val)<=Math.max(s.val*.03,.3)&&cw>0,over=cw>s.val*1.05,color=close?'#2ecc71':over?'#ff4500':'#ffd166';
  $('sb').style.width=pct+'%';$('sb').style.background=color;$('wss').style.color=color;
  $('wss').textContent=cw===0?'等待放入...':close?'✓ 到了！':over?'多了！':'还差 '+(s.val-cw).toFixed(1)+' '+s.unit;
  if(close)$('bsn').classList.remove('hidden');else $('bsn').classList.add('hidden');}
window.sN=function(){if(si<gc().length-1){si++;updSS();}else{show('pg-cook');ci=0;startC();}};

// ── 做饭 ──
function mkF(l){if(l==='off')return'<span style="font-size:12px;color:#555">无需开火</span>';const c={small:['#ff8c42','#ffd166'],medium:['#ff4500','#ff6b35'],large:['#cc0000','#ff4500']},h={small:[10,16,12],medium:[16,24,18],large:[24,36,30]};const cc=c[l]||c.medium,hh=h[l]||h.medium;let s='<div class="fire">';hh.forEach((v,i)=>{s+='<div class="fl" style="height:'+v+'px;background:'+cc[i%cc.length]+'"></div>';});return s+'</div>';}

function startC(){const s=R.cook[ci];
  $('cp2').textContent=(ci+1)+'/'+R.cook.length;$('cb2').style.width=(ci/R.cook.length*100)+'%';
  $('fd').innerHTML=mkF(s.fire);$('cl2').textContent='STEP '+(ci+1);$('ctt').textContent=s.text;$('cs2').textContent='';
  if(s.timer>0){$('tb').classList.remove('hidden');$('tl2').textContent=s.label;tmr=s.timer;tmrT=s.timer;tmrR=false;$('tn2').textContent=fmt(s.timer);$('tb2').style.width='100%';}else $('tb').classList.add('hidden');
  let sl='';R.cook.forEach((x,i)=>{sl+='<div style="padding:5px 10px;border-radius:4px;display:flex;align-items:center;gap:8px;font-size:13px;color:'+(i===ci?'#e8e8e8':'#666')+';background:'+(i===ci?'#2d2d44':'transparent')+';opacity:'+(i<ci?'.4':'1')+';cursor:pointer" onclick="jC('+i+')"><span style="color:'+(i<ci?'#2ecc71':i===ci?'#ff6b35':'#555')+'">'+(i<ci?'✓':(i+1))+'</span><span>'+x.text.substring(0,24)+'</span></div>';});
  $('csl').innerHTML=sl;speak(s.speak);
  if(s.timer>0)setTimeout(()=>{if(!paused){tmrR=true;runT();}},2500);}

function runT(){if(!tmrR||paused)return;if(tmr>0){tmr--;$('tn2').textContent=fmt(tmr);$('tb2').style.width=(tmr/tmrT*100)+'%';$('tn2').style.color=tmr<=10?'#ff4500':'#ffd166';setTimeout(runT,1000);}
  else{tmrR=false;if(ci<R.cook.length-1){ci++;startC();}else{speak('做好了，开吃吧！');$('dn').textContent=(R.icon||'🍳')+' '+R.name;show('pg-done');}}}

window.speakStep=function(){if(R&&R.cook[ci])speak(R.cook[ci].speak);};
window.cN=function(){tmrR=false;if(ci<R.cook.length-1){ci++;startC();}else{speak('做好了，开吃吧！');$('dn').textContent=(R.icon||'🍳')+' '+R.name;show('pg-done');}};
window.cP=function(){if(ci>0){tmrR=false;ci--;startC();}};
window.jC=function(i){tmrR=false;ci=i;startC();};
window.tP=function(){paused=!paused;$('bpp').textContent=paused?'▶ 继续':'⏸ 暂停';$('bpp').style.background=paused?'#ff6b35':'#2d2d44';if(!paused&&tmr>0){tmrR=true;runT();}};

// ── 启动 ──
loadRecipes();
poll();

})();
