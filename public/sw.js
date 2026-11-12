// Service worker: shows push notifications and opens the right page when
// one is tapped. No offline caching: the app needs the network anyway.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: event.data ? event.data.text() : "Keranemie" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Keranemie", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (new URL(client.url).origin === url.origin && "focus" in client) {
          await client.focus();
          return client.navigate(url.href);
        }
      }
      return self.clients.openWindow(url.href);
    })(),
  );
});
