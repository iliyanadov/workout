/* Offline shell.
   Code (the document, app.js, config.js) is NETWORK-FIRST so a deploy reaches
   the phone immediately and cannot be pinned by GitHub Pages' max-age=600.
   Static assets stay cache-first. Offline still works: every network-first
   fetch falls back to the cache. */
const CACHE = "workout-v21";
const CORE  = "./index.html";
const CODE  = ["/workout/", "/workout/index.html", "/workout/app.js", "/workout/config.js", "/workout/version.json"];
const SHELL = [
  "./", "./index.html", "./app.js", "./config.js", "./vendor/supabase.js",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./icon-maskable-512.png", "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.add(CORE);
    await Promise.all(SHELL.map((u) => c.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isCode(url, req) {
  return req.mode === "navigate" || CODE.includes(url.pathname);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
      e.respondWith((async () => {
        const c = await caches.open(CACHE);
        const hit = await c.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) c.put(req, res.clone());
          return res;
        } catch (err) { return new Response("", { status: 504 }); }
      })());
    }
    return;
  }

  if (isCode(url, req)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      // Read the fallback up front: a hung request is a failure too, and a
      // gym with one bar must not sit on a spinner instead of opening.
      let hit = await c.match(req);
      if (!hit && req.mode === "navigate") hit = await c.match(CORE);

      const net = (async () => {
        const res = await fetch(req, { cache: "no-store" });
        if (!res || !res.ok) throw new Error("status " + (res && res.status));
        // version.json is probed with a cache-busting query; caching those
        // would grow the cache without bound and nothing ever reads them.
        if (!url.search) c.put(req, res.clone()).catch(() => {});
        return res;
      })();
      net.catch(() => {});
      e.waitUntil(net.catch(() => {}));

      if (!hit) {
        // Nothing cached to fall back to, so wait — but not forever.
        const hard = new Promise(r => setTimeout(() => r("timeout"), 8000));
        try {
          const res = await Promise.race([net, hard]);
          if (res === "timeout") return new Response("", { status: 504, statusText: "slow network" });
          return res;
        } catch (err) { return new Response("", { status: 504 }); }
      }
      const timeout = new Promise(r => setTimeout(() => r(null), 2500));
      try {
        const res = await Promise.race([net, timeout]);
        return res || hit;
      } catch (err) { return hit; }
    })());
    return;
  }

  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok) c.put(req, res.clone());
      return res;
    } catch (err) { return new Response("", { status: 504 }); }
  })());
});
