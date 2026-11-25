// KasirQu Service Worker — enables offline use & install-to-home-screen when hosted.
// Cache-first strategy for the app shell; network fallback for everything else.
const CACHE='kasirqu-v1';
const APP_SHELL=['./','./kasirqu.html','./sw.js'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  // Only handle same-origin requests; let cross-origin (e.g. wa.me) pass through.
  if(url.origin!==location.origin)return;
  e.respondWith(
    caches.match(req).then(cached=>{
      const fetchPromise=fetch(req).then(res=>{
        if(res && res.status===200 && res.type==='basic'){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(req,clone));
        }
        return res;
      }).catch(()=>cached);
      return cached || fetchPromise;
    })
  );
});
