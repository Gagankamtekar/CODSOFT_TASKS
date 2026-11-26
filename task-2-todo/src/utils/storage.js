const CATEGORIES = ['Work', 'Personal', 'Study']
const PRIORITIES = ['Low', 'Medium', 'High']
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

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

    // A task must have a title. Skip it if the title is missing or empty.
    const title = typeof item.title === 'string' ? item.title.trim() : ''
    if (!title) return

    // Keep the saved id if it is usable and unique, otherwise create a new one
    let id = (typeof item.id === 'string' || typeof item.id === 'number')
      ? item.id
      : crypto.randomUUID()
    if (usedIds.has(id)) id = crypto.randomUUID()
    usedIds.add(id)

    tasks.push({
      id,
      title,
      completed: item.completed === true,
      category: CATEGORIES.includes(item.category) ? item.category : 'Personal',
      priority: PRIORITIES.includes(item.priority) ? item.priority : 'Medium',
      dueDate: typeof item.dueDate === 'string' && DATE_PATTERN.test(item.dueDate)
        ? item.dueDate
        : '',
    })
  })

  return tasks
}
