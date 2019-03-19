
var dataCacheName = 'PWA-CMGT-Projects-v1';
var cacheName = 'PWA-CMGT-Projects-3';
var filesToCache = [
    '/',
    '/index.html',
    '/scripts/app.js',
    '/css/materialize.css',
    '/images/sample-1.jpg',
    '/js/localforage.min.js',
    '/js/materialize.js'
];

// Chache all files above on installation as the App Shell
self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Install');
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(filesToCache);
        })
    );
});

// Activate and delete outdated caches
self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== cacheName && key !== dataCacheName) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );

    /*
     * Fixes a corner case in which the app wasn't returning the latest data.
     * You can reproduce the corner case by commenting out the line below and
     * then doing the following steps: 1) load app for first time so that the
     * initial New York City data is shown 2) press the refresh button on the
     * app 3) go offline 4) reload the app. You expect to see the newer NYC
     * data, but you actually see the initial data. This happens because the
     * service worker is not yet activated. The code below essentially lets
     * you activate the service worker faster.
     */
    return self.clients.claim();
});


// If app is requesting any url that has been cached:
// CacheFirstThenNetwork
self.addEventListener('fetch', function (e) {
    console.log('[Service Worker] Fetch', e.request.url);
    e.respondWith(
        caches.match(e.request).then(function (response) {
            if (response) { console.log('('+e.request.url+') loaded from Cache')}
            return response || fetch(e.request);
        })
    );
});
