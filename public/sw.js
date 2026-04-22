// Hogar Service Worker — v2 (app shell cache only, no push)
// NOTE: bump CACHE_NAME whenever branding/icons change so devices purge
// the previous cache on activation.

const CACHE_NAME = "hogar-v2";
const SHELL_ASSETS = ["/", "/hoy"];

// Paths that should ALWAYS hit the network (never be cached). These are
// branding/PWA assets that must refresh promptly after a redeploy.
const NEVER_CACHE = [
  "/icon",
  "/apple-icon",
  "/logo.svg",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network-first for API calls and navigation
  if (
    event.request.url.includes("/rest/") ||
    event.request.url.includes("/auth/") ||
    event.request.url.includes("/realtime/")
  ) {
    return;
  }

  // Branding assets: bypass the SW entirely so the browser's own cache
  // rules apply (and the latest icon is fetched after a redeploy).
  if (NEVER_CACHE.some((p) => url.pathname === p || url.pathname.startsWith(p + "?"))) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses
        if (event.request.method === "GET" && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
