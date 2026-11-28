// Browser side of Web Push: service worker, permission, and subscription.

// In development the Vite proxy forwards /api to the server, so this can stay empty.
// In production set VITE_API_URL to your deployed server.
const API = import.meta.env.VITE_API_URL ?? ''

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// Called once from main.jsx
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  const register = () =>
    navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW failed', err))

  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register)
}

// Returns the current push subscription, or null
export async function getCurrentSubscription() {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

// Must run from a click handler, because browsers only show the permission prompt after a user action
export async function enablePush() {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.')
  }

  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing

  const res = await fetch(`${API}/api/push/public-key`)
  if (!res.ok) throw new Error('Push server is not reachable. Is it running?')
  const { key } = await res.json()

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  })
}

export async function disablePush(subscription) {
  await fetch(`${API}/api/push/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })
  await subscription.unsubscribe()
}

// Sends the subscription and a copy of the tasks to the server
export function syncTasks(subscription, tasks) {
  return fetch(`${API}/api/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription,
      tzAhead: -new Date().getTimezoneOffset(), // minutes ahead of UTC
      tasks,
    }),
  })
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}