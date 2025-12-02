const { contextBridge, ipcRenderer } = require('electron')

const clientId = process.env.SPOTIFY_CLIENT_ID;
contextBridge.exposeInMainWorld('spotify', {
  getClientId: () => ipcRenderer.invoke('get-client-id'),
  getRedirectUri: () => ipcRenderer.invoke('get-redirect-uri'),
  onAuthCode: (callback) => ipcRenderer.on('auth-code', (event, data) => callback(data)),
  openAuthWindow: (url) => ipcRenderer.send('open-auth-window', url),
})