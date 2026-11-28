self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('push', event => {
  let data = { title: 'To-Do reminder', body: 'You have a task to check.', tag: undefined, url: '/' }
  try {
    data = { ...data, ...event.data.json() }
  } catch {
    // Payload was empty or not JSON, so keep the defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      renotify: true,        // alert again even when replacing an existing notification
      silent: false,         // let the operating system play its notification sound
      vibrate: [200, 100, 200],
      icon: '/favicon.svg',
      data: { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if ('focus' in client) return client.focus()
    }
    return self.clients.openWindow(targetUrl)
  })())
})