import { useState } from 'react'
import { validateTask, TITLE_MAX } from '../utils/validation'
import { toISO, toHM } from '../utils/dates'

const EMPTY_FORM = { title: '', category: 'Personal', priority: 'Medium', dueDate: '', dueTime: '' }

export default function TaskForm({ onAdd, existingTitles = [] }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      // Clearing the date also clears the time
      if (name === 'dueDate' && !value) next.dueTime = ''
      return next
    })
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const now = new Date()
    const validationError = validateTask({
      title: form.title,
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      existingTitles,
      today: toISO(now),
      nowTime: toHM(now),
    })
    if (validationError) {
      setError(validationError)
      return
    }

    onAdd({
      title: form.title.trim(),
      category: form.category,
      priority: form.priority,
      dueDate: form.dueDate,
      dueTime: form.dueTime,
    })
    setForm(EMPTY_FORM)
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <input
          id="new-task-title"
          name="title"
          placeholder="What needs to be done?"
          value={form.title}
          onChange={handleChange}
          maxLength={TITLE_MAX}
          aria-label="Task title"
          aria-invalid={!!error}
        />
        <button type="submit">Add Task</button>
      </div>

      <div className="form-row">
        <select id="new-task-category" name="category" value={form.category} onChange={handleChange}>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Study">Study</option>
        </select>
        <select id="new-task-priority" name="priority" value={form.priority} onChange={handleChange}>
          <option value="Low">Low priority</option>
          <option value="Medium">Medium priority</option>
          <option value="High">High priority</option>
        </select>
        <input
          type="date"
          name="dueDate"
          value={form.dueDate}
          onChange={handleChange}
          aria-label="Due date"
        />
        <input
          type="time"
          name="dueTime"
          value={form.dueTime}
          onChange={handleChange}
          disabled={!form.dueDate}
          aria-label="Due time"
        />
      </div>

      {error && <p className="error" role="alert">{error}</p>}
    </form>
  )
}