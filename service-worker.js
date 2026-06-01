var CACHE_NAME = 'sapkey-v1';
var urlsToCache = [
  'SAPKEY-FINAL.html',
  'manifest.json',
  'version.json'
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.map(function(n) {
          if (n !== CACHE_NAME) return caches.delete(n);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  if (url.pathname === '/version.json' || url.pathname === 'version.json') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(function(res) {
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  if (url.pathname === '/manifest.json' || url.pathname === 'manifest.json') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(function(res) {
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(res) {
      if (res) return res;
      return fetch(e.request).then(function(netRes) {
        if (!netRes || netRes.status !== 200 || netRes.type !== 'basic') return netRes;
        var cloned = netRes.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, cloned);
        });
        return netRes;
      });
    })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'CHECK_VERSION') {
    fetch('version.json?_=' + Date.now(), { cache: 'no-store' }).then(function(res) {
      return res.json();
    }).then(function(versionData) {
      self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'VERSION_CHECK', version: versionData.version, data: versionData });
        });
      });
    }).catch(function() {});
  }
});
