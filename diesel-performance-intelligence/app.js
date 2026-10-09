const KEY="dpi_v1";
const MAINT=[["Engine oil & filter",10000],["Air filter",15000],["Fuel filter",20000],["DPF / EGR check",40000]];
let S=load()||seed();

function seed(){
  const r=[[ '2026-05-02',42000,0],[ '2026-05-14',42540,38],[ '2026-05-27',43090,39],[ '2026-06-09',43620,37.5],
  ['2026-06-22',44170,39],['2026-07-05',44700,38],['2026-07-19',45240,38.5],['2026-08-02',45760,39],
  ['2026-08-16',46230,41.5],['2026-08-30',46680,42.5]];
  return {e:r.map(x=>({date:x[0],odo:x[1],l:x[2],p:90+Math.round(Math.random()*3)})),
          m:{0:44000,1:40000,2:30000,3:20000}};
}
function load(){try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

function analyse(){
  const e=[...S.e].sort((a,b)=>a.odo-b.odo), rows=[];
  for(let i=1;i<e.length;i++){
    const dist=e[i].odo-e[i-1].odo, eff=dist/e[i].l;
    const prev=rows.slice(-5).map(r=>r.eff);
    const base=prev.length>=3?prev.reduce((a,b)=>a+b)/prev.length:null;
    const drop=base?(base-eff)/base:0;
    rows.push({...e[i],dist,eff,cpk:e[i].l*e[i].p/dist,drop,
      flag:drop>0.15?'bad':drop>0.08?'wn':'ok'});
  }
  return {rows,last:e[e.length-1]};
}

function render(){
  const {rows,last}=analyse();
  const k=document.getElementById('kpis');
  if(!rows.length){k.innerHTML='<div class="card">Add at least two fill-ups to see analytics.</div>';return}
  const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
  const dist=sum(rows,r=>r.dist), lit=sum(rows,r=>r.l), cost=sum(rows,r=>r.l*r.p);
  const avg=dist/lit, cur=rows[rows.length-1].eff;
  const best=Math.max(...rows.map(r=>r.eff));
  k.innerHTML=[
   ['Average economy',avg.toFixed(2),'km/L'],
   ['Latest economy',cur.toFixed(2),'km/L'],
   ['Best economy',best.toFixed(2),'km/L'],
   ['Cost per km','₹'+(cost/dist).toFixed(2),''],
   ['Total fuel cost','₹'+Math.round(cost).toLocaleString('en-IN'),''],
   ['Odometer',last.odo.toLocaleString('en-IN'),'km']
  ].map(x=>`<div class="card"><div class="k">${x[0]}</div><div class="v">${x[1]} <small>${x[2]}</small></div></div>`).join('');

  const A=[];
  const lr=rows[rows.length-1];
  if(lr.flag!=='ok')A.push(`Latest fill-up economy is ${(lr.drop*100).toFixed(0)}% below your recent average. Possible causes: clogged air/fuel filter, injector wear, low tyre pressure, DPF regeneration issues or heavier load.`);
  const l3=rows.slice(-3);
  if(l3.length===3&&l3[0].eff>l3[1].eff&&l3[1].eff>l3[2].eff)A.push('Efficiency has declined three fill-ups in a row. Schedule an inspection.');
  document.getElementById('alerts').innerHTML=A.map(a=>`<div class="alert">⚠️ ${a}</div>`).join('');

  chart(rows,avg);
  maint(last.odo);
  document.getElementById('tbl').innerHTML='<tr><th>Date</th><th>Dist</th><th>L</th><th>km/L</th><th>₹/km</th><th>Status</th></tr>'+
   [...rows].reverse().map(r=>`<tr><td>${r.date}</td><td>${r.dist}</td><td>${r.l}</td><td>${r.eff.toFixed(2)}</td><td>${r.cpk.toFixed(2)}</td>
   <td><span class="badge b-${r.flag}">${r.flag==='ok'?'Normal':r.flag==='wn'?'Watch':'Alert'}</span></td></tr>`).join('');
}

function chart(rows,avg){
  const W=420,H=220,P=34,ys=rows.map(r=>r.eff);
  const mn=Math.floor(Math.min(...ys,avg)-1),mx=Math.ceil(Math.max(...ys,avg)+1);
  const x=i=>P+i*(W-P-10)/Math.max(rows.length-1,1), y=v=>H-24-(v-mn)/(mx-mn)*(H-44);
  const pts=rows.map((r,i)=>`${x(i)},${y(r.eff)}`).join(' ');
  let g='';for(let v=mn;v<=mx;v++)g+=`<line x1="${P}" x2="${W-10}" y1="${y(v)}" y2="${y(v)}" stroke="var(--bd)"/><text x="${P-6}" y="${y(v)+4}" font-size="10" fill="var(--mu)" text-anchor="end">${v}</text>`;
  const dots=rows.map((r,i)=>`<circle cx="${x(i)}" cy="${y(r.eff)}" r="4" fill="${r.flag==='bad'?'var(--bad)':r.flag==='wn'?'var(--wn)':'var(--ac)'}"><title>${r.date}: ${r.eff.toFixed(2)} km/L</title></circle>`).join('');
  document.getElementById('chart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Fuel efficiency trend">${g}
   <line x1="${P}" x2="${W-10}" y1="${y(avg)}" y2="${y(avg)}" stroke="var(--mu)" stroke-dasharray="5 4"/>
   <text x="${W-12}" y="${y(avg)-5}" font-size="10" fill="var(--mu)" text-anchor="end">avg ${avg.toFixed(1)}</text>
   <polyline points="${pts}" fill="none" stroke="var(--ac)" stroke-width="2"/>${dots}</svg>`;
}

function maint(odo){
  document.getElementById('maint').innerHTML=MAINT.map((m,i)=>{
    const done=S.m[i]??0, left=done+m[1]-odo;
    const c=left<0?'bad':left<1500?'wn':'ok', t=left<0?`Overdue ${-left} km`:`${left} km left`;
    return `<div class="m"><div>${m[0]}<br><span class="k">every ${m[1].toLocaleString('en-IN')} km</span></div>
    <div style="text-align:right"><span class="badge b-${c}">${t}</span><br><button class="sec" onclick="done(${i})" style="margin-top:4px">Mark done</button></div></div>`}).join('');
}
function done(i){const {last}=analyse();S.m[i]=last.odo;save();render()}

document.getElementById('f').addEventListener('submit',ev=>{
  ev.preventDefault();
  const v=id=>document.getElementById(id).value;
  S.e.push({date:v('d'),odo:+v('o'),l:+v('l'),p:+v('p')});
  save();ev.target.reset();render();
});
document.getElementById('reset').onclick=()=>{S=seed();save();render()};
document.getElementById('d').valueAsDate=new Date();
render();
