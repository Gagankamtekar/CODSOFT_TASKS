// server/index.js
import express from 'express'
import cors from 'cors'
import webpush from 'web-push'
import fs from 'node:fs'
import { getReminders } from '../src/utils/reminders.js'

const PORT = process.env.PORT || 4000
const DATA_FILE = new URL('./data.json', import.meta.url)
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT = 'mailto:you@example.com' } = process.env

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Missing VAPID keys. Run: npx web-push generate-vapid-keys, then copy them into server/.env')
  process.exit(1)
}
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

// Reminder times in the user's local time
const DAILY_HOUR = 9      // overdue and due-today alerts
const EVENING_HOUR = 18   // due-tomorrow alerts

// Simple JSON file storage. Fine for a learning project, use a real database later.
function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch {
    return { subscriptions: {} }
  }
}
function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2))
}
let db = load()

// Keep only the fields the reminder logic needs
function sanitizeTasks(tasks) {
  if (!Array.isArray(tasks)) return []
  return tasks.slice(0, 500).filter(t => t && typeof t === 'object').map(t => ({
    id: String(t.id),
    title: String(t.title ?? '').slice(0, 100),
    dueDate: typeof t.dueDate === 'string' ? t.dueDate : '',
    completed: t.completed === true,
    snoozedUntil: typeof t.snoozedUntil === 'number' ? t.snoozedUntil : null,
  }))
}

function messageFor(task, kind) {
  const messages = {
    overdue: ['⚠️ Overdue task', `"${task.title}" was due ${task.dueDate}.`],
    today: ['📅 Due today', `"${task.title}" is due today.`],
    tomorrow: ['⏰ Due tomorrow', `"${task.title}" is due tomorrow.`],
  }
  const [title, body] = messages[kind]
  return { title, body, tag: `${task.id}-${kind}`, url: '/' }
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '200kb' }))

app.get('/api/push/public-key', (req, res) => {
  res.json({ key: VAPID_PUBLIC_KEY })
})

// Called on subscribe and whenever the tasks change (upsert)
app.post('/api/push/subscribe', (req, res) => {
  const { subscription, tzAhead = 0, tasks } = req.body ?? {}
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Missing subscription' })

  const existing = db.subscriptions[subscription.endpoint]
  db.subscriptions[subscription.endpoint] = {
    subscription,
    tzAhead: Number(tzAhead) || 0,
    tasks: sanitizeTasks(tasks),
    sent: existing?.sent ?? {},   // remember what was already sent
  }
  save()
  res.json({ ok: true })
})

app.post('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body ?? {}
  delete db.subscriptions[endpoint]
  save()
  res.json({ ok: true })
})

// Runs every minute and sends any reminders that are due
async function checkReminders() {
  const nowMs = Date.now()

  for (const [endpoint, entry] of Object.entries(db.subscriptions)) {
    const local = new Date(nowMs + entry.tzAhead * 60 * 1000)
    const todayISO = local.toISOString().slice(0, 10)
    const hour = local.getUTCHours()

    const reminders = getReminders(entry.tasks, { todayISO, nowMs })
    const due = []
    if (hour >= DAILY_HOUR) {
      reminders.overdue.forEach(t => due.push([t, 'overdue']))
      reminders.today.forEach(t => due.push([t, 'today']))
    }
    if (hour >= EVENING_HOUR) {
      reminders.tomorrow.forEach(t => due.push([t, 'tomorrow']))
    }

    for (const [task, kind] of due) {
      // Including snoozedUntil means each snooze gets its own notification when it ends
      const key = `${todayISO}:${task.id}:${kind}:${task.snoozedUntil ?? 0}`
      if (entry.sent[key]) continue // already sent for this snooze

      try {
        await webpush.sendNotification(entry.subscription, JSON.stringify(messageFor(task, kind)))
        entry.sent[key] = true
      } catch (err) {
        // 404 or 410 means the browser removed this subscription
        if (err.statusCode === 404 || err.statusCode === 410) {
          delete db.subscriptions[endpoint]
          break
        }
        console.error('Push failed:', err.statusCode, err.body)
      }
    }

    // Drop sent-markers from previous days
    if (db.subscriptions[endpoint]) {
      for (const k of Object.keys(entry.sent)) {
        if (!k.startsWith(todayISO)) delete entry.sent[k]
      }
    }
  }
  save()
}

setInterval(() => {
  checkReminders().catch(err => console.error('Reminder check failed', err))
}, 60 * 1000)

app.listen(PORT, () => {
  console.log(`Push server running on http://localhost:${PORT}`)
})