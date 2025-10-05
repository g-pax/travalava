// Service Worker for Travalava PWA
// Implements caching strategies as outlined in CLAUDE.md

const CACHE_NAME = "travalava-v1";
const STATIC_CACHE = "static-v1";
const RUNTIME_CACHE = "runtime-v1";

// Files to cache on install
const STATIC_ASSETS = ["/", "/offline", "/manifest.json"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("travalava-") && cacheName !== CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === "chrome-extension:") {
    return;
  }

  // Different strategies for different request types
  if (url.pathname.startsWith("/_next/static/")) {
    // Static assets - Cache First (StaleWhileRevalidate for immutable assets)
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (
    url.pathname.startsWith("/api/") ||
    url.origin.includes("supabase")
  ) {
    // API requests - Network First with cache fallback
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
  } else if (
    url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/)
  ) {
    // Assets - StaleWhileRevalidate
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  } else {
    // HTML pages - Network First
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
  }
});

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.log("Cache first failed:", error);
    throw error;
  }
}

// Network First strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.log("Network first failed, trying cache:", error);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return cache.match("/offline");
    }

    throw error;
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Background sync for offline mutations
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(processOfflineQueue());
  }
});

// Process offline mutation queue
async function processOfflineQueue() {
  // This would integrate with IndexedDB to replay offline mutations
  // Implementation details would depend on the offline queue structure
  console.log("Processing offline mutation queue...");
}

// Handle push notifications (future feature)
self.addEventListener("push", (event) => {
  // Push notification handling would go here
  console.log("Push notification received:", event);
});
