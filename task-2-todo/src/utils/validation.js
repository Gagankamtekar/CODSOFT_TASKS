export const TITLE_MIN = 3
export const TITLE_MAX = 100

export function validateTask({ title, dueDate, existingTitles = [], today, originalDueDate }) {
  const t = (title ?? '').trim()

  if (!t) return 'Please enter a task title.'
  if (t.length < TITLE_MIN) return `Title must be at least ${TITLE_MIN} characters.`
  if (t.length > TITLE_MAX) return `Title must be ${TITLE_MAX} characters or fewer.`

  const lower = t.toLowerCase()
  if (existingTitles.some(e => e.trim().toLowerCase() === lower)) {
    return 'This task already exists.'
  }

  if (dueDate && dueDate < today && dueDate !== originalDueDate) {
    return 'Due date cannot be in the past.'
  }
  return ''
}