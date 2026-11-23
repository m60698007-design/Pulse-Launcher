const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const isDev = !!process.env.VITE_DEV_SERVER_URL
const GAMES_FILE = path.join(app.getPath('userData'), 'games.json')

let win = null
let runningChildren = new Set()

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0b0b12',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'build', 'index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  for (const child of runningChildren) {
    try { child.kill() } catch (_) {}
  }
  app.quit()
})

// ---------- games.json persistence ----------

function readGames() {
  try {
    return JSON.parse(fs.readFileSync(GAMES_FILE, 'utf8'))
  } catch (_) {
    return []
  }
}

function writeGames(games) {
  fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2), 'utf8')
}

ipcMain.handle('games:load', () => readGames())
ipcMain.handle('games:save', (_e, games) => {
  writeGames(games)
  return true
})

// ---------- file pickers ----------

ipcMain.handle('dialog:pickExe', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Select game executable',
    properties: ['openFile'],
    filters: [
      { name: 'Executables', extensions: ['exe', 'bat', 'cmd'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  return canceled ? null : filePaths[0]
})

ipcMain.handle('dialog:pickImage', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Select cover/background image',
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  return canceled ? null : filePaths[0]
})

ipcMain.handle('file:toDataUrl', (_e, filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase()
    const mime = {
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp',
    }[ext] || 'application/octet-stream'
    return 'data:' + mime + ';base64,' + fs.readFileSync(filePath).toString('base64')
  } catch (_) {
    return null
  }
})

// ---------- launching ----------

function restoreWindow() {
  if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }
}

ipcMain.handle('game:launch', (_e, game) => {
  if (!game || !game.path) return { ok: false, error: 'No path' }

  const target = game.path.trim()

  // Steam / Epic / HTTP(S) URLs -> open externally
  if (/^(steam|epic|http|https|com\.epicgames):\/\//i.test(target) || target.startsWith('steam://') || target.startsWith('com.epicgames://')) {
    shell.openExternal(target)
    // We can't detect when a browser/launcher game closes; restore when the user
    // focuses the window again, or after a generous timeout.
    const once = () => restoreWindow()
    win?.once('focus', once)
    setTimeout(() => { win?.removeListener('focus', once); restoreWindow() }, 90_000)
    return { ok: true }
  }

  // Local executable -> spawn detached, minimize launcher, restore on exit
  try {
    const child = spawn(target, game.args ? game.args.split(' ') : [], {
      detached: true,
      stdio: 'ignore',
      cwd: path.dirname(target),
    })
    child.unref()
    runningChildren.add(child)

    child.on('exit', () => {
      runningChildren.delete(child)
      restoreWindow()
    })
    child.on('error', (err) => {
      runningChildren.delete(child)
      restoreWindow()
      return { ok: false, error: err.message }
    })

    if (win && !win.isDestroyed()) {
      win.minimize()
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})
