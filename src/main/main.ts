// Clear Electron run-as-node flag in case it's set in the environment
delete process.env.ELECTRON_RUN_AS_NODE;

// Dynamic require keeps Electron intact even if run-as-node was previously set
const { app, BrowserWindow, ipcMain } = require('electron') as typeof import('electron');
import path from 'path';
import { registerIsoHandlers } from './registerIpc';

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1240,
    height: 900,
    backgroundColor: '#050814',
    title: 'ISO-20022 Translator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  registerIsoHandlers(ipcMain);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
