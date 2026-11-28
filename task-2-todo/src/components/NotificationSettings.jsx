import { useState } from 'react'
import { isPushSupported, enablePush, disablePush } from '../utils/push'

export default function NotificationSettings({ subscription, onChange }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  if (!isPushSupported()) {
    return <p className="hint">Your browser does not support push notifications.</p>
  }
  if (Notification.permission === 'denied') {
    return <p className="hint">Notifications are blocked. Allow them in your browser's site settings, then reload.</p>
  }

  const turnOn = async () => {
    setBusy(true)
    setMessage('')
    try {
      const sub = await enablePush()
      onChange(sub)
      setMessage('Notifications are on. You will get reminders even when this tab is closed.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  const turnOff = async () => {
    setBusy(true)
    setMessage('')
    try {
      await disablePush(subscription)
      onChange(null)
      setMessage('Notifications are off.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="notify-settings">
      <div className="notify-row">
        <span>Browser notifications</span>
        {subscription ? (
          <button onClick={turnOff} disabled={busy}>🔕 Turn off</button>
        ) : (
          <button onClick={turnOn} disabled={busy}>🔔 Enable</button>
        )}
      </div>
      {message && <p className="hint">{message}</p>}
    </div>
  )
}