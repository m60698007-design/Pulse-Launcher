import { useEffect, useRef } from 'react'
import { reportGamepadInput } from './inputMode'

export const STICK_DEADZONE = 0.25
export const NAV_REPEAT_MS = 180

// Polls navigator.getGamepads() once per animation frame.
// Returns a ref whose .current is mutated in place every frame:
//   { connected, id, buttons[], justPressed:Set<number>, axes[4], _prev[], _init, _nav }
// Consumers read it inside their own rAF/useFrame loops — no re-renders.
export function useGamepad() {
  const ref = useRef({
    connected: false,
    id: '',
    buttons: [],
    justPressed: new Set(),
    axes: [0, 0, 0, 0],
    _prev: [],
    _init: false,
    _nav: { dir: 0, time: 0 },
  })

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const pads = typeof navigator !== 'undefined' && navigator.getGamepads
        ? navigator.getGamepads()
        : []
      const gp = pads ? Array.from(pads).find((p) => p && p.connected) : null
      const s = ref.current
      s.justPressed.clear()
      s.axes = [0, 0, 0, 0]

      if (gp) {
        s.connected = true
        s.id = gp.id || ''
        const pressed = gp.buttons.map((b) => !!(b && (b.pressed || b.value > 0.5)))

        if (s._init) {
          for (let i = 0; i < pressed.length; i++) {
            if (pressed[i] && !s._prev[i]) s.justPressed.add(i)
          }
        }
        s._prev = pressed
        s._init = true
        s.buttons = pressed

        let active = s.justPressed.size > 0
        for (let i = 0; i < 4; i++) {
          const v = gp.axes[i] || 0
          s.axes[i] = Math.abs(v) > STICK_DEADZONE ? v : 0
          if (s.axes[i] !== 0) active = true
        }
        if (active) reportGamepadInput(s.id)
      } else {
        s.connected = false
        s.buttons = []
        s.axes = [0, 0, 0, 0]
        s._prev = []
        s._init = false
        s._nav.dir = 0
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return ref
}
