/* NRL People offline worker.
   Network first, so the app is always current when there is signal; the last good copy of
   every page, script and style is kept so it still opens in plant areas with none. */
const CACHE = "nrl-people-v1";
const SHELL = ["/", "/home", "/self", "/time", "/leave", "/roster", "/payslips", "/claims", "/cases", "/kiosk", "/gate", "/visitors", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(new Request(url, { cache: "reload" }))))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  // Dev-server hot reload traffic must never be served from cache.
  if (url.pathname.includes("hmr") || req.headers.get("accept") === "text/event-stream") return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req, { ignoreVary: true });
        if (hit) return hit;
        if (req.mode === "navigate") {
          return (await caches.match(url.pathname)) || (await caches.match("/home")) || (await caches.match("/")) || Response.error();
        }
        return Response.error();
      }),
  );
});
