import { useInputMode } from '../gamepad/inputMode'

const GLYPHS = {
  playstation: { confirm: '✕', back: '○', flip: '△', edit: '□', lb: 'L1', rb: 'R1', stick: 'RS', dpad: '✥' },
  xbox: { confirm: 'A', back: 'B', flip: 'Y', edit: 'X', lb: 'LB', rb: 'RB', stick: 'RS', dpad: '✥' },
  generic: { confirm: 'A', back: 'B', flip: 'Y', edit: 'X', lb: 'LB', rb: 'RB', stick: 'RS', dpad: '✥' },
}

function Badge({ children }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/25 bg-white/10 px-1 text-[10px] font-black text-white/90">
      {children}
    </span>
  )
}

function Hint({ badge, label }) {
  return (
    <span className="flex items-center gap-1.5 text-white/70">
      {badge && <Badge>{badge}</Badge>}
      <span>{label}</span>
    </span>
  )
}

export default function InputHintBar({ context }) {
  const { mode, controllerKind } = useInputMode()
  const g = GLYPHS[controllerKind] || GLYPHS.generic

  let content
  if (mode === 'gamepad') {
    if (context === 'modal') {
      content = (
        <>
          <Hint badge={g.confirm} label="Confirm" />
          <Hint badge={g.back} label="Back" />
        </>
      )
    } else if (context === 'shelf-selected') {
      content = (
        <>
          <Hint badge={g.dpad} label="Browse" />
          <Hint badge={`${g.lb}/${g.rb}`} label="Fast" />
          <Hint badge={g.stick} label="Rotate" />
          <Hint badge={g.flip} label="Flip" />
          <Hint badge={g.edit} label="Edit" />
          <Hint badge={g.confirm} label="Play" />
          <Hint badge={g.back} label="Back" />
        </>
      )
    } else if (context === 'shelf-empty') {
      content = <Hint badge={g.dpad} label="Select a game" />
    } else {
      content = <span className="text-white/50">Gamepad enabled — switch to 3D Shelf view for controller controls</span>
    }
  } else {
    if (context === 'modal') {
      content = <span className="text-white/50">Click Cancel or the action button to close</span>
    } else if (context === 'shelf-selected') {
      content = <span className="text-white/50">Click a case to select • Drag to rotate • Scroll to zoom</span>
    } else if (context === 'shelf-empty') {
      content = <span className="text-white/50">Click a game case to pull it out</span>
    } else {
      content = <span className="text-white/50">Hover a game for Play / Edit / Remove</span>
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-4">
      <div className="flex max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full border border-white/10 bg-black/50 px-5 py-2 text-[11px] font-medium backdrop-blur-md">
        {content}
      </div>
    </div>
  )
}
