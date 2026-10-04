const C="tho-sach-v6",F=["./","index.html","css/style.css","js/app.js","assets/icon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener("fetch",e=>{
  if(e.request.url.includes("open-meteo.com"))return;
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window"}).then(l=>l.length?l[0].focus():clients.openWindow("./")))});
