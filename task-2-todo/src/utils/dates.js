// Converts a Date to "YYYY-MM-DD" (the same format the date input uses)
export function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
// Converts a Date to "HH:MM" (24-hour local time)
export function toHM(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
// Adds a number of days to a date
export function addDays(date, n) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + n)
  return copy
}

// Returns the Sunday that starts the week of this date
export function startOfWeek(date) {
  return addDays(date, -date.getDay())
}

// Returns the first day of the month
export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Moves to the same position in another month (returns the 1st)
export function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1)
}