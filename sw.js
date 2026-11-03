const CACHE = "rk-shell-v2";
const EXT = "rk-ext-v2";
const SHELL = ["./", "./index.html", "./icon.svg"];
const CDN = ["https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    for (const u of SHELL) await c.add(u).catch(() => {});
    const x = await caches.open(EXT);
    for (const u of CDN) await x.add(u).catch(() => {});
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== EXT).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  let host;
  try { host = new URL(r.url).host } catch(_){ return }

  if (host === location.host){
    e.respondWith(
      fetch(r).then(res => {
        if (res.ok){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(r, copy)).catch(() => {});
        }
        return res;
      }).catch(async () => {
        return (await caches.match(r, { ignoreSearch:true })) ||
               (await caches.match("./")) ||
               new Response("offline", { status:503 });
      })
    );
    return;
  }

  if (host === "cdn.jsdelivr.net"){
    e.respondWith(
      caches.match(r).then(hit => hit || fetch(r).then(res => {
        if (res.ok){
          const copy = res.clone();
          caches.open(EXT).then(c => c.put(r, copy)).catch(() => {});
        }
        return res;
      }))
    );
  }
});