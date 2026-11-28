import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
          <h2>Something went wrong</h2>
          <p>{String(this.state.error?.message || this.state.error)}</p>
          <button onClick={() => location.reload()}>Reload</button>
          <button
            style={{ marginLeft: '0.5rem' }}
            onClick={() => { localStorage.removeItem('todo-tasks'); location.reload() }}
          >
            Reset saved tasks and reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}