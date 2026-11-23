/* ============================================================
   POMODORO FOCUS — Electron Preload Script
   Secure bridge between main process and renderer.
   ============================================================ */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  quit: () => ipcRenderer.send('app-quit'),
  minimize: () => ipcRenderer.send('app-minimize'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onAppEvent: (event, callback) => ipcRenderer.on(event, callback),
  removeAppEvent: (event, callback) => ipcRenderer.removeListener(event, callback),
});
