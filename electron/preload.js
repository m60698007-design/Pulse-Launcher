const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('launcherAPI', {
  pickExe: () => ipcRenderer.invoke('dialog:pickExe'),
  pickImage: () => ipcRenderer.invoke('dialog:pickImage'),
  launchGame: (game) => ipcRenderer.invoke('game:launch', game),
  loadGames: () => ipcRenderer.invoke('games:load'),
  saveGames: (games) => ipcRenderer.invoke('games:save', games),
  fileToDataUrl: (filePath) => ipcRenderer.invoke('file:toDataUrl', filePath),
})
