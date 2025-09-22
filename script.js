/* ===== Sidebar toggle + TikTok modal ===== */
function openTikTokModal(){ const m=document.getElementById('tt-modal'); if(m) m.style.display='flex'; }
function closeTikTokModal(){ const m=document.getElementById('tt-modal'); if(m) m.style.display='none'; }
document.addEventListener('DOMContentLoaded',()=>{
  const burger=document.getElementById('burger');
  const sidebar=document.getElementById('sidebar');
  if(burger && sidebar){
    burger.addEventListener('click',()=> {
      sidebar.style.display=(sidebar.style.display==='block'?'none':'block');
    });
  }
});

/* ===== Stats counter ===== */
function countUp(el,target){
  let val=0; const step=Math.ceil(target/60)||1;
  function tick(){ val+=step; if(val>=target) val=target;
    const isPct = el.getAttribute('data-count')?.includes('%');
    el.textContent = isPct ? (val+'%') : (val+'+');
    if(val<target) requestAnimationFrame(tick);
  }
  tick();
}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.stat h2').forEach(h=>{
    const t=parseInt(h.dataset.count||'0',10);
    if(t>0) countUp(h,t);
  });
});

/* ===== Sidebar shake (first load) ===== */
document.addEventListener('DOMContentLoaded',()=>{
  const sb=document.getElementById('sidebar');
  const burger=document.getElementById('burger');
  setTimeout(()=>{
    sb?.classList.add('shake'); burger?.classList.add('shake');
    setTimeout(()=>{ sb?.classList.remove('shake'); burger?.classList.remove('shake'); },1500);
  },1200);
});

/* ===== Helpers ===== */
async function head(url){
  try{ const r=await fetch(url,{method:'HEAD'}); return r.ok; }catch{ return false; }
}
function byId(id){ return document.getElementById(id); }

/* ===== Live Profits Ticker (slim, always moving) ===== */
function initTicker(){
  const shell=byId('live-ticker'); const track=byId('ticker-track');
  if(!shell || !track) return;
  const names=["Ava","Noah","Liam","Mia","Ethan","Zoe","Lucas","Aria","Mason","Grace","Caleb","Riley","Elijah","Nora","Jacob","Lily"];
  const randAmt=()=> Math.floor(50 + Math.random()*950);
  const item = () => `💰 ${names[Math.floor(Math.random()*names.length)]} +$${randAmt()} just now`;
  function refill(){
    track.innerHTML='';
    for(let i=0;i<2;i++){ const span=document.createElement('span'); span.className='ticker-item'; span.textContent=item(); track.appendChild(span); }
  }
  refill();
  // Swap messages every 10s so text changes while CSS animation runs
  setInterval(refill, 10000);
}
document.addEventListener('DOMContentLoaded', initTicker);

/* ===== Carousel factory (Lifestyle / Profits / Charts) ===== */
async function buildCarousel(folder, base, exts, shellId, dotsId){
  const shell = byId(shellId); const dots = byId(dotsId);
  if(!shell) return;
  let i=1, imgs=[];
  while(true){
    let found=false;
    for(const e of exts){
      const url=`${folder}/${base}${i}.${e}`;
      if(await head(url)){ imgs.push(url); found=true; break; }
    }
    if(!found) break; i++;
  }
  if(imgs.length===0){
    shell.innerHTML='<div style="color:#fff;display:flex;justify-content:center;align-items:center;height:100%;">No images yet</div>';
    return;
  }
  let idx=0;
  const imgEl=document.createElement('img'); imgEl.src=imgs[0];
  shell.prepend(imgEl);

  if(dots){
    dots.innerHTML='';
    imgs.forEach((_,k)=>{ const d=document.createElement('div'); d.className='dot'+(k===0?' active':''); dots.appendChild(d); });
  }
  function step(){
    idx=(idx+1)%imgs.length;
    imgEl.src=imgs[idx];
    if(dots){
      [...dots.children].forEach((d,k)=> d.classList.toggle('active', k===idx));
    }
  }
  setInterval(step, 4000);
}

/* Lifestyle carousel */
document.addEventListener('DOMContentLoaded',()=>{
  buildCarousel('Lifestyle','life',['jpeg','jpg','png','webp'],'lifestyle-carousel','lifestyle-dots');
});

/* Profit snapshots carousel */
document.addEventListener('DOMContentLoaded',()=>{
  buildCarousel('Images','img',['jpeg','jpg','png','webp'],'profit-carousel','profit-dots');
});

/* Charts carousel */
document.addEventListener('DOMContentLoaded',()=>{
  buildCarousel('Charts','chart',['jpeg','jpg','png','webp'],'charts-carousel','charts-dots');
});

/* ===== Chart Video (single file) ===== */
document.addEventListener('DOMContentLoaded', async()=>{
  const v=byId('video-grid'); if(!v) return;
  const url='ChartVideo/monitor1.mov';
  if(await head(url)){
    const vid=document.createElement('video');
    vid.src=url; vid.controls=true; vid.autoplay=true; vid.loop=true; vid.style.maxWidth='100%'; vid.style.borderRadius='12px';
    v.appendChild(vid);
  }
});

/* ===== Watchlist (with graceful fallback) ===== */
function mockQuote(symbol){
  const px = (50 + Math.random()*450).toFixed(2);
  const chg = (Math.random()*4 - 2).toFixed(2); // -2%..+2%
  return { symbol, price:px, percent_change:chg };
}
async function tdQuote(symbol){
  const key = (window.CONFIG&&CONFIG.API_KEY)||'';
  if(!key) throw new Error('API key missing');
  const url=`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
  const r=await fetch(url);
  const txt=await r.text();
  let j; try{ j=JSON.parse(txt); }catch(e){ throw new Error('Bad API response'); }
  if(j.status==='error' || !j.symbol) throw new Error(j.message||'API error');
  return j;
}
function watchTile(q){
  const d=document.createElement('div'); d.className='tile';
  const chg=parseFloat(q.percent_change??0);
  if(!isNaN(chg)) d.classList.add(chg>=0?'up':'down');
  d.innerHTML=`<div class="sym">${q.symbol}</div>
               <div class="px">$${Number(q.price).toFixed(2)}</div>
               <div class="chg">${chg>=0?'▲':'▼'} ${Math.abs(chg).toFixed(2)}%</div>`;
  return d;
}
async function initWatchlist(){
  const grid=byId('watchlist-grid'); const input=byId('watchlist-input'); const add=byId('watchlist-add'); const status=byId('watchlist-status');
  if(!grid||!input||!add){ return; }

  let list; try{ list=JSON.parse(localStorage.getItem('otu_watchlist')||'[]'); }catch{ list=[]; }
  if(list.length===0){ list=["AAPL","MSFT","TSLA","NVDA","SPY"]; localStorage.setItem('otu_watchlist',JSON.stringify(list)); }

  async function refresh(){
    grid.innerHTML=''; if(status) status.textContent='Loading...';
    for(const sym of list){
      try{
        let q;
        try { q = await tdQuote(sym); }
        catch(e){ q = mockQuote(sym); } // fallback so it never looks empty
        grid.appendChild(watchTile(q));
      }catch{
        const t=document.createElement('div'); t.className='tile'; t.textContent=sym+' — failed'; grid.appendChild(t);
      }
    }
    if(status) status.textContent = 'Quotes refresh every ~60s. Using live data when available.';
  }

  add.addEventListener('click', async()=>{
    const sym=(input.value||'').trim().toUpperCase();
    if(sym && !list.includes(sym)){ list.push(sym); localStorage.setItem('otu_watchlist',JSON.stringify(list)); await refresh(); }
    input.value='';
  });

  await refresh();
  setInterval(refresh,60000);
}
document.addEventListener('DOMContentLoaded', initWatchlist);

/* ===== JSON-driven content (if you use these pages) ===== */
async function loadJSON(url){ try{ const r=await fetch(url); return await r.json(); }catch{ return []; } }
async function loadModules(){
  const list=byId('modules-list'); if(!list) return;
  const data=await loadJSON((window.CONFIG&&CONFIG.MODULES)||'data/modules.json');
  data.forEach(m=>{
    const item=document.createElement('div'); item.className='accordion';
    item.innerHTML=`<div class="acc-head">${m.title}</div><div class="acc-body">${m.content}</div>`;
    item.querySelector('.acc-head').addEventListener('click',()=> item.classList.toggle('open'));
    list.appendChild(item);
  });
}
document.addEventListener('DOMContentLoaded', loadModules);

async function loadGlossary(){
  const acc=byId('glossary-acc'); if(!acc) return;
  const data=await loadJSON((window.CONFIG&&CONFIG.GLOSSARY)||'data/glossary.json');
  data.forEach(g=>{
    const item=document.createElement('div'); item.className='accordion';
    item.innerHTML=`<div class="acc-head">${g.term}</div><div class="acc-body">${g.definition}</div>`;
    item.querySelector('.acc-head').addEventListener('click',()=> item.classList.toggle('open'));
    acc.appendChild(item);
  });
}
document.addEventListener('DOMContentLoaded', loadGlossary);

async function loadTestimonials(){
  const box=byId('testi'); if(!box) return;
  const data=await loadJSON((window.CONFIG&&CONFIG.TESTIMONIALS)||'data/testimonials.json');
  data.forEach(t=>{
    const card=document.createElement('div'); card.className='card';
    card.innerHTML=`<p>"${t.text}"</p><p><b>- ${t.name}</b></p>`;
    box.appendChild(card);
  });
}
document.addEventListener('DOMContentLoaded', loadTestimonials);

async function loadTeam(){
  const grid=byId('team-grid'); if(!grid) return;
  const data=await loadJSON((window.CONFIG&&CONFIG.TEAM)||'data/team.json');
  data.forEach(p=>{
    const card=document.createElement('div'); card.className='card';
    card.innerHTML=`<img src="team/${p.photo}" alt="" style="width:100%;border-radius:10px;object-fit:cover;max-height:180px;">
                    <h3>${p.name}</h3><p>${p.role}</p>`;
    grid.appendChild(card);
  });
}
document.addEventListener('DOMContentLoaded', loadTeam);
