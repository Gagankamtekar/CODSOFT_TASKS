// Plays a short two-tone chime with the Web Audio API. No audio file needed.
let ctx = null

// Browsers only allow sound after a user action. Call this from a click or tap.
export function unlockAudio() {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext
      if (!Ctor) return
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') ctx.resume()
  } catch {
    // Audio is not available. Reminders still appear on screen.
  }
}

export function playChime() {
  if (!ctx || ctx.state !== 'running') return

  const notes = [660, 880]
  const start = ctx.currentTime

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = start + i * 0.25

    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)

    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.45)
  })
}