import { useSyncExternalStore } from 'react'

const MUTE_KEY = 'pulse-launcher-muted'
let ctx = null
let master = null
let muted = false
try { muted = localStorage.getItem(MUTE_KEY) === '1' } catch (_) {}
const muteSubs = new Set()

export function isMuted() { return muted }

export function setMuted(m) {
  muted = !!m
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0') } catch (_) {}
  if (master) master.gain.value = muted ? 0 : 0.9
  muteSubs.forEach((fn) => fn())
}

export function subscribeMute(fn) {
  muteSubs.add(fn)
  return () => muteSubs.delete(fn)
}

export function useMuted() {
  return useSyncExternalStore(subscribeMute, isMuted)
}

function ac() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.9
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// AudioContext requires a user gesture — wake it on the first interaction.
if (typeof window !== 'undefined') {
  const wake = () => ac()
  window.addEventListener('pointerdown', wake)
  window.addEventListener('keydown', wake)
}

let noiseBuf = null
function noise(c, dur) {
  if (!noiseBuf || noiseBuf.duration < dur) {
    noiseBuf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const src = c.createBufferSource()
  src.buffer = noiseBuf
  return src
}

// Soft low-passed mechanical tick for shelf scrolling / selection.
export function sfxTick() {
  const c = ac()
  if (!c || muted) return
  const t = c.currentTime

  const src = noise(c, 0.05)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 3200
  bp.Q.value = 6
  const g = c.createGain()
  g.gain.setValueAtTime(0.4, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  src.connect(bp).connect(g).connect(master)
  src.start(t)
  src.stop(t + 0.06)

  const o = c.createOscillator()
  o.type = 'square'
  o.frequency.setValueAtTime(1400, t)
  o.frequency.exponentialRampToValueAtTime(900, t + 0.04)
  const og = c.createGain()
  og.gain.setValueAtTime(0.1, t)
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  o.connect(og).connect(master)
  o.start(t)
  o.stop(t + 0.06)
}

// Plastic whoosh + snap for the 180° box flip.
export function sfxFlip() {
  const c = ac()
  if (!c || muted) return
  const t = c.currentTime

  const src = noise(c, 0.4)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.2
  bp.frequency.setValueAtTime(500, t)
  bp.frequency.exponentialRampToValueAtTime(3200, t + 0.2)
  bp.frequency.exponentialRampToValueAtTime(700, t + 0.36)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.32, t + 0.14)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
  src.connect(bp).connect(g).connect(master)
  src.start(t)
  src.stop(t + 0.42)

  const o = c.createOscillator()
  o.type = 'triangle'
  o.frequency.setValueAtTime(240, t + 0.3)
  o.frequency.exponentialRampToValueAtTime(120, t + 0.38)
  const og = c.createGain()
  og.gain.setValueAtTime(0.0001, t + 0.3)
  og.gain.exponentialRampToValueAtTime(0.4, t + 0.32)
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.42)
  o.connect(og).connect(master)
  o.start(t + 0.3)
  o.stop(t + 0.45)
}

function blip(freqs, step, dur, gain) {
  const c = ac()
  if (!c || muted) return
  const t = c.currentTime
  freqs.forEach((f, i) => {
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    const g = c.createGain()
    const t0 = t + i * step
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    o.connect(g).connect(master)
    o.start(t0)
    o.stop(t0 + dur + 0.05)
  })
}

export function sfxModalOpen() { blip([660, 880], 0.09, 0.14, 0.16) }
export function sfxModalClose() { blip([880, 660], 0.09, 0.14, 0.16) }

// Warm layered console-style chord for game launch.
export function sfxLaunch() {
  const c = ac()
  if (!c || muted) return
  const t = c.currentTime

  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(6000, t)
  lp.frequency.exponentialRampToValueAtTime(1800, t + 1.6)
  lp.connect(master)

  const notes = [65.41, 130.81, 196.0, 261.63, 329.63, 392.0, 523.25]
  notes.forEach((f, i) => {
    const t0 = t + i * 0.04
    const peak = i < 2 ? 0.16 : 0.11

    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.value = f
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.08)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.5)
    o.connect(g).connect(lp)
    o.start(t0)
    o.stop(t0 + 1.6)

    const o2 = c.createOscillator()
    o2.type = 'sine'
    o2.frequency.value = f * 2
    const g2 = c.createGain()
    g2.gain.value = 0.3
    o2.connect(g2).connect(g)
    o2.start(t0)
    o2.stop(t0 + 1.6)
  })
}
