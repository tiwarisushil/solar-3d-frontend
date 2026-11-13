/* SolarDesy service worker.
   One worker for the whole origin: OneSignal push (imported below) and app caching.
   A second worker would replace this one and push would stop.

   Signed-in pages and API calls are never cached — a cached workspace could open
   as the previous user. Only hashed build files and pictures are kept, so the
   next visit paints quickly and an offline navigation gets the offline page. */

try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch {
  // Push stays off if the OneSignal script cannot load. The app shell still installs.
}

const SHELL = 'solardesy-shell-v1';
const STATIC = 'solardesy-static-v1';
const MEDIA = 'solardesy-media-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];

const devHost = (host) => host === 'localhost' || host === '127.0.0.1' || host === '::1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, STATIC, MEDIA]);
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('solardesy-') && !keep.has(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const type = event.data?.type || event.data;
  if (type === 'SKIP_WAITING') self.skipWaiting();
});

function isHashedAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/_next/static/');
}

function isMedia(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/icons/')) return true;
  return /\.(?:svg|png|jpe?g|webp|gif|ico|woff2?)$/i.test(url.pathname);
}

function isNavigation(request) {
  return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Dev server, API, maps, OneSignal and anything cross-origin stay on the network.
  if (devHost(self.location.hostname)) return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api') || url.pathname === '/sw.js') return;

  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }
  if (isMedia(url)) {
    event.respondWith(staleWhileRevalidate(request, MEDIA));
    return;
  }
  if (isNavigation(request)) event.respondWith(networkFirstPage(request));
});

async function cacheFirst(request, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok && response.type === 'basic') cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (hit) return hit;
  const response = await network;
  return response || new Response('', { status: 504 });
}

async function networkFirstPage(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(SHELL);
    const offline = await cache.match(OFFLINE_URL);
    return offline || new Response('You are offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}
