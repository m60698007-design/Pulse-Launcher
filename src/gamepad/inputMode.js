import { useSyncExternalStore } from 'react'

// Tracks whether the user's last interaction was gamepad or mouse/keyboard,
// and classifies the connected controller (playstation | xbox | generic).

let snapshot = { mode: 'mouse', controllerKind: 'generic' }
const listeners = new Set()

function detectController(id = '') {
  const s = id.toLowerCase()
  if (
    s.includes('ps3') || s.includes('ps4') || s.includes('ps5') ||
    s.includes('dualshock') || s.includes('dualsense') ||
    s.includes('playstation') || s.includes('wireless controller')
  ) return 'playstation'
  if (s.includes('xbox') || s.includes('xinput') || s.includes('x360')) return 'xbox'
  return 'generic'
}

function emit() {
  listeners.forEach((fn) => fn())
}

function setSnapshot(mode, controllerKind) {
  snapshot = { mode, controllerKind }
  emit()
}

export function reportGamepadInput(id = '') {
  const kind = detectController(id)
  if (snapshot.mode !== 'gamepad' || snapshot.controllerKind !== kind) {
    setSnapshot('gamepad', kind)
  }
}

export function reportMouseKeyInput() {
  if (snapshot.mode !== 'mouse') setSnapshot('mouse', snapshot.controllerKind)
}

// Bind once — pointer/keyboard input always wins "last interaction".
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', reportMouseKeyInput, { capture: true })
  window.addEventListener('keydown', reportMouseKeyInput, { capture: true })
}

export function getInputSnapshot() {
  return snapshot
}

export function subscribeInput(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useInputMode() {
  return useSyncExternalStore(subscribeInput, getInputSnapshot)
}
