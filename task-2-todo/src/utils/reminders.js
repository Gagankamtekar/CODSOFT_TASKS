// Pure reminder logic. No browser APIs here, so the Node server can import it too.

// Adds days to an ISO date string ("YYYY-MM-DD") without timezone shifts
export function shiftISO(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// Snooze choices shown in the reminder panel (values are milliseconds)
export const SNOOZE_OPTIONS = [
  { label: '10 min', ms: 10 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '1 day', ms: 24 * 60 * 60 * 1000 },
]

// Groups open tasks into:
//   now      = due today and its time has arrived
//   overdue  = due before today
//   today    = due today, no time yet or time still ahead
//   tomorrow = due tomorrow
// Completed and currently snoozed tasks are left out.
export function getReminders(tasks, { todayISO, nowMs = Date.now(), nowTime = '' }) {
  const result = { now: [], overdue: [], today: [], tomorrow: [] }
  if (!Array.isArray(tasks) || !todayISO) return result

  const tomorrowISO = shiftISO(todayISO, 1)

  for (const task of tasks) {
    if (!task || task.completed || !task.dueDate) continue
    if (task.snoozedUntil && task.snoozedUntil > nowMs) continue

    if (task.dueDate < todayISO) {
      result.overdue.push(task)
    } else if (task.dueDate === todayISO) {
      // "HH:MM" strings compare correctly as text
      if (task.dueTime && nowTime && task.dueTime <= nowTime) result.now.push(task)
      else result.today.push(task)
    } else if (task.dueDate === tomorrowISO) {
      result.tomorrow.push(task)
    }
  }
  return result
}