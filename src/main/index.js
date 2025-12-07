const { app, BrowserWindow, ipcMain } = require('electron');
const http = require('http');
const path = require('node:path');
const { readFile } = require('node:fs/promises');
require('dotenv').config({ 
  path: path.join(__dirname, '../../.env'),
  quiet: true, 
});

let mainWindow;
let authWindow;

/*
const protocol = "myapp";
const redirectUri = `${protocol}://callback`;
*/
const clientId = process.env.SPOTIFY_CLIENT_ID;
const redirectUri = `http://127.0.0.1:8080/callback`;
const tokenEndpoint = "https://accounts.spotify.com/api/token";
const authorizationEndpoint = "https://accounts.spotify.com/authorize";
const scope = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming';

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

/*
---------- Spotify OAuth window ----------
*/
// Create a server to redirect to after user authorised with Spotify
const createAuthServer = (event) => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, redirectUri);

    if (url.pathname === "/callback") {
      // Get code and state in the query parameters
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      mainWindow.webContents.send("auth-code", { code, state });
    }
  });

  server.listen(8080, "127.0.0.1", () => {
    console.log(`OAuth redirect server running on ${redirectUri}.`);
  });
}

const openAuthWindow = (url) => {
  authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });

  authWindow.loadURL(url);
}

const handleCloseAuthWindow = event => { authWindow.close(); }

const handleGetToken = async (event, code, codeVerifier) => {
  const url = tokenEndpoint;
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  }

  const response = await fetch(url, payload);
  return await response.json();
}

// Refresh token once the current access token expires
const handleRefreshToken = async (refreshToken) => {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  return await response.json();
}

const handleRedirectToSpotifyAuthorize = async (event, codeChallenge, state) =>  {
  const authUrl = new URL(authorizationEndpoint);

  const params =  {
      response_type: 'code',
      client_id: clientId,
      scope,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: redirectUri,
      state: state,
  }

  authUrl.search = new URLSearchParams(params).toString();
  openAuthWindow(authUrl.toString());
}

const loadPage = async (event, relativePath) => {
  const fullPath = path.join(__dirname, "../renderer", relativePath);
  return readFile(fullPath, "utf8");
}

// Create the main window
app.whenReady().then(() => {
  ipcMain.on('close-auth-window', handleCloseAuthWindow);
  ipcMain.handle('redirect', handleRedirectToSpotifyAuthorize);
  ipcMain.handle('get-token', handleGetToken);
  ipcMain.handle('refresh-token', handleRefreshToken);

  ipcMain.handle('load-page', loadPage);
  createWindow();
  createAuthServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

/*
// Register our app to handle all "myapp" protocols
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(protocol, process.execPath, [path.resolve(process.argv[1])]);
  }
} 
else {
  app.setAsDefaultProtocolClient(protocol);
}

// Redirect to the mainWindow after Spotify authorisation
// Windows and Linux code
const gotTheLock = app.requestSingleInstanceLock();  // true if only one instance is running

// Prevent two instances from running
if (!gotTheLock) { app.quit(); }
else {
  // When Spotify OAuth redirects to our deep link, a second instance is launched
  // Electron handles this by blocking that second instance and sending its URL to the main instance
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    const deepLink = commandLine.pop();
    const url = new URL(deepLink);
    // Get code and state in the query parameters
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    // Focus on the main instance's window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();

      // Send an IPC message containing the code from main to renderer
      mainWindow.webContents.send("auth-code", { code, state });
      mainWindow.focus();
    }

    // The commandLine is array of strings in which last element is deep link URL
    console.log('Welcome Back', `You arrived from: ${deepLink}`);
  })

  // Create the main window
  app.whenReady().then(() => {
    ipcMain.handle('get-client-id', () => {
      return process.env.SPOTIFY_CLIENT_ID;
    });
    ipcMain.handle('get-redirect-uri', () => redirectUri);
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    })
  })
}
*/