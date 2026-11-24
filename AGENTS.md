# Pulse Launcher

Electron + Vite + React + Tailwind desktop launcher.

## Commands
- `npm run dev` — Vite dev server + Electron (hot reload)
- `npm run build && npm start` — production build + launch
- `npm run dist` — package a Windows installer/portable build via electron-builder
  (output in `dist/`; Vite renderer output is `build/` to avoid clobbering it)
- `npm start` — launch against `dist/` (run `npm run build` first)

## Notes
- The environment sets `ELECTRON_RUN_AS_NODE=1`, which makes Electron run as plain
  Node and `require('electron')` return a path string instead of the API.
  Launch with `env -u ELECTRON_RUN_AS_NODE npx electron .` if the app crashes
  with `Cannot read properties of undefined (reading 'getPath')`.
- If `node_modules/electron/dist` is missing `electron.exe` (blocked install
  scripts), extract the cached zip from
  `%LOCALAPPDATA%\electron\Cache\<hash>\electron-v*-win32-x64.zip` into
  `node_modules/electron/dist` and write `electron.exe` (no newline) to
  `node_modules/electron/path.txt`.
- Game list persists to `games.json` in Electron's `userData` directory.
