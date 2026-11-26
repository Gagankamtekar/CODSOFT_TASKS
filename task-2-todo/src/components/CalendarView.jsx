import { useState } from 'react'
import { toISO, addDays, startOfWeek, startOfMonth, addMonths } from '../utils/dates'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarView({ tasks, onToggle }) {
  const [mode, setMode] = useState('month')   // 'day' | 'week' | 'month'
  const [current, setCurrent] = useState(new Date())
  const todayISO = toISO(new Date())

  // Move forward or backward depending on the mode
  const move = (step) => {
    if (mode === 'day') setCurrent(addDays(current, step))
    if (mode === 'week') setCurrent(addDays(current, step * 7))
    if (mode === 'month') setCurrent(addMonths(current, step))
  }

  // Clicking a day in week or month view opens that day in Day view
  const openDay = (date) => {
    setCurrent(date)
    setMode('day')
  }

  // Build the list of dates to display
  let days = [current]
  if (mode === 'week') {
    const start = startOfWeek(current)
    days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }
  if (mode === 'month') {
    const start = startOfWeek(startOfMonth(current))
    days = Array.from({ length: 42 }, (_, i) => addDays(start, i)) // 6 weeks
  }

  // Heading text
  let title
  if (mode === 'month') {
    title = current.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  } else if (mode === 'week') {
    const first = days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const last = days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    title = `${first} - ${last}`
  } else {
    title = current.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      <div className="cal-header">
        <div className="cal-nav">
          <button aria-label="Previous" onClick={() => move(-1)}>‹</button>
          <button onClick={() => setCurrent(new Date())}>Today</button>
          <button aria-label="Next" onClick={() => move(1)}>›</button>
        </div>
        <strong>{title}</strong>
        <div className="cal-modes">
          {['day', 'week', 'month'].map(m => (
            <button
              key={m}
              className={mode === m ? 'active' : ''}
              onClick={() => setMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={`cal-grid ${mode === 'day' ? 'single' : ''}`}>
        {mode !== 'day' && WEEKDAYS.map(w => (
          <div key={w} className="cal-weekday">{w}</div>
        ))}

        {days.map(day => {
          const iso = toISO(day)
          const dayTasks = tasks.filter(t => t.dueDate === iso)
          const dimmed = mode === 'month' && day.getMonth() !== current.getMonth()
          // Month view shows up to 3 tasks per day, the others show all
          const limit = mode === 'month' ? 3 : Infinity

          return (
            <div
              key={iso}
              className={`cal-cell ${dimmed ? 'other' : ''} ${iso === todayISO ? 'today' : ''}`}
              onClick={() => mode !== 'day' && openDay(day)}
            >
              <div className="cal-date">{day.getDate()}</div>

              {dayTasks.slice(0, limit).map(t => (
                <button
                  type="button"
                  key={t.id}
                  className={`cal-chip priority-${t.priority.toLowerCase()} ${t.completed ? 'done' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onToggle(t.id) }}
                  title={t.title}
                  aria-label={`${t.title}, ${t.completed ? 'completed' : 'pending'}`}
                >
                  {t.title}
                </button>
              ))}

              {dayTasks.length > limit && (
                <div className="cal-more">+{dayTasks.length - limit} more</div>
              )}

              {mode === 'day' && dayTasks.length === 0 && (
                <p className="empty">No tasks due on this day.</p>
              )}
            </div>
          )
        })}
      </div>

      <p className="empty cal-note">
        Tasks without a due date don't appear on the calendar. Click a task to mark it done.
      </p>
    </div>
  )
}