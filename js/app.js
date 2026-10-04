const LEVELS=[
 {max:50,name:"Tốt",c:"#3a9d5d",bg:"#eef7f0"},
 {max:100,name:"Trung bình",c:"#b08900",bg:"#fbf6e2"},
 {max:150,name:"Kém",c:"#d9710f",bg:"#fdf0e2"},
 {max:200,name:"Xấu",c:"#c8362b",bg:"#fbe9e7"},
 {max:300,name:"Rất xấu",c:"#8a2f8f",bg:"#f4e7f5"},
 {max:999,name:"Nguy hại",c:"#6d1a2b",bg:"#f1e2e5"}
];
const lv=a=>LEVELS.find(l=>a<=l.max);
const idx=a=>LEVELS.indexOf(lv(a));

const GROUPS={
 normal:"Người bình thường",
 kid:"Trẻ em",
 old:"Người cao tuổi",
 sick:"Hen / dị ứng / tim mạch"
};
// Mỗi nhóm có ngưỡng "nhạy cảm" riêng: nhóm nhạy cảm bị ảnh hưởng ở mức thấp hơn
const SENS={normal:0,kid:1,old:1,sick:2};

function advice(group,a){
 const i=idx(a), eff=i+SENS[group]; // mức hiệu dụng
 let verdict,tips=[];
 if(eff<=0){
  verdict="Hôm nay thoải mái ra ngoài.";
  tips=["Chạy bộ, đạp xe, chơi thể thao ngoài trời đều ổn.","Mở cửa sổ cho thoáng khí."];
 }else if(eff==1){
  verdict="Ra ngoài được, nhưng đừng gắng sức quá lâu.";
  tips=["Giảm thời gian tập cường độ cao ngoài trời.","Nếu thấy ho hoặc cay mắt, vào nhà nghỉ."];
 }else if(eff==2){
  verdict="Nên tập trong nhà hoặc rút ngắn thời gian ngoài trời.";
  tips=["Đeo khẩu trang lọc bụi mịn (N95/KN95) khi ra đường.","Đóng cửa sổ giờ cao điểm, bật máy lọc không khí nếu có.","Hoãn chạy bộ ngoài trời."];
 }else if(eff==3){
  verdict="Hạn chế ra ngoài.";
  tips=["Chỉ ra ngoài khi cần thiết và luôn đeo N95/KN95.","Tập thể dục trong nhà, nhẹ nhàng.","Đóng kín cửa, dùng máy lọc không khí."];
 }else{
  verdict="Ở trong nhà, tránh mọi hoạt động ngoài trời.";
  tips=["Đóng kín cửa, bật máy lọc không khí.","Nếu bắt buộc ra ngoài: N95/KN95 đúng cách.","Có triệu chứng khó thở, đau ngực: đi khám ngay."];
 }
 if(group=="kid"&&eff>=1)tips.push("Hạn chế giờ ra chơi ngoài sân của trẻ.");
 if(group=="old"&&eff>=1)tips.push("Tránh đi bộ buổi sáng sớm khi bụi thường dày nhất.");
 if(group=="sick"&&eff>=1)tips.push("Mang theo thuốc cắt cơn và làm theo chỉ dẫn của bác sĩ.");
 return {verdict,tips};
}

let state={aqi:null,group:"normal"};
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
}

async function load(lat,lon,name){
 $("place").textContent=name;
 try{
  const u=`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10&hourly=us_aqi&forecast_days=2&timezone=auto`;
  const d=await (await fetch(u)).json();
  const a=Math.round(d.current.us_aqi), L=lv(a);
  state.aqi=a;
  document.documentElement.style.setProperty("--c",L.c);
  document.documentElement.style.setProperty("--bg",L.bg);
  $("aqi").textContent=a;
  $("level").textContent=L.name;
  $("sub").textContent="Cập nhật lúc "+d.current.time.slice(11,16);
  $("pm25").textContent=Math.round(d.current.pm2_5);
  $("pm10").textContent=Math.round(d.current.pm10);

  // 24 giờ tới, bắt đầu từ giờ hiện tại
  const now=d.hourly.time.findIndex(t=>t>=d.current.time.slice(0,13)+":00");
  const start=Math.max(now,0);
  const vals=d.hourly.us_aqi.slice(start,start+24);
  const times=d.hourly.time.slice(start,start+24);
  const mx=Math.max(...vals,50);
  $("chart").innerHTML=vals.map((v,i)=>`<div title="${times[i].slice(11,16)}: AQI ${v}" style="height:${Math.max(v/mx*100,4)}%;background:${lv(v).c}"></div>`).join("");

  // Khung giờ ít bụi nhất (ưu tiên 5h-21h)
  let best=null;
  vals.forEach((v,i)=>{const h=+times[i].slice(11,13);if(h>=5&&h<=21&&(best==null||v<vals[best]))best=i});
  $("best").textContent=best==null?"":`Giờ ít bụi nhất để ra ngoài: ${times[best].slice(11,16)} (AQI ${vals[best]})`;

  renderAdvice();
 }catch(e){
  $("aqi").textContent="–";
  $("level").innerHTML='<span class="err">Không lấy được dữ liệu. Kiểm tra mạng và thử lại.</span>';
 }
}

$("f").onsubmit=async e=>{
 e.preventDefault();
 const q=$("q").value.trim();if(!q)return;
 $("place").textContent="Đang tìm…";
 try{
  const d=await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=vi`)).json();
  if(!d.results)throw 0;
  const r=d.results[0];
  load(r.latitude,r.longitude,[r.name,r.admin1].filter(Boolean).join(", "));
 }catch(x){$("place").innerHTML='<span class="err">Không tìm thấy địa điểm này.</span>'}
};

const CITIES=[["Hà Nội",21.0285,105.8542],["Bắc Ninh",21.186,106.0763],["Hải Phòng",20.8449,106.6881],["Vinh",18.6796,105.6813],["Huế",16.4637,107.5909],["Đà Nẵng",16.0544,108.2022],["Quy Nhơn",13.782,109.2196],["Nha Trang",12.2388,109.1967],["Buôn Ma Thuột",12.6667,108.0378],["Đà Lạt",11.9404,108.4583],["TP.HCM",10.8231,106.6297],["Cần Thơ",10.0452,105.7469]];
let map=null,layer=null;

function pick(c){
 load(c.lat,c.lon,c.name);
 window.scrollTo({top:0,behavior:"smooth"});
}

async function loadCities(){
 try{
  const lat=CITIES.map(c=>c[1]).join(","),lon=CITIES.map(c=>c[2]).join(",");
  const d=await (await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`)).json();
  const rows=CITIES.map((c,i)=>({name:c[0],lat:c[1],lon:c[2],aqi:Math.round(d[i].current.us_aqi)})).sort((a,b)=>b.aqi-a.aqi);

  // Bảng xếp hạng: từ ô nhiễm nhất đến sạch nhất
  $("rank").innerHTML="";
  rows.forEach(r=>{
   const L=lv(r.aqi),li=document.createElement("li"),b=document.createElement("button");
   b.type="button";
   b.innerHTML=`<span class="dot" style="background:${L.c}"></span><span class="nm">${r.name}</span><span class="lvl">${L.name}</span><span class="val" style="color:${L.c}">${r.aqi}</span>`;
   b.onclick=()=>pick(r);
   li.appendChild(b);$("rank").appendChild(li);
  });

  // Bản đồ (nếu thư viện Leaflet tải được)
  if(typeof L==="undefined"){$("map").style.display="none";return}
  if(!map){
   map=window.L.map("map",{scrollWheelZoom:false}).setView([16.2,106.3],5);
   window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:12,attribution:"© OpenStreetMap"}).addTo(map);
   layer=window.L.layerGroup().addTo(map);
  }
  layer.clearLayers();
  rows.forEach(r=>{
   const L2=lv(r.aqi);
   window.L.circleMarker([r.lat,r.lon],{radius:14,color:"#fff",weight:2,fillColor:L2.c,fillOpacity:.9})
    .bindTooltip(`${r.name}: AQI ${r.aqi} (${L2.name})`,{permanent:false})
    .on("click",()=>pick(r)).addTo(layer);
  });
 }catch(e){
  $("rank").innerHTML='<li class="err">Không tải được dữ liệu các thành phố.</li>';
 }
}

function init(){
 try{const g=localStorage.getItem("group");if(g&&GROUPS[g])state.group=g}catch(e){}
 renderWho();
 const fallback=()=>load(21.0285,105.8542,"Hà Nội (mặc định)");
 if(!navigator.geolocation)return fallback();
 navigator.geolocation.getCurrentPosition(
  p=>load(p.coords.latitude,p.coords.longitude,"Vị trí của bạn"),
  fallback,{timeout:8000}
 );
}
init();
loadCities();
