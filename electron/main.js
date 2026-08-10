const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

// ─── Backend JAR launcher ─────────────────────────────────────────────────────
function startBackend() {
  const jarPath = path.join(process.resourcesPath, 'backend', 'backend-local.jar');
  const devJarPath = path.join(__dirname, '..', '..', 'backend-local', 'target', 'backend-local.jar');
  const actualJarPath = fs.existsSync(jarPath) ? jarPath : devJarPath;

  if (!fs.existsSync(actualJarPath)) {
    console.warn('Backend JAR not found. Build backend-local first.');
    return;
  }

  console.log('Starting backend from:', actualJarPath);
  backendProcess = spawn('java', ['-jar', actualJarPath], {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backendProcess.stdout.on('data', (data) => console.log(`[Backend] ${data}`));
  backendProcess.stderr.on('data', (data) => console.error(`[Backend ERR] ${data}`));
  backendProcess.on('close', (code) => console.log(`Backend exited with code ${code}`));
}

// ─── Main window ──────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Hotel Manager'
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'frontend', 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startBackend();
  // Small delay to let Spring Boot start
  setTimeout(createWindow, 2000);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});

// ─── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getPath('userData'));
ipcMain.handle('open-external', async (_, url) => shell.openExternal(url));
