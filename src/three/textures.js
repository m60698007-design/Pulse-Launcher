import * as THREE from 'three'

function makeCanvas(w, h, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

// Deterministic color from a string so each game gets a stable spine color
export function colorFromString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  const hue = ((hash % 360) + 360) % 360
  return `hsl(${hue}, 55%, 38%)`
}

function hexToRgb(hslStr) {
  // parse hsl(h, s%, l%) -> [r,g,b]
  const m = hslStr.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/)
  if (!m) return [60, 60, 60]
  const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)]
}

export function lighten(hslStr, amt = 30) {
  const m = hslStr.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/)
  if (!m) return hslStr
  return `hsl(${m[1]}, ${m[2]}%, ${Math.min(92, +m[3] + amt)}%)`
}

// Spine: narrow strip, colored, title running vertically.
// mirror=true flips horizontally so text reads correctly on the -x face.
export function makeSpineTexture(title, color, mirror = false) {
  return makeCanvas(160, 1024, (ctx, w, h) => {
    if (mirror) {
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
    }
    const [r, g, b] = hexToRgb(color)
    const grad = ctx.createLinearGradient(0, 0, w, 0)
    grad.addColorStop(0, `rgb(${Math.round(r * 0.55)},${Math.round(g * 0.55)},${Math.round(b * 0.55)})`)
    grad.addColorStop(0.5, `rgb(${r},${g},${b})`)
    grad.addColorStop(1, `rgb(${Math.round(r * 0.55)},${Math.round(g * 0.55)},${Math.round(b * 0.55)})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // subtle edge shading
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(0, 0, 10, h)
    ctx.fillRect(w - 10, 0, 10, h)

    // vertical title text (reads bottom-to-top like real spines)
    ctx.save()
    ctx.translate(w / 2, h - 60)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 3

    const maxW = h - 120
    let size = 64
    ctx.font = `700 ${size}px "Segoe UI", Arial, sans-serif`
    while (ctx.measureText(title).width > maxW && size > 18) {
      size -= 4
      ctx.font = `700 ${size}px "Segoe UI", Arial, sans-serif`
    }
    // wrap long titles onto multiple vertical lines
    const words = title.split(' ')
    const lines = []
    let line = ''
    for (const word of words) {
      const test = line ? line + ' ' + word : word
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    const lineH = size * 1.25
    const totalH = lines.length * lineH
    lines.forEach((l, i) => {
      ctx.fillText(l, 0, -totalH / 2 + lineH / 2 + i * lineH)
    })
    ctx.restore()

    // publisher-ish footer
    ctx.save()
    ctx.translate(w / 2, 46)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.font = '600 26px "Segoe UI", Arial, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillText('PULSE', 0, 0)
    ctx.restore()
  })
}

// Back cover: title, notes, hours played
export function makeBackTexture(game, color) {
  return makeCanvas(1024, 1365, (ctx) => {
    const w = 768, h = 1024 // logical layout space; canvas is 4/3 supersampled
    ctx.scale(4 / 3, 4 / 3)
    const [r, g, b] = hexToRgb(color)
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, `rgb(${Math.round(r * 0.5)},${Math.round(g * 0.5)},${Math.round(b * 0.5)})`)
    grad.addColorStop(1, `rgb(${Math.round(r * 0.28)},${Math.round(g * 0.28)},${Math.round(b * 0.28)})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, 0, w, h)
    const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75)
    vg.addColorStop(0, 'rgba(255,255,255,0.06)')
    vg.addColorStop(1, 'rgba(0,0,0,0.4)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, w, h)

    const pad = 64
    ctx.textBaseline = 'top'

    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '600 30px "Segoe UI", Arial, sans-serif'
    ctx.fillText('PULSE LIBRARY', pad, pad)

    ctx.fillStyle = '#ffffff'
    ctx.font = '800 64px "Segoe UI", Arial, sans-serif'
    wrapText(ctx, game.name || 'Untitled', pad, pad + 56, w - pad * 2, 76)

    // stats block
    const statsY = pad + 56 + 76 * 2 + 30
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    roundRect(ctx, pad, statsY, w - pad * 2, 150, 18)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = '600 26px "Segoe UI", Arial, sans-serif'
    ctx.fillText('HOURS PLAYED', pad + 28, statsY + 24)
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 52px "Segoe UI", Arial, sans-serif'
    ctx.fillText(`${game.hoursPlayed ?? 0}h`, pad + 28, statsY + 62)

    // notes
    const notesY = statsY + 190
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = '600 26px "Segoe UI", Arial, sans-serif'
    ctx.fillText('NOTES', pad, notesY)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '500 32px "Segoe UI", Arial, sans-serif'
    wrapText(ctx, game.notes || 'No notes yet.', pad, notesY + 44, w - pad * 2, 42)
  })
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = String(text).split(' ')
  let line = ''
  let cy = y
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy)
      line = word
      cy += lineH
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, cy)
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Fallback front cover when a game has no image
let fallbackCover = null
export function getFallbackCoverDataUrl(title) {
  if (fallbackCover) return fallbackCover
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 682
  const ctx = canvas.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 512, 682)
  grad.addColorStop(0, '#1e1b4b')
  grad.addColorStop(1, '#0b0b12')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 682)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = '800 72px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'center'
  const words = (title || 'GAME').split(' ')
  let line = ''
  let y = 320
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > 420 && line) {
      ctx.fillText(line, 256, y)
      line = word
      y += 90
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, 256, y)
  fallbackCover = canvas.toDataURL('image/png')
  return fallbackCover
}
