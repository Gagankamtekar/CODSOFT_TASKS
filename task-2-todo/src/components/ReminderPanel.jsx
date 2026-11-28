import { SNOOZE_OPTIONS } from '../utils/reminders'

const LABELS = {
  overdue: 'Overdue',
  today: 'Due today',
  tomorrow: 'Due tomorrow',
}

export default function ReminderPanel({ reminders, onSnooze, onComplete }) {
  const overdue = reminders?.overdue ?? []
  const today = reminders?.today ?? []
  const tomorrow = reminders?.tomorrow ?? []

  const items = [
    ...overdue.map(t => ({ task: t, kind: 'overdue' })),
    ...today.map(t => ({ task: t, kind: 'today' })),
    ...tomorrow.map(t => ({ task: t, kind: 'tomorrow' })),
  ]

  if (items.length === 0) return null

  return (
    <section className="card reminder-panel" aria-label="Task reminders">
      <h2 className="reminder-heading">🔔 Reminders ({items.length})</h2>

      <ul className="reminder-list">
        {items.map(({ task, kind }) => (
          <li key={task.id} className={`reminder reminder-${kind}`}>
            <div className="reminder-info">
              <strong>{task.title}</strong>
              <span className={`tag ${kind === 'overdue' ? 'overdue' : ''}`}>{LABELS[kind]}</span>
            </div>

            <div className="reminder-actions">
              <button onClick={() => onComplete(task.id)}>Done</button>
              {SNOOZE_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  className="snooze-btn"
                  onClick={() => onSnooze(task.id, opt.ms)}
                >
                  Snooze {opt.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}