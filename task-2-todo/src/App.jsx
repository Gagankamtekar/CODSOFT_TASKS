import { useState, useEffect, useRef } from 'react'
import './App.css'
import TaskForm from './components/TaskForm'
import TaskItem from './components/TaskItem'
import CalendarView from './components/CalendarView'
import ReminderPanel from './components/ReminderPanel'
import NotificationSettings from './components/NotificationSettings'
import SoundSettings from './components/SoundSettings'
import { loadTasks } from './utils/storage'
import { getReminders } from './utils/reminders'
import { getCurrentSubscription, syncTasks } from './utils/push'
import { playChime } from './utils/sound'
import { toISO, toHM } from './utils/dates'

const STORAGE_KEY = 'todo-tasks'
const THEME_KEY = 'todo-theme'
const SOUND_KEY = 'todo-sound'

function App() {
  const [tasks, setTasks] = useState(() => loadTasks(STORAGE_KEY))

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark')

  // Reminder sound is on unless the user turned it off
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== 'off')

  // Current time, refreshed every 30 seconds so reminders and snoozes update
  const [now, setNow] = useState(() => Date.now())

  // This browser's push subscription (null when notifications are off)
  const [subscription, setSubscription] = useState(null)

  // Keys of the reminders shown last time, used to detect new ones
  const prevKeysRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off')
  }, [soundOn])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    getCurrentSubscription()
      .then(setSubscription)
      .catch(() => setSubscription(null))
  }, [])

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

  const current = new Date(now)
  const reminders = getReminders(tasks, {
    todayISO: toISO(current),
    nowMs: now,
    nowTime: toHM(current),
  })

  // One key per visible reminder, e.g. "task-id:now"
  const reminderKeys = [
    ...reminders.now.map(t => `${t.id}:now`),
    ...reminders.overdue.map(t => `${t.id}:overdue`),
    ...reminders.today.map(t => `${t.id}:today`),
    ...reminders.tomorrow.map(t => `${t.id}:tomorrow`),
  ]
  const reminderKeyString = reminderKeys.join('|')

  // Play the chime when a reminder appears that wasn't shown before
  useEffect(() => {
    const prev = prevKeysRef.current
    prevKeysRef.current = reminderKeys

    // First load: don't ring for reminders that already existed
    if (prev === null) return

    const hasNew = reminderKeys.some(key => !prev.includes(key))
    if (hasNew && soundOn) playChime()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminderKeyString, soundOn])

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
              <SoundSettings soundOn={soundOn} onChange={setSoundOn} />
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