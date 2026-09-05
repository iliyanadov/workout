/* Offline shell. Bump CACHE on every deploy or clients keep the old build. */
const CACHE = "workout-v5";
const CORE  = "./index.html";
const SHELL = [
  "./", "./index.html", "./app.js", "./config.js", "./vendor/supabase.js",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./icon-maskable-512.png", "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // The core document must land. Everything else is best-effort, so one bad
    // asset cannot wedge the worker and leave old caches undeleted forever.
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

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    // Fonts may be cached. Supabase and everything else must never be.
    if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
      e.respondWith((async () => {
        const c = await caches.open(CACHE);
        const hit = await c.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) c.put(req, res.clone());
          return res;
        } catch (err) {
          return new Response("", { status: 504, statusText: "offline" });
        }
      })());
    }
    return;
  }

  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if (hit) {
      // Refresh in the background; never block the response on the network.
      fetch(req).then((res) => { if (res && res.ok) c.put(req, res.clone()); }).catch(() => {});
      return hit;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      // A cold offline start must still get the app, never Safari's error page.
      const core = await c.match(CORE);
      if (req.mode === "navigate" && core) return core;
      return new Response("", { status: 504, statusText: "offline" });
    }
  })());
});
