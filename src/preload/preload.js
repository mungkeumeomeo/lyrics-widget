
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('spotify', {
  onAuthCode: (callback) => ipcRenderer.on('auth-code', (event, data) => callback(data)),
  closeAuthWindow: () => ipcRenderer.send('close-auth-window'),
  redirectToSpotifyAuthorize: (codeChallenge, state) => ipcRenderer.invoke('redirect', codeChallenge, state),
  getToken: (code, codeVerifier) => ipcRenderer.invoke('get-token', code, codeVerifier),
  refreshToken: (token) => ipcRenderer.invoke('refresh-token', token),
})

contextBridge.exposeInMainWorld('pages', {
    loadPage: (url) => ipcRenderer.invoke('load-page', url),
})