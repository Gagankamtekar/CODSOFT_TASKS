import { unlockAudio, playChime } from '../utils/sound'

export default function SoundSettings({ soundOn, onChange }) {
  const toggle = () => {
    unlockAudio()
    onChange(!soundOn)
  }

  return (
    <div className="notify-row">
      <span>Reminder sound</span>
      <div className="reminder-actions">
        <button onClick={() => { unlockAudio(); playChime() }}>Test</button>
        <button onClick={toggle}>{soundOn ? '🔊 On' : '🔇 Off'}</button>
      </div>
    </div>
  )
}