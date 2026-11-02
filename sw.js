// Служебный скрипт: офлайн-режим. Страница берётся из сети (с проверкой свежести), при отсутствии сети из кэша.
var V='moy-vkus-20261102-2112';
var FILES=['./','./index.html','./manifest.webmanifest','./sync.js','./inst.js','./base.js','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
function fresh(u){return fetch(new Request(u,{cache:'reload'}))}
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return Promise.all(FILES.map(function(u){return fresh(u).then(function(r){if(r.ok)return c.put(u,r)})}))}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==V}).map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){var r=e.request;if(r.method!=='GET')return;var u=new URL(r.url);if(u.origin!==location.origin||u.pathname.indexOf('/base/')>-1)return;
 e.respondWith(fetch(r,{cache:'no-cache'}).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)})}return res}).catch(function(){return caches.match(r).then(function(m){return m||caches.match('./index.html')})}))});
