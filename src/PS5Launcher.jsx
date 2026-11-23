import { Suspense, lazy, useEffect, useMemo, useState } from 'react'

const ShelfScene = lazy(() => import('./components/ShelfScene.jsx'))

const api = window.launcherAPI

function playBootChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume()

    // PS-style rising chime: quick ascending triad with a soft shimmer tail
    const notes = [
      { freq: 523.25, start: 0.00, dur: 0.5 },  // C5
      { freq: 659.25, start: 0.12, dur: 0.5 },  // E5
      { freq: 783.99, start: 0.24, dur: 0.6 },  // G5
      { freq: 1046.5, start: 0.38, dur: 1.1 },  // C6
    ]
    const master = ctx.createGain()
    master.gain.value = 0.18
    master.connect(ctx.destination)

    for (const { freq, start, dur } of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq

      const t = ctx.currentTime + start
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(1, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur)

      osc.connect(gain).connect(master)
      osc.start(t)
      osc.stop(t + dur + 0.05)
    }

    // gentle low "whoomp" underneath
    const sub = ctx.createOscillator()
    const subGain = ctx.createGain()
    sub.type = 'sine'
    sub.frequency.setValueAtTime(110, ctx.currentTime)
    sub.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.9)
    subGain.gain.setValueAtTime(0.5, ctx.currentTime)
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0)
    sub.connect(subGain).connect(master)
    sub.start()
    sub.stop(ctx.currentTime + 1.05)
  } catch (_) {}
}

function Cover({ game }) {
  const [src, setSrc] = useState(game.coverDataUrl || null)

  useEffect(() => {
    let cancelled = false
    if (game.cover && !game.coverDataUrl) {
      api.fileToDataUrl(game.cover).then((url) => {
        if (!cancelled && url) setSrc(url)
      })
    } else {
      setSrc(game.coverDataUrl || null)
    }
    return () => { cancelled = true }
  }, [game.cover, game.coverDataUrl])

  if (src) {
    return <img src={src} alt={game.name} className="h-full w-full object-cover" draggable={false} />
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-6xl font-black text-white/10">
      {game.name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

export default function PS5Launcher() {
  const [games, setGames] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [status, setStatus] = useState(null)
  const [booting, setBooting] = useState(true)
  const [view3D, setView3D] = useState(false)

  const [form, setForm] = useState({ name: '', path: '', args: '', cover: '', coverDataUrl: '', notes: '', hoursPlayed: 0 })

  useEffect(() => {
    playBootChime()
    const t = setTimeout(() => setBooting(false), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    api.loadGames().then((g) => {
      setGames(g || [])
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (loaded) api.saveGames(games)
  }, [games, loaded])

  const sortedGames = useMemo(
    () => [...games].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [games],
  )

  const openAdd = (game = null) => {
    setEditing(game)
    setForm(game
      ? { name: game.name, path: game.path, args: game.args || '', cover: game.cover || '', coverDataUrl: game.coverDataUrl || '', notes: game.notes || '', hoursPlayed: game.hoursPlayed ?? 0 }
      : { name: '', path: '', args: '', cover: '', coverDataUrl: '', notes: '', hoursPlayed: 0 })
    setModalOpen(true)
  }

  const pickExe = async () => {
    const p = await api.pickExe()
    if (p) setForm((f) => ({ ...f, path: p }))
  }

  const pickImage = async () => {
    const p = await api.pickImage()
    if (!p) return
    const dataUrl = await api.fileToDataUrl(p)
    setForm((f) => ({ ...f, cover: p, coverDataUrl: dataUrl || '' }))
  }

  const saveGame = () => {
    if (!form.name.trim() || !form.path.trim()) {
      setStatus('Name and launch target are required.')
      return
    }
    setStatus(null)
    const game = {
      id: editing?.id || crypto.randomUUID(),
      name: form.name.trim(),
      path: form.path.trim(),
      args: form.args.trim(),
      cover: form.cover || '',
      coverDataUrl: form.coverDataUrl || '',
      notes: form.notes.trim(),
      hoursPlayed: Math.max(0, Number(form.hoursPlayed) || 0),
      addedAt: editing?.addedAt || Date.now(),
    }
    setGames((gs) => editing ? gs.map((g) => (g.id === game.id ? game : g)) : [...gs, game])
    setModalOpen(false)
  }

  const removeGame = (id) => setGames((gs) => gs.filter((g) => g.id !== id))

  const play = async (game) => {
    setStatus(null)
    const res = await api.launchGame(game)
    if (!res?.ok) setStatus(`Failed to launch "${game.name}": ${res?.error || 'unknown error'}`)
  }

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white">
      {/* Boot intro */}
      {booting && (
        <div
          onClick={() => setBooting(false)}
          className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-black"
        >
          {/* faint scanline sweep */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 overflow-hidden opacity-[0.04]">
            <div className="ps-scanline h-full w-full bg-gradient-to-b from-transparent via-white to-transparent" />
          </div>

          <div className="ps-logo text-8xl font-black tracking-tight text-blue-500">PS</div>
          <div className="ps-subtitle mt-6 text-sm font-medium uppercase tracking-[0.5em] text-white/50">
            MyPS5 Launcher
          </div>
          <div className="ps-subtitle mt-12 text-[10px] uppercase tracking-widest text-white/25">
            click anywhere to skip
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-8 py-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-black shadow-lg shadow-blue-500/30">
            PS
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">MyPS5 Launcher</h1>
            <p className="text-xs text-white/40">{games.length} game{games.length === 1 ? '' : 's'} installed</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView3D((v) => !v)}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
              view3D
                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                : 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            {view3D ? '▦ Grid View' : '🧊 3D Shelf View'}
          </button>
          <button
            onClick={() => openAdd()}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-500 active:scale-95"
          >
            + Add Game
          </button>
        </div>
      </header>

      {/* Status bar */}
      {status && (
        <div className="mx-8 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {status}
        </div>
      )}

      {/* Game grid / 3D shelf */}
      <main className={view3D ? 'h-[calc(100vh-105px)]' : ''}>
        {view3D ? (
          <Suspense fallback={<div className="flex h-full items-center justify-center text-white/40">Loading 3D shelf…</div>}>
            <ShelfScene games={sortedGames} onLaunch={play} />
          </Suspense>
        ) : games.length === 0 ? (
          <div className="flex h-[50vh] flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl opacity-20">🎮</div>
            <h2 className="text-xl font-semibold text-white/70">No games yet</h2>
            <p className="mt-1 text-sm text-white/40">Click "Add Game" to add your first title.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sortedGames.map((game) => (
              <div
                key={game.id}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-white/25 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className="aspect-[3/4] w-full overflow-hidden">
                  <Cover game={game} />
                </div>
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => play(game)}
                    className="mb-2 w-full rounded-lg bg-blue-600 py-2 text-sm font-bold transition hover:bg-blue-500"
                  >
                    ▶ Play
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openAdd(game)}
                      className="flex-1 rounded-md bg-white/10 py-1.5 text-xs font-medium hover:bg-white/20"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeGame(game.id)}
                      className="flex-1 rounded-md bg-red-600/80 py-1.5 text-xs font-medium hover:bg-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between p-2">
                  <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70 backdrop-blur">
                    {/^https?:|steam:|epic:|com\.epicgames:/i.test(game.path) ? 'URL' : 'EXE'}
                  </span>
                  <button
                    onClick={() => removeGame(game.id)}
                    title="Remove game"
                    className="pointer-events-auto rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold text-white/70 backdrop-blur transition hover:bg-red-600 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                  <p className="truncate text-sm font-semibold">{game.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#14141f] p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-bold">{editing ? 'Edit Game' : 'Add Game'}</h2>

            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Game title"
              className="mb-4 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Launch target (.exe path or Steam/Epic/URL)</label>
            <div className="mb-4 flex gap-2">
              <input
                value={form.path}
                onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
                placeholder="C:\Games\game.exe or steam://rungameid/..."
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                onClick={pickExe}
                className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-medium hover:bg-white/10"
              >
                Browse…
              </button>
            </div>

            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Launch arguments (optional)</label>
            <input
              value={form.args}
              onChange={(e) => setForm((f) => ({ ...f, args: e.target.value }))}
              placeholder="-windowed -novid"
              className="mb-4 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Cover / background image</label>
            <div className="mb-6 flex gap-2">
              <input
                value={form.cover}
                onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value, coverDataUrl: '' }))}
                placeholder="Path to image (optional)"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                onClick={pickImage}
                className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-medium hover:bg-white/10"
              >
                Browse…
              </button>
            </div>

            <div className="mb-4 flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Hours played</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.hoursPlayed}
                  onChange={(e) => setForm((f) => ({ ...f, hoursPlayed: e.target.value }))}
                  placeholder="0"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/50">Notes (shown on back cover)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Favorites, progress, reminders…"
              rows={2}
              className="mb-6 w-full resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />

            {form.coverDataUrl && (
              <div className="mb-6 h-32 w-24 overflow-hidden rounded-lg border border-white/10">
                <img src={form.coverDataUrl} alt="preview" className="h-full w-full object-cover" />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={saveGame}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold hover:bg-blue-500"
              >
                {editing ? 'Save Changes' : 'Add Game'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
