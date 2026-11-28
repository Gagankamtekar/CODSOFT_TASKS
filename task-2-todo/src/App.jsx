import { useState, useEffect } from 'react'
import './App.css'
import TaskForm from './components/TaskForm'
import TaskItem from './components/TaskItem'
import CalendarView from './components/CalendarView'
import ReminderPanel from './components/ReminderPanel'
import NotificationSettings from './components/NotificationSettings'
import { loadTasks } from './utils/storage'
import { getReminders } from './utils/reminders'
import { getCurrentSubscription, syncTasks } from './utils/push'
import { toISO } from './utils/dates'

const STORAGE_KEY = 'todo-tasks'
const THEME_KEY = 'todo-theme'

function App() {
  const [tasks, setTasks] = useState(() => loadTasks(STORAGE_KEY))

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark')

  // Current time, refreshed every 30 seconds so reminders and snoozes update
  const [now, setNow] = useState(() => Date.now())

  // This browser's push subscription (null when notifications are off)
  const [subscription, setSubscription] = useState(null)

  // Save tasks whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  // Dark mode: add/remove the "dark" class on <body>
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Tick the clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30 * 1000)
    return () => clearInterval(id)
  }, [])

  // On load, pick up a subscription that already exists.
  // Errors are caught so a missing service worker never blocks the UI.
  useEffect(() => {
    getCurrentSubscription()
      .then(setSubscription)
      .catch(() => setSubscription(null))
  }, [])

  // Whenever tasks change and notifications are on, send a copy to the server
  useEffect(() => {
    if (!subscription) return
    syncTasks(subscription, tasks).catch(err => console.error('Could not sync tasks', err))
  }, [subscription, tasks])

  const addTask = (newTask) =>
    setTasks(prev => [{ id: crypto.randomUUID(), completed: false, snoozedUntil: null, ...newTask }, ...prev])

  const toggleTask = (id) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))

  const updateTask = (id, changes) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...changes } : t)))

  const deleteTask = (id) =>
    setTasks(prev => prev.filter(t => t.id !== id))

  const snoozeTask = (id, ms) => updateTask(id, { snoozedUntil: Date.now() + ms })
  const completeTask = (id) => updateTask(id, { completed: true, snoozedUntil: null })

  const reminders = getReminders(tasks, { todayISO: toISO(new Date(now)), nowMs: now })

  const visibleTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'all' || (statusFilter === 'completed' ? t.completed : !t.completed)) &&
    (categoryFilter === 'all' || t.category === categoryFilter)
  )

  const completedCount = tasks.filter(t => t.completed).length
  const pendingCount = tasks.length - completedCount

  return (
    <div className="app">
      <header className="header">
        <h1>My To-Do List</h1>
        <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <main className="container wide">
        <div className="split">
          <div className="split-left">
            <section className="card">
              <CalendarView tasks={tasks} onToggle={toggleTask} />
            </section>
          </div>

          <div className="split-right">
            <ReminderPanel
              reminders={reminders}
              onSnooze={snoozeTask}
              onComplete={completeTask}
            />

            <section className="card">
              <NotificationSettings subscription={subscription} onChange={setSubscription} />
            </section>

            <section className="card">
              <TaskForm
                onAdd={addTask}
                existingTitles={tasks.map(t => t.title)}
              />
            </section>

            <section className="card stats">
              <div><strong>{tasks.length}</strong><span>Total</span></div>
              <div><strong>{completedCount}</strong><span>Completed</span></div>
              <div><strong>{pendingCount}</strong><span>Pending</span></div>
            </section>

            <section className="card">
              <div className="toolbar">
                <input
                  type="search"
                  id="task-search"
                  name="search"
                  placeholder="Search tasks..."
                  aria-label="Search tasks"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  aria-label="Filter by category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Study">Study</option>
                </select>
              </div>

              <ul className="task-list">
                {visibleTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    existingTitles={tasks.filter(t => t.id !== task.id).map(t => t.title)}
                    onToggle={toggleTask}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                  />
                ))}
              </ul>

              {visibleTasks.length === 0 && <p className="empty">No tasks found.</p>}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App