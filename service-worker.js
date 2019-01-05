"use strict";
/*
For More info on service workers read:
https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
https://developers.google.com/web/fundamentals/primers/service-workers/
*/
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('chiefhacker-v1').then(function(cache) {
      return cache.addAll([
        '/',
        '/speaking.html',
        '/static/css/main.css',
        '/static/img/profile.jpg',
        '/static/img/profile_offline.jpg',
        '/static/js/offline.js',
        '/static/js/notifications.js',
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('fetch', function (event) {
  let url = event.request.url;
  if (/profile\.jpg$/.test(url)) {
    // Connection Type is not available yet
    // https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
    // navigator.connection.type === 'cellular'

    let size = {
      "2g": 'old',
      "3g": 'head',
      "4g": 'medium',
      "slow-2g": 'xsmall'
    }[navigator.connection.effectiveType];

    event.respondWith(
        fetch(url.replace(/\.[a-z]*$/, `_${size}$&`), {
            mode: 'no-cors'
        }).catch(e => caches.match('/static/img/profile.jpg'))
    );
  }
});

self.addEventListener('notificationclose', e => {
  console.log('Closed notification: ', e);
  //Can't do this! InvalidAccessError
  //e.waitUntil(clients.openWindow('/404'));
  e.notification.close();
});

self.addEventListener('notificationclick', ({notification, action}) => {
  if (action === 'thumbs-down') {
    notification.close();
  } else {
    clients.openWindow('/speaking.html');
    notification.close();
  }
});

self.addEventListener('push', function(e) {
  let notification = e.data.json();
  e.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: 'static/img/icons/icon-144x144.png',
      image: '/static/img/speaking.jpg',
      tag: 'push-conference-alert'
    })
  );
});

// Use this to check if the user already has your site open and send it a postMessage
function messageClientWindows() {
  return clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(windowClients => {
    windowClients.forEach((windowClient) => {
      windowClient.postMessage({
        message: 'Received a push message.',
        time: new Date().toString()
      });
    });
  });
}