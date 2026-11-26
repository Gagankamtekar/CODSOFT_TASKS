import { useState, useEffect } from 'react'
import './App.css'
import TaskForm from './components/TaskForm'
import TaskItem from './components/TaskItem'
import CalendarView from './components/CalendarView'
import { loadTasks } from './utils/storage'

const STORAGE_KEY = 'todo-tasks'
const THEME_KEY = 'todo-theme'

function App() {
  // Load tasks from Local Storage safely
  const [tasks, setTasks] = useState(() => loadTasks(STORAGE_KEY))

  // Search and filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Dark mode state (remembered in Local Storage)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark')

  // Save tasks whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  // Dark mode: add/remove the "dark" class on <body>
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Add a task with a unique ID and a safe functional update
  const addTask = (newTask) =>
    setTasks(prev => [{ id: crypto.randomUUID(), completed: false, ...newTask }, ...prev])

  // Complete / pending
  const toggleTask = (id) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))

  // Edit
  const updateTask = (id, changes) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...changes } : t)))

  // Delete
  const deleteTask = (id) =>
    setTasks(prev => prev.filter(t => t.id !== id))

  // Apply search and filters
  const visibleTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'all' || (statusFilter === 'completed' ? t.completed : !t.completed)) &&
    (categoryFilter === 'all' || t.category === categoryFilter)
  )

  // Counts
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
          {/* LEFT: Calendar */}
          <div className="split-left">
            <section className="card">
              <CalendarView tasks={tasks} onToggle={toggleTask} />
            </section>
          </div>

          {/* RIGHT: Form, stats, and list */}
          <div className="split-right">
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
