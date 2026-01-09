/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

cleanupOutdatedCaches();
// @ts-expect-error - __WB_MANIFEST is injected by workbox
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

self.addEventListener('push', (event) => {
    const data = event.data?.json();
    const title = data?.title || 'Nova Venda!';
    const options = {
        body: data?.body || 'Uma nova venda foi registrada.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: data?.url || '/',
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});
