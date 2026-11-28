const CATEGORIES = ['Work', 'Personal', 'Study']
const PRIORITIES = ['Low', 'Medium', 'High']
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

// Loads tasks from Local Storage and repairs anything that is missing or broken
export function loadTasks(key) {
  let raw
  try {
    raw = localStorage.getItem(key)
  } catch {
    return [] // Storage is blocked (for example, in some private browsing modes)
  }
  if (!raw) return []

  let data
  try {
    data = JSON.parse(raw)
  } catch {
    // Data is corrupted. Keep a copy so nothing is lost, then start fresh.
    try {
      localStorage.setItem(`${key}-corrupted-backup`, raw)
    } catch {
      // ignore: backup is best-effort
    }
    return []
  }

  if (!Array.isArray(data)) return []

  const usedIds = new Set()
  const tasks = []

  data.forEach((item) => {
    if (!item || typeof item !== 'object') return

    const title = typeof item.title === 'string' ? item.title.trim() : ''
    if (!title) return

    let id = (typeof item.id === 'string' || typeof item.id === 'number')
      ? item.id
      : crypto.randomUUID()
    if (usedIds.has(id)) id = crypto.randomUUID()
    usedIds.add(id)

    const dueDate = typeof item.dueDate === 'string' && DATE_PATTERN.test(item.dueDate)
      ? item.dueDate
      : ''

    tasks.push({
      id,
      title,
      completed: item.completed === true,
      category: CATEGORIES.includes(item.category) ? item.category : 'Personal',
      priority: PRIORITIES.includes(item.priority) ? item.priority : 'Medium',
      dueDate,
      // A time only makes sense with a date
      dueTime: dueDate && typeof item.dueTime === 'string' && TIME_PATTERN.test(item.dueTime)
        ? item.dueTime
        : '',
      snoozedUntil: typeof item.snoozedUntil === 'number' ? item.snoozedUntil : null,
    })
  })

  return tasks
}