
const $ = (s, r=document)=> r.querySelector(s);
const el = {
  file: $('#file'),
  btnDemo: $('#btnDemo'),
  summary: $('#summary'),
  scores: $('#scores'),
  metrics: $('#metrics'),
  opps: $('#opps'),
  fails: $('#fails'),
  compare: $('#compare'),
};

function bar(score){
  const v = Math.max(0, Math.min(1, score||0));
  const wrap = document.createElement('div');
  wrap.className = 'score';
  wrap.innerHTML = `<span class="badge">${Math.round(v*100)}</span><span class="bar"><i style="transform:scaleX(${v})"></i></span>`;
  return wrap;
}

function rowKV(k, v){
  const d = document.createElement('div');
  d.className = 'kv';
  d.innerHTML = `<div class="badge">${k}</div><div>${v}</div>`;
  return d;
}

function parseReport(j){
  const cats = j.categories || {};
  function s(x){ return x && x.score != null ? x.score : 0; }
  const info = {
    url: j.requestedUrl || j.finalUrl || '—',
    fetchTime: (j.fetchTime||'').replace('T',' ').replace('Z',''),
    scores: {
      performance: s(cats.performance),
      accessibility: s(cats.accessibility),
      best: s(cats['best-practices']||cats.bestPractices),
      seo: s(cats.seo),
      pwa: s(cats.pwa),
    },
    metrics: (j.audits || {}),
    opps: (cats.performance && cats.performance.auditRefs || []).filter(r=>r.relevance && r.group==='load-opportunities'),
    diag: (cats.performance && cats.performance.auditRefs || []).filter(r=>r.group==='diagnostics'),
    audits: j.audits || {},
    lhVersion: j.lighthouseVersion || '—'
  };
  return info;
}

function renderSummary(reports){
  el.summary.innerHTML = '';
  reports.forEach((r,i)=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.style.minWidth = '280px';
    card.innerHTML = `<h3>Run ${i+1}</h3>
      <div class="small">${r.url}</div>
      <div class="small">${r.fetchTime}</div>
      <div class="kv"><div>LH</div><div>${r.lhVersion}</div></div>`;
    el.summary.appendChild(card);
  });
}

function renderScores(reports){
  el.scores.innerHTML = '';
  const keys = ['performance','accessibility','best','seo','pwa'];
  reports.forEach((r,i)=>{
    const wrap = document.createElement('div'); wrap.className='card'; wrap.style.minWidth='220px';
    wrap.innerHTML = `<h3>Run ${i+1}</h3>`;
    keys.forEach(k=>{
      const line = document.createElement('div'); line.className='row';
      line.innerHTML = `<div style="width:120px">${k.toUpperCase()}</div>`;
      line.appendChild(bar(r.scores[k]));
      wrap.appendChild(line);
    });
    el.scores.appendChild(wrap);
  });
}

function renderMetrics(reports){
  el.metrics.innerHTML='';
  const keys = ['first-contentful-paint','largest-contentful-paint','speed-index','total-blocking-time','cumulative-layout-shift','time-to-first-byte'];
  const names = {'first-contentful-paint':'FCP','largest-contentful-paint':'LCP','speed-index':'Speed Index','total-blocking-time':'TBT','cumulative-layout-shift':'CLS','time-to-first-byte':'TTFB'};
  const tbl = document.createElement('table');
  tbl.innerHTML = `<thead><tr><th>Metric</th>${reports.map((_,i)=>`<th>Run ${i+1}</th>`).join('')}</tr></thead>`;
  const tbody = document.createElement('tbody');
  keys.forEach(k=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${names[k]||k}</td>` + reports.map(r=>{
      const a = r.audits[k] || {};
      let val = (a.displayValue || a.numericValue || '—');
      return `<td>${val}</td>`;
    }).join('');
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  el.metrics.appendChild(tbl);
}

function auditById(rep, id){
  return rep.audits[id] || {};
}

function renderOpps(reports){
  el.opps.innerHTML = '';
  reports.forEach((r,i)=>{
    const wrap = document.createElement('div'); wrap.className='card';
    wrap.innerHTML = `<h3>Run ${i+1}</h3>`;
    const perfRefs = (r.audits && Object.values(r.audits)) || [];
    const opps = perfRefs.filter(a=> a.details && a.details.type==='opportunity');
    if(!opps.length){ wrap.innerHTML += '<div class="small">No opportunities found.</div>'; }
    opps.forEach(o=>{
      const impact = (o.numericValue||0).toFixed(0)+' ms';
      const row = document.createElement('div'); row.className='kv';
      row.innerHTML = `<div>${o.title}</div><div>${impact} — ${o.description||''}</div>`;
      wrap.appendChild(row);
    });
    el.opps.appendChild(wrap);
  });
}

function renderFails(reports){
  el.fails.innerHTML = '';
  reports.forEach((r,i)=>{
    const wrap = document.createElement('div'); wrap.className='card';
    wrap.innerHTML = `<h3>Run ${i+1}</h3>`;
    const list = Object.values(r.audits).filter(a=> (a.score != null && a.score < 0.9) || a.score === 0);
    if(!list.length){ wrap.innerHTML += '<div class="small">No low-score audits.</div>'; }
    list.sort((a,b)=> (a.score||0) - (b.score||0));
    list.slice(0,60).forEach(a=>{
      const line = document.createElement('div'); line.className='kv';
      const sc = (a.score==null?'—':Math.round(a.score*100));
      line.innerHTML = `<div>${sc}</div><div><strong>${a.title||a.id}</strong><div class="small">${a.description||''}</div></div>`;
      wrap.appendChild(line);
    });
    el.fails.appendChild(wrap);
  });
}

function renderCompare(reports){
  el.compare.innerHTML = '';
  if(reports.length < 2){ el.compare.innerHTML = '<div class="small">Load 2+ reports to compare.</div>'; return; }
  const keys = ['performance','accessibility','best','seo','pwa'];
  const tbl = document.createElement('table');
  const head = `<thead><tr><th>Category</th>${reports.map((_,i)=>`<th>Run ${i+1}</th>`).join('')}<th>Δ (last-first)</th></tr></thead>`;
  const body = document.createElement('tbody');
  keys.forEach(k=>{
    const tr = document.createElement('tr');
    const seq = reports.map(r=> Math.round((r.scores[k]||0)*100));
    const delta = (seq[seq.length-1] - seq[0]);
    tr.innerHTML = `<td>${k.toUpperCase()}</td>${seq.map(s=>`<td>${s}</td>`).join('')}<td>${delta>=0?'+':''}${delta}</td>`;
    body.appendChild(tr);
  });
  tbl.innerHTML = head; tbl.appendChild(body);
  el.compare.appendChild(tbl);
}

async function loadFiles(files){
  const arr = [];
  for(const f of files){
    try{
      const text = await f.text();
      const j = JSON.parse(text);
      arr.push(parseReport(j));
    }catch(e){ console.warn('Failed parse', f.name, e); }
  }
  if(arr.length){
    renderSummary(arr); renderScores(arr); renderMetrics(arr); renderOpps(arr); renderFails(arr); renderCompare(arr);
  }
}

async function loadDemo(){
  try{
    const r = await fetch('../reports/demo-lh.json'); const j = await r.json();
    renderSummary([parseReport(j)]); renderScores([parseReport(j)]); renderMetrics([parseReport(j)]); renderOpps([parseReport(j)]); renderFails([parseReport(j)]); renderCompare([parseReport(j)]);
  }catch(e){
    alert('No demo report found. Drop your JSON instead.');
  }
}

el.file.addEventListener('change', e=> loadFiles(e.target.files));
el.btnDemo.addEventListener('click', loadDemo);
