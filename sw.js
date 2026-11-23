// غيّر رقم الإصدار عند كل تحديث لملفات التطبيق ليُحدَّث الكاش
const VERSION = 'hifz-unified-v5.1';
const SHELL = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon.svg', './404.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { if (r.ok && r.type === 'basic') { const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); } return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  if (url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; }).catch(() => hit || Response.error());
      return hit || net;
    }));
  }
});

// تنبيه الغفلة في الخلفية (Periodic Sync) من بيانات IndexedDB، مرة واحدة في اليوم
self.addEventListener('periodicsync', e => {
  if (e.tag !== 'hifz-check') return;
  e.waitUntil(new Promise(ok => {
    const q = indexedDB.open('hifz', 1);
    q.onupgradeneeded = () => q.result.createObjectStore('k');
    q.onerror = () => ok();
    q.onsuccess = () => {
      const db = q.result, st = db.transaction('k', 'readwrite').objectStore('k');
      const g = st.get('g'), ln = st.get('ln');
      g.onerror = () => ok();
      g.onsuccess = () => {
        const o = g.result, t = new Date(), p = n => String(n).padStart(2, '0');
        const d = t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
        const l = o && o.rm ? o.g.filter(x => x.d <= d) : [];
        if (l.length && ln.result !== d && p(t.getHours()) + ':' + p(t.getMinutes()) >= o.hr) {
          try { db.transaction('k', 'readwrite').objectStore('k').put(d, 'ln'); } catch (x) {}
          self.registration.showNotification('⚠ غفلة عن المراجعة', { body: l.length + ' من محفوظك يحتاج مراجعة: ' + l[0].m, icon: 'icons/icon-192.png', tag: 'hifz', lang: 'ar', dir: 'rtl' }).then(ok, ok);
        } else ok();
      };
    };
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(c => c.length ? c[0].focus() : clients.openWindow('./index.html')));
});
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || '⚠ غفلة عن المراجعة', { body: d.body || 'لديك مراجعة مستحقة', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'hifz', lang: 'ar', dir: 'rtl' }));
});
// إن جدّد المتصفح اشتراك الإشعار (تغيّر المفتاح/انتهاء الصلاحية) يُعاد الاشتراك ويُرسَل للخادم
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil((async () => {
    try {
      const k = await (await fetch('/api/vapid')).json();
      if (!k.key) return;
      const raw = atob((k.key + '='.repeat((4 - k.key.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
      const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, c => c.charCodeAt(0)) });
      const o = await new Promise(res => {
        const q = indexedDB.open('hifz', 1);
        q.onupgradeneeded = () => q.result.createObjectStore('k');
        q.onerror = () => res(null);
        q.onsuccess = () => { const g = q.result.transaction('k').objectStore('k').get('g'); g.onsuccess = () => res(g.result); g.onerror = () => res(null); };
      });
      await fetch('/api/push-sync', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sub: sub.toJSON(), hr: (o && o.hr) || '18:00', tz: Intl.DateTimeFormat().resolvedOptions().timeZone, gaps: (o && o.g) || [] }) });
    } catch (x) {}
  })());
});
