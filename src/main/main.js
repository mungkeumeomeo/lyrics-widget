const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('node:path');
const { readFile } = require('node:fs/promises');
const { getAuthWindow, closeAuthWindow, redirectToSpotifyAuthorize,
        getToken, refreshToken } = require('./authorization.js');
const { getPlaybackState, openWebPlayer, getLyrics, startPlayback, 
        pausePlayback, getCurrentUser, skipToNext, skipToPrevious,
        seekToPosition } = require('./data.js');
const { protocol } = require('./config.js');

let mainWindow;

const MAIN_WINDOW_WIDTH = 400;
const MAIN_WINDOW_HEIGHT = 150;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: MAIN_WINDOW_WIDTH,
    height: MAIN_WINDOW_HEIGHT,
    titleBarStyle: 'hidden',  // Remove the default title bar
    resizable: false,
    transparent: true,
    alwaysOnTop: false,
    show: false,
    icon: path.join(__dirname, '../assets/icons/app-icon.ico'),
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
    },
    frame: false,
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    const authWindow = getAuthWindow();
    if (authWindow) { authWindow.close(); }
  });
}

const closeWindow = (_event) => mainWindow?.close();

const minimizeWindow = (_event) => mainWindow?.minimize();

const loadPage = async (_event, relativePath) => {
  const fullPath = path.join(__dirname, "../renderer", relativePath);
  return readFile(fullPath, "utf8");
}

const setAlwaysOnTop = (_event, enabled) => {
  mainWindow?.setAlwaysOnTop(Boolean(enabled));
};

const moveToCorner = (_event, corner) => {
  if (!mainWindow) return;
  const display = screen.getDisplayMatching(mainWindow.getBounds());
  const { width, height, x, y } = display.workArea;
  // Margin so the edges of the window are still visible, esp the progress bar
  const MARGIN = 2;

  let newX = x;
  let newY = y;    

  if (corner === 'top-right') {
    newX = x + width - MAIN_WINDOW_WIDTH - MARGIN;
  } else if (corner === 'bottom-right') {
    newX = x + width - MAIN_WINDOW_WIDTH - MARGIN;
    newY = y + height - MAIN_WINDOW_HEIGHT - MARGIN;
  } else if (corner === 'bottom-left') {
    newY = y + height - MAIN_WINDOW_HEIGHT - MARGIN;
  }

  mainWindow.setPosition(newX, newY);
}

// Register our app to handle all "lymeric" protocols
if (process.defaultApp) {  // Launch Electron in dev mode
  if (process.argv.length >= 2) {
    // Telling the OS to "run Electron with these arguments"
    app.setAsDefaultProtocolClient(protocol, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {  // Launch Electron in production mode
  app.setAsDefaultProtocolClient(protocol);
}

// Redirect to the mainWindow after Spotify authorisation
// Windows and Linux code
const gotTheLock = app.requestSingleInstanceLock();  // True if only one instance is running

// Prevent two instances from running
if (!gotTheLock) { app.quit(); }
else {
  // When Spotify OAuth redirects to our deep link, a second instance is launched
  // Electron handles this by blocking that second instance and sending its URL to the main instance
  app.on('second-instance', (_event, commandLine, workingDirectory) => {
    // The commandLine is array of strings in which last element is deep link URL
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
  });

  // Create the main window
  app.whenReady().then(() => {
    // Window controls
    ipcMain.on('close-window', closeWindow);
    ipcMain.on('minimize-window', minimizeWindow);
    ipcMain.on('always-on-top', setAlwaysOnTop);
    ipcMain.on('move-to-corner', moveToCorner);

    // Spotify OAuth
    ipcMain.on('close-auth-window', closeAuthWindow);
    ipcMain.handle('redirect', redirectToSpotifyAuthorize);
    ipcMain.handle('get-token', getToken);
    ipcMain.handle('refresh-token', refreshToken);

    // Page load
    ipcMain.handle('load-page', loadPage);

    // API calls
    ipcMain.handle('get-playback-state', getPlaybackState);
    ipcMain.handle('get-current-user', getCurrentUser);
    ipcMain.handle('start-playback', startPlayback);
    ipcMain.handle('pause-playback', pausePlayback);
    ipcMain.handle('skip-to-next', skipToNext);
    ipcMain.handle('skip-to-previous', skipToPrevious);
    ipcMain.handle('seek-to-position', seekToPosition)

    // Web scraping
    ipcMain.handle('open-web-player', openWebPlayer);
    ipcMain.handle('get-lyrics', getLyrics);

    createWindow();

    mainWindow.setMenuBarVisibility(false);

    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      mainWindow.focus();
    });

    // Open a window if none are open in MacOS
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}