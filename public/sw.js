const CACHE = "nexus-shell-v38";
const base = new URL('./', self.location.href);
const files = ['index.html','home.html','program.html','nutrition.html','nutrition.css','profile.html','settings.html','workout.html','editor.html','exercises.html','admin.html','admin.css','styles.css','favicon.svg','js/admin-stats.js','js/profile-appearance.js',
  'js/theme.js','js/app.js','js/model.js','js/workout-modes.js','js/firebase.js','js/config.js','js/import.js','js/social.js','js/rich-editor.bundle.js','js/reaction-interactions.js','js/nutrition.js','js/nutrition-generator.js','js/nutrition-view.js','js/performance.js','js/login-metadata.js','js/catalog.js','js/catalog-json.js','js/drafts.js',
  'js/training-data.js','js/manual-sets.js','js/offline.js','js/read-cache.js','js/stats-publication.js','js/history.js','js/backup.js','js/notifications.js','js/activity.js','js/sharing.js','js/fitness.js','js/people.js','js/profile-data.js','js/routes.js','js/user-tags.js','js/workout-recovery.js','js/training-invites.js','js/profile-image-editor.js','js/community-safety.js','js/body-measurements.js','js/workout-summary.js'];
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
  const userRoute = url.origin === base.origin && url.pathname.startsWith(base.pathname) && /\/(?:public\/)?u\/[1-9][0-9]{0,11}\/?$/.test(url.pathname);
  const local = userRoute || rootPage || url.origin === base.origin && url.pathname.startsWith(base.pathname) && /\.(html|js|css|svg)$/.test(url.pathname);
  const library = url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/11.10.0/');
  if (!local && !library) return;
  const cacheKey = userRoute ? new URL('profile.html', base).href : rootPage ? new URL('index.html', base).href : local ? url.origin + url.pathname : event.request;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // The complete shell is refreshed at install when CACHE changes.
    // Reuse it without waiting for the network on every page transition.
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(cacheKey, response.clone());
      return response;
    } catch {
      throw Error('Offline resource unavailable');
    }
  })());
});
