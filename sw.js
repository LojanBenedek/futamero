const CACHE = 'futamero-v1';
const STATIC = [
  '/',
  '/index.html',
  '/supabase.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Telepítéskor statikus fájlok cache-elése
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Aktiváláskor régi cache törlése
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first, cache fallback
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase API kérések: csak network, soha ne cache-eljük
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Google Fonts: network-first
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    return;
  }

  // Statikus fájlok: cache-first
  if (STATIC.some(s => url.pathname === s || url.pathname === '/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const network = fetch(e.request).then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Minden más: network-first
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
