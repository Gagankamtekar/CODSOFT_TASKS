export const TITLE_MIN = 3
export const TITLE_MAX = 100
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function validateTask({
  title,
  dueDate,
  dueTime = '',
  existingTitles = [],
  today,
  nowTime = '',
  originalDueDate,
  originalDueTime,
}) {
  const t = (title ?? '').trim()

  if (!t) return 'Please enter a task title.'
  if (t.length < TITLE_MIN) return `Title must be at least ${TITLE_MIN} characters.`
  if (t.length > TITLE_MAX) return `Title must be ${TITLE_MAX} characters or fewer.`

  const lower = t.toLowerCase()
  if (existingTitles.some(e => e.trim().toLowerCase() === lower)) {
    return 'This task already exists.'
  }

  if (dueTime && !dueDate) return 'Pick a due date before setting a time.'
  if (dueTime && !TIME_PATTERN.test(dueTime)) return 'Time must be in HH:MM format.'

  if (dueDate && dueDate < today && dueDate !== originalDueDate) {
    return 'Due date cannot be in the past.'
  }

  // Only block times that have already passed when the date or time was changed
  const changed = dueDate !== originalDueDate || dueTime !== originalDueTime
  if (dueDate === today && dueTime && dueTime < nowTime && changed) {
    return 'That time has already passed today.'
  }

  return ''
}