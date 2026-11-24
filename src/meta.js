// Shared metadata for game case finishes and completion statuses.

export const FINISH_META = {
  standard: { label: 'Standard', hint: 'Matte printed case' },
  steelbook: { label: 'Steelbook', hint: 'Metallic PBR finish' },
  holographic: { label: 'Holographic', hint: 'Iridescent sheen' },
}

export const STATUS_META = {
  backlog: { label: 'Backlog', chip: 'bg-slate-500/70' },
  playing: { label: 'Playing', chip: 'bg-blue-600/80' },
  completed: { label: 'Completed', chip: 'bg-emerald-600/80' },
  platinum: { label: '100% Platinum', chip: 'bg-amber-500/80' },
}
