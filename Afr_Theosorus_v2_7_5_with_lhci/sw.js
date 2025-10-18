const C_VER='v2.7.3';
const CORE=['/','/index.html','/assets/styles.css','/assets/themes.css','/assets/install.js','/assets/install.css','/manifest.webmanifest'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C_VER).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k===C_VER?null:caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const url = new URL(e.request.url);
  // Cache-first for assets & data
  if(url.pathname.match(/\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|json)$/) || url.pathname.includes('/data/') || url.pathname.includes('/icons/') || url.pathname.includes('/splash')){
    e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{
      const copy = res.clone();
      caches.open(C_VER).then(c=>c.put(e.request, copy));
      return res;
    })));
  }
});