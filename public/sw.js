const CACHE = "nexus-shell-v1";
const base = new URL('./', self.location.href);
const files = ['index.html','home.html','program.html','profile.html','workout.html','editor.html','exercises.html','admin.html','styles.css','favicon.svg',
  'js/app.js','js/model.js','js/firebase.js','js/config.js','js/import.js','js/social.js','js/performance.js','js/login-metadata.js','js/catalog.js','js/drafts.js',
  'js/training-data.js','js/offline.js','js/history.js','js/backup.js','js/notifications.js'];
const sdk = ['firebase-app.js','firebase-auth.js','firebase-firestore.js'].map((file) => `https://www.gstatic.com/firebasejs/11.10.0/${file}`);
self.addEventListener('install', (event) => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(files.map((file) => new URL(file, base).href));
  await Promise.all(sdk.map((url) => cache.add(url).catch(() => {})));
  await self.skipWaiting();
})()));
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('nexus-shell-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const rootPage = url.origin === base.origin && url.pathname === base.pathname;
  const local = rootPage || url.origin === base.origin && url.pathname.startsWith(base.pathname) && /\.(html|js|css|svg)$/.test(url.pathname);
  const library = url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/11.10.0/');
  if (!local && !library) return;
  const cacheKey = rootPage ? new URL('index.html', base).href : local ? url.origin + url.pathname : event.request;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(cacheKey, response.clone());
      return response;
    } catch {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
      throw Error('Offline resource unavailable');
    }
  })());
});
