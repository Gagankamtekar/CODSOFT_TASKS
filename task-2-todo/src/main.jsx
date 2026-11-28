import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { registerServiceWorker } from './utils/push'
import { unlockAudio } from './utils/sound'

registerServiceWorker()

// The first click anywhere on the page allows reminder sounds to play
document.addEventListener('pointerdown', unlockAudio, { once: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)