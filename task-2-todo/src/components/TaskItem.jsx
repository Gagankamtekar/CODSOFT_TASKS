import { useState } from 'react'
import { validateTask, TITLE_MAX } from '../utils/validation'
import { toISO, toHM } from '../utils/dates'

export default function TaskItem({ task, existingTitles = [], onToggle, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState('')
  const [draft, setDraft] = useState({ title: '', category: 'Personal', priority: 'Medium', dueDate: '', dueTime: '' })

  const now = new Date()
  const today = toISO(now)
  const isOverdue = Boolean(task.dueDate) && !task.completed && task.dueDate < today

  const updateDraft = (field, value) => {
    setDraft(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'dueDate' && !value) next.dueTime = ''
      return next
    })
    setEditError('')
  }

  const startEdit = () => {
    setDraft({
      title: task.title,
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate || '',
      dueTime: task.dueTime || '',
    })
    setEditError('')
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditError('')
  }

  const saveEdit = () => {
    const error = validateTask({
      title: draft.title,
      dueDate: draft.dueDate,
      dueTime: draft.dueTime,
      existingTitles,
      today,
      nowTime: toHM(now),
      originalDueDate: task.dueDate,
      originalDueTime: task.dueTime || '',
    })
    if (error) {
      setEditError(error)
      return
    }
    onUpdate(task.id, {
      title: draft.title.trim(),
      category: draft.category,
      priority: draft.priority,
      dueDate: draft.dueDate,
      dueTime: draft.dueTime,
    })
    setEditing(false)
    setEditError('')
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    }
    if (e.key === 'Escape') cancelEdit()
  }

  const meta = (
    <div className="meta">
      <span className="tag">{task.category}</span>
      <span className="tag">{task.priority}</span>
      {task.dueDate && (
        <span className={`tag ${isOverdue ? 'overdue' : ''}`}>📅 {task.dueDate}</span>
      )}
      {task.dueDate && task.dueTime && (
        <span className="tag">⏰ {task.dueTime}</span>
      )}
    </div>
  )

  return (
    <li className={`task priority-${task.priority.toLowerCase()} ${task.completed ? 'done' : ''}`}>
      <input
        type="checkbox"
        id={`task-done-${task.id}`}
        name={`task-done-${task.id}`}
        aria-label={`Mark "${task.title}" as completed`}
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />

      <div className="task-body">
        {editing ? (
          <>
            <input
              className="edit-input"
              name="title"
              value={draft.title}
              maxLength={TITLE_MAX}
              aria-label="Edit task title"
              onChange={(e) => updateDraft('title', e.target.value)}
              onKeyDown={handleTitleKeyDown}
              autoFocus
            />

            <div className="form-row" style={{ marginTop: '0.4rem' }}>
              <select
                aria-label="Edit category"
                value={draft.category}
                onChange={(e) => updateDraft('category', e.target.value)}
              >
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Study">Study</option>
              </select>

              <select
                aria-label="Edit priority"
                value={draft.priority}
                onChange={(e) => updateDraft('priority', e.target.value)}
              >
                <option value="Low">Low priority</option>
                <option value="Medium">Medium priority</option>
                <option value="High">High priority</option>
              </select>

              <input
                type="date"
                aria-label="Edit due date"
                value={draft.dueDate}
                onChange={(e) => updateDraft('dueDate', e.target.value)}
              />

              <input
                type="time"
                aria-label="Edit due time"
                value={draft.dueTime}
                disabled={!draft.dueDate}
                onChange={(e) => updateDraft('dueTime', e.target.value)}
              />
            </div>

            {editError && (
              <p className="error" role="alert">{editError}</p>
            )}
          </>
        ) : (
          <>
            <span className="title">{task.title}</span>
            {meta}
          </>
        )}
      </div>

      <div className="actions">
        {editing ? (
          <>
            <button onClick={saveEdit}>Save</button>
            <button onClick={cancelEdit}>Cancel</button>
          </>
        ) : (
          <button onClick={startEdit}>Edit</button>
        )}
        <button className="delete" onClick={() => onDelete(task.id)}>Delete</button>
      </div>
    </li>
  )
}