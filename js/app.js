const LEVELS=[
 {max:50,name:"Good",c:"#3a9d5d",bg:"#eef7f0"},
 {max:100,name:"Moderate",c:"#b08900",bg:"#fbf6e2"},
 {max:150,name:"Poor",c:"#d9710f",bg:"#fdf0e2"},
 {max:200,name:"Unhealthy",c:"#c8362b",bg:"#fbe9e7"},
 {max:300,name:"Very unhealthy",c:"#8a2f8f",bg:"#f4e7f5"},
 {max:999,name:"Hazardous",c:"#6d1a2b",bg:"#f1e2e5"}
];
const lv=a=>LEVELS.find(l=>a<=l.max);
const idx=a=>LEVELS.indexOf(lv(a));

const GROUPS={
 normal:"Healthy adult",
 kid:"Child",
 old:"Older adult"
};
// Sensitive groups are affected at lower AQI levels, so they get a higher sensitivity offset
const SENS={normal:0,kid:1,old:1};
const CONDS={resp:"Asthma / respiratory",heart:"Heart condition",preg:"Pregnant"};
const ACTS={walk:{label:"Walking",s:0,verb:"walking"},ride:{label:"Riding (scooter / bike)",s:0,verb:"riding"},run:{label:"Running / sports",s:1,verb:"running"}};

function advice(group,a,extra=state.cond.length){
 const i=idx(a), eff=i+SENS[group]+Math.min(2,extra); // effective level
 let verdict,tips=[];
 if(eff<=0){
  verdict="Fine to be outside today.";
  tips=["Running, cycling and outdoor sports are all fine.","Open the windows for fresh air."];
 }else if(eff==1){
  verdict="OK to go out, but avoid long, hard exertion.";
  tips=["Cut back on intense outdoor workouts.","If you cough or your eyes sting, go indoors."];
 }else if(eff==2){
  verdict="Exercise indoors or shorten your time outside.";
  tips=["Wear a fine-particle mask (N95/KN95) outdoors.","Close windows at peak hours and run an air purifier if you have one.","Postpone outdoor running."];
 }else if(eff==3){
  verdict="Limit going outside.";
  tips=["Only go out when necessary, and always wear an N95/KN95.","Keep exercise gentle and indoors.","Keep windows closed and use an air purifier."];
 }else{
  verdict="Stay indoors and avoid all outdoor activity.";
  tips=["Keep windows closed and run an air purifier.","If you must go out, wear a properly fitted N95/KN95.","If you have trouble breathing or chest pain, see a doctor right away."];
 }
 if(group=="kid"&&eff>=1)tips.push("Limit children's outdoor playtime.");
 if(group=="old"&&eff>=1)tips.push("Avoid early-morning walks, when particles are often highest.");
 if(extra>0&&eff>=1)tips.push("Carry your rescue medication and follow your doctor's advice.");
 return {verdict,tips,eff};
}

let state={aqi:null,group:"normal",cond:[],act:"walk",fam:[]};
const $=id=>document.getElementById(id);

function renderWho(){
 $("who").innerHTML="";
 for(const k in GROUPS){
  const b=document.createElement("button");
  b.type="button";b.textContent=GROUPS[k];
  b.setAttribute("aria-pressed",state.group==k);
  b.onclick=()=>{state.group=k;try{localStorage.setItem("group",k)}catch(e){}renderWho();renderAdvice()};
  $("who").appendChild(b);
 }
}
function renderAdvice(){
 if(state.aqi==null)return;
 const r=advice(state.group,state.aqi);
 $("verdict").textContent=r.verdict;
 $("tips").innerHTML=r.tips.map(t=>"<li>"+t+"</li>").join("");
 renderPlan();renderFamily();
}

async function load(lat,lon,name){
 $("place").textContent=name;
 state.loc={lat,lon,name};
 try{
  const u=`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10&hourly=us_aqi&forecast_days=2&timezone=auto`;
  const d=await (await fetch(u)).json();
  const a=Math.round(d.current.us_aqi), L=lv(a);
  state.aqi=a;
  document.documentElement.style.setProperty("--c",L.c);
  document.documentElement.style.setProperty("--bg",L.bg);
  $("aqi").textContent=a;
  $("level").textContent=L.name;
  $("sub").textContent="Updated at "+d.current.time.slice(11,16);
  $("pm25").textContent=Math.round(d.current.pm2_5);
  $("pm10").textContent=Math.round(d.current.pm10);

  // Next 24 hours, starting from the current hour
  const now=d.hourly.time.findIndex(t=>t>=d.current.time.slice(0,13)+":00");
  const start=Math.max(now,0);
  const vals=d.hourly.us_aqi.slice(start,start+24);
  const times=d.hourly.time.slice(start,start+24);
  state.hours={vals,times};
  const mx=Math.max(...vals,50);
  $("chart").innerHTML=vals.map((v,i)=>`<div title="${times[i].slice(11,16)}: AQI ${v}" style="height:${Math.max(v/mx*100,4)}%;background:${lv(v).c}"></div>`).join("");

  // Cleanest hour (daytime 5am-9pm only)
  let best=null;
  vals.forEach((v,i)=>{const h=+times[i].slice(11,13);if(h>=5&&h<=21&&(best==null||v<vals[best]))best=i});
  $("best").textContent=best==null?"":`Best hour to go outside: ${times[best].slice(11,16)} (AQI ${vals[best]})`;

  renderAdvice();
 }catch(e){
  $("aqi").textContent="–";
  $("level").innerHTML='<span class="err">Could not load data. Check your connection and try again.</span>';
 }
}

$("f").onsubmit=async e=>{
 e.preventDefault();
 const q=$("q").value.trim();if(!q)return;
 $("place").textContent="Searching…";
 try{
  const d=await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en`)).json();
  if(!d.results)throw 0;
  const r=d.results[0];
  load(r.latitude,r.longitude,[r.name,r.admin1].filter(Boolean).join(", "));
 }catch(x){$("place").innerHTML='<span class="err">Could not find that place.</span>'}
};

const CITIES=[
["Hanoi",21.0285,105.8542,"vn"],["Bac Ninh",21.186,106.0763,"vn"],["Hai Phong",20.8449,106.6881,"vn"],["Vinh",18.6796,105.6813,"vn"],["Hue",16.4637,107.5909,"vn"],["Da Nang",16.0544,108.2022,"vn"],["Quy Nhon",13.782,109.2196,"vn"],["Nha Trang",12.2388,109.1967,"vn"],["Buon Ma Thuot",12.6667,108.0378,"vn"],["Da Lat",11.9404,108.4583,"vn"],["Ho Chi Minh City",10.8231,106.6297,"vn"],["Can Tho",10.0452,105.7469,"vn"],
["Bangkok",13.7563,100.5018,"asia"],["Jakarta",-6.2088,106.8456,"asia"],["Singapore",1.3521,103.8198,"asia"],["Kuala Lumpur",3.139,101.6869,"asia"],["Manila",14.5995,120.9842,"asia"],["Phnom Penh",11.5564,104.9282,"asia"],["Vientiane",17.9757,102.6331,"asia"],["Yangon",16.8409,96.1735,"asia"],["Beijing",39.9042,116.4074,"asia"],["Shanghai",31.2304,121.4737,"asia"],["Hong Kong",22.3193,114.1694,"asia"],["Taipei",25.033,121.5654,"asia"],["Seoul",37.5665,126.978,"asia"],["Tokyo",35.6762,139.6503,"asia"],["Delhi",28.6139,77.209,"asia"],["Mumbai",19.076,72.8777,"asia"],["Dhaka",23.8103,90.4125,"asia"],["Lahore",31.5204,74.3587,"asia"],["Dubai",25.2048,55.2708,"asia"],
["London",51.5072,-0.1276,"world"],["Paris",48.8566,2.3522,"world"],["Berlin",52.52,13.405,"world"],["Istanbul",41.0082,28.9784,"world"],["Moscow",55.7558,37.6173,"world"],["Cairo",30.0444,31.2357,"world"],["Lagos",6.5244,3.3792,"world"],["Nairobi",-1.2921,36.8219,"world"],["Sydney",-33.8688,151.2093,"world"],["New York",40.7128,-74.006,"world"],["Los Angeles",34.0522,-118.2437,"world"],["Toronto",43.6532,-79.3832,"world"],["Mexico City",19.4326,-99.1332,"world"],["São Paulo",-23.5505,-46.6333,"world"],["Lima",-12.0464,-77.0428,"world"]
];
const REGIONS={
 vn:{label:"Vietnam",view:[16.2,106.3],zoom:5,has:r=>r.reg=="vn"},
 asia:{label:"Asia",view:[23,100],zoom:3,has:r=>r.reg=="vn"||r.reg=="asia"},
 world:{label:"Worldwide",view:[20,10],zoom:2,has:()=>true}
};
let region="vn",allRows=[],map=null,layer=null;

function pick(c){
 load(c.lat,c.lon,c.name);
 window.scrollTo({top:0,behavior:"smooth"});
}

function renderRegions(){
 $("regions").innerHTML="";
 for(const k in REGIONS){
  const b=document.createElement("button");
  b.type="button";b.textContent=REGIONS[k].label;
  b.setAttribute("aria-pressed",region==k);
  b.onclick=()=>{region=k;renderRegions();renderCities(true)};
  $("regions").appendChild(b);
 }
}

function renderCities(recenter){
 const R=REGIONS[region];
 const rows=allRows.filter(R.has).sort((a,b)=>b.aqi-a.aqi);

 // Ranking: most polluted to cleanest
 $("rank").innerHTML="";
 rows.forEach(r=>{
  const LV=lv(r.aqi),li=document.createElement("li"),b=document.createElement("button");
  b.type="button";
  b.innerHTML=`<span class="dot" style="background:${LV.c}"></span><span class="nm">${r.name}</span><span class="lvl">${LV.name}</span><span class="val" style="color:${LV.c}">${r.aqi}</span>`;
  b.onclick=()=>pick(r);
  li.appendChild(b);$("rank").appendChild(li);
 });

 // Map (only if the Leaflet library loaded)
 if(typeof L==="undefined"){$("map").style.display="none";return}
 if(!map){
  map=window.L.map("map",{scrollWheelZoom:false,worldCopyJump:true}).setView(R.view,R.zoom);
  window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:12,attribution:"© OpenStreetMap"}).addTo(map);
  layer=window.L.layerGroup().addTo(map);
 }else if(recenter){
  map.setView(R.view,R.zoom);
 }
 layer.clearLayers();
 rows.forEach(r=>{
  const LV=lv(r.aqi);
  window.L.circleMarker([r.lat,r.lon],{radius:region=="world"?9:13,color:"#fff",weight:2,fillColor:LV.c,fillOpacity:.9})
   .bindTooltip(`${r.name}: AQI ${r.aqi} (${LV.name})`)
   .on("click",()=>pick(r)).addTo(layer);
 });
}

async function loadCities(){
 renderRegions();
 try{
  const lat=CITIES.map(c=>c[1]).join(","),lon=CITIES.map(c=>c[2]).join(",");
  const d=await (await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`)).json();
  allRows=CITIES.map((c,i)=>({name:c[0],lat:c[1],lon:c[2],reg:c[3],aqi:d[i]&&d[i].current&&d[i].current.us_aqi!=null?Math.round(d[i].current.us_aqi):null})).filter(r=>r.aqi!=null);
  renderCities(false);
 }catch(e){
  $("rank").innerHTML='<li class="err">Could not load city data.</li>';
 }
}

function init(){
 try{const g=localStorage.getItem("group");if(g&&GROUPS[g])state.group=g}catch(e){}
 renderWho();
 const fallback=()=>load(21.0285,105.8542,"Hanoi (default)");
 if(!navigator.geolocation)return fallback();
 navigator.geolocation.getCurrentPosition(
  p=>load(p.coords.latitude,p.coords.longitude,"Your location"),
  fallback,{timeout:8000}
 );
}
/* ===== Alerts when AQI crosses a threshold ===== */
let alertCfg={on:false,thr:100,lat:null,lon:null,name:"",above:false};
function saveAlert(){try{localStorage.setItem("alertCfg",JSON.stringify(alertCfg))}catch(e){}}
function alertMsg(t,err){const s=$("alertStatus");s.textContent=t;s.className=err?"err":"hint"}

function renderAlert(){
 $("thr").value=String(alertCfg.thr);
 $("alertOn").textContent=alertCfg.on?"Stop watching":"Watch this place";
 if(alertCfg.on)alertMsg(`Watching ${alertCfg.name}. You'll be alerted when AQI goes above ${alertCfg.thr}.`);
}

async function notify(title,body){
 try{
  const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();
  if(reg&&reg.showNotification)return reg.showNotification(title,{body,icon:"assets/icon.svg",tag:"aqi-alert"});
  new Notification(title,{body,icon:"assets/icon.svg"});
 }catch(e){}
}

async function checkAlert(manual){
 if(!alertCfg.on||alertCfg.lat==null)return;
 try{
  const d=await (await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${alertCfg.lat}&longitude=${alertCfg.lon}&current=us_aqi`)).json();
  const aqi=Math.round(d.current.us_aqi), over=aqi>alertCfg.thr;
  if(over&&!alertCfg.above){
   const g=state.group||"normal";
   notify(`AQI ${aqi} (${lv(aqi).name}) in ${alertCfg.name}`,advice(g,aqi).verdict);
  }
  alertCfg.above=over; saveAlert();
  if(manual)alertMsg(`Current AQI is ${aqi} in ${alertCfg.name}: ${over?"above":"below"} your threshold of ${alertCfg.thr}.`);
 }catch(e){if(manual)alertMsg("Couldn't check right now. Will retry later.",true)}
}

async function toggleAlert(){
 if(alertCfg.on){alertCfg.on=false;saveAlert();renderAlert();alertMsg("Stopped watching.");return}
 if(!("Notification" in window))return alertMsg("This browser doesn't support notifications.",true);
 let p=Notification.permission;
 if(p==="default")p=await Notification.requestPermission();
 if(p!=="granted")return alertMsg("Notifications are blocked. Allow notifications for this site in your browser settings.",true);
 if(!state.loc)return alertMsg("No location yet. Try again in a few seconds.",true);
 Object.assign(alertCfg,{on:true,lat:state.loc.lat,lon:state.loc.lon,name:state.loc.name,above:false});
 saveAlert();renderAlert();checkAlert(true);
}

function initAlert(){
 try{const s=JSON.parse(localStorage.getItem("alertCfg"));if(s)alertCfg=Object.assign(alertCfg,s)}catch(e){}
 renderAlert();
 $("alertOn").onclick=toggleAlert;
 $("thr").onchange=()=>{alertCfg.thr=+$("thr").value;saveAlert();if(alertCfg.on){alertCfg.above=false;renderAlert();checkAlert(true)}};
 $("alertTest").onclick=async()=>{
  if(!("Notification" in window))return alertMsg("This browser doesn't support notifications.",true);
  let p=Notification.permission;if(p==="default")p=await Notification.requestPermission();
  if(p!=="granted")return alertMsg("Notifications are blocked.",true);
  notify("Breathe Clean","Notifications are working.");
 };
 setInterval(()=>checkAlert(false),30*60*1000);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)checkAlert(false)});
 checkAlert(false);
}

/* ===== Personalization: health conditions, activity, family ===== */
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const effColor=e=>e<=1?"#3a9d5d":e==2?"#d9710f":"#c8362b";
const hourEff=v=>idx(v)+SENS[state.group]+Math.min(2,state.cond.length)+ACTS[state.act].s;

function chips(box,map,isOn,onClick){
 box.innerHTML="";
 for(const k in map){
  const b=document.createElement("button");
  b.type="button";b.textContent=map[k].label||map[k];
  b.setAttribute("aria-pressed",isOn(k));
  b.onclick=()=>onClick(k);
  box.appendChild(b);
 }
}
function renderConds(){
 chips($("conds"),CONDS,k=>state.cond.includes(k),k=>{
  state.cond=state.cond.includes(k)?state.cond.filter(x=>x!=k):[...state.cond,k];
  save("cond",state.cond);renderConds();renderAdvice();
 });
}
function renderActs(){
 chips($("acts"),ACTS,k=>state.act==k,k=>{state.act=k;save("act",k);renderActs();renderPlan()});
}

function renderPlan(){
 if(!state.hours)return;
 const {vals,times}=state.hours, A=ACTS[state.act], effs=vals.map(hourEff);
 const e0=effs[0];
 $("planVerdict").textContent=e0<=1?`Now is a good time for ${A.verb}.`:e0==2?`Think twice about ${A.verb} now: keep it short and wear a fine-particle mask.`:`Avoid ${A.verb} outdoors right now.`;
 $("planStrip").innerHTML=vals.map((v,i)=>`<div title="${times[i].slice(11,16)}: AQI ${v}" style="background:${effColor(effs[i])}"></div>`).join("");

 // Best window (5am-9pm): longest run of consecutive suitable hours
 const hr=i=>+times[i].slice(11,13), day=i=>hr(i)>=5&&hr(i)<=21;
 let best=null,cur=null;
 effs.forEach((e,i)=>{
  if(day(i)&&e<=1){cur=cur&&cur.end==i-1?{s:cur.s,end:i}:{s:i,end:i};if(!best||cur.end-cur.s>best.end-best.s)best={...cur}}
  else cur=null;
 });
 const p=n=>String(n).padStart(2,"0")+":00";
 if(best){$("planBest").textContent=`Best window for ${A.verb}: ${p(hr(best.s))} to ${p((hr(best.end)+1)%24)}`}
 else{
  let m=null;effs.forEach((e,i)=>{if(day(i)&&(m==null||e<effs[m]))m=i});
  $("planBest").textContent=m==null?"":`No hour today is really suitable for you. The least bad is ${p(hr(m))} (AQI ${vals[m]}), or move indoors.`;
 }
}

function famAdvice(m){return advice(m.g,state.aqi,m.w?1:0)}
function renderFamily(){
 const ul=$("famList");ul.innerHTML="";
 if(!state.fam.length){const li=document.createElement("li");li.textContent="Add family members to see personalized advice for each person.";li.className="hint";ul.appendChild(li);return}
 state.fam.forEach((m,i)=>{
  const r=famAdvice(m),li=document.createElement("li");
  const dot=document.createElement("span");dot.className="dot";dot.style.background=effColor(r.eff);
  const t=document.createElement("div");t.className="t";
  const b=document.createElement("b");b.textContent=`${m.n} (${GROUPS[m.g].toLowerCase()}${m.w?", health condition":""})`;
  const s=document.createElement("span");s.textContent=r.verdict;
  t.append(b,s);
  const x=document.createElement("button");x.type="button";x.className="x";x.textContent="×";x.setAttribute("aria-label","Remove "+m.n);
  x.onclick=()=>{state.fam.splice(i,1);save("fam",state.fam);renderFamily()};
  li.append(dot,t,x);ul.appendChild(li);
 });
}
function familyText(){
 const L=lv(state.aqi),place=$("place").textContent;
 return `Air quality in ${place} today: AQI ${state.aqi} (${L.name}).\n`+state.fam.map(m=>`- ${m.n}: ${famAdvice(m).verdict}`).join("\n")+"\n(Breathe Clean)";
}

function initPersonal(){
 const get=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
 state.cond=get("cond",[]).filter(k=>CONDS[k]);
 state.act=ACTS[get("act","walk")]?get("act","walk"):"walk";
 state.fam=get("fam",[]).filter(m=>m&&m.n&&GROUPS[m.g]);
 renderConds();renderActs();renderFamily();
 $("famAdd").onclick=()=>{
  const n=$("famName").value.trim().slice(0,20);
  if(!n||state.fam.length>=6)return;
  state.fam.push({n,g:$("famGroup").value,w:$("famWeak").checked});
  save("fam",state.fam);$("famName").value="";$("famWeak").checked=false;renderFamily();
 };
 $("famCopy").onclick=async()=>{
  if(state.aqi==null||!state.fam.length){$("famMsg").textContent="Add a family member and wait for the data to load.";return}
  const t=familyText();
  try{await navigator.clipboard.writeText(t);$("famMsg").textContent="Copied. Paste it into your family chat."}
  catch(e){$("famMsg").textContent="Couldn't copy automatically. Select and copy this text: "+t}
 };
}

initPersonal();
init();
loadCities();
initAlert();
