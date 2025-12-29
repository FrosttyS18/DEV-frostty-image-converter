const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const remoteMain = require('@electron/remote/main');

remoteMain.initialize();

// IPC Handlers para controles de janela
let mainWindow = null;

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  app.quit();
});

// Handler para selecionar pasta
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Selecione a pasta com arquivos do Mu Online'
    });

    if (result.canceled) {
      return { canceled: true };
    }

    return {
      canceled: false,
      filePath: result.filePaths[0]
    };
  } catch (error) {
    console.error('[Main] Erro ao selecionar pasta:', error);
    return {
      canceled: true,
      error: 'Não foi possível abrir o seletor'
    };
  }
});

// Handler para ler diretório
ipcMain.handle('read-directory', async (_event, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath);
    return { ok: true, files };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

// Handler para stats de arquivo
ipcMain.handle('get-file-stats', async (_event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return { ok: true, size: stats.size };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: false, // Remove o menu e barra de título
    backgroundColor: '#0A0A0F',
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  // Habilita remote para esta janela
  remoteMain.enable(mainWindow.webContents);

  // Em desenvolvimento, carrega do Vite dev server
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    // DevTools desabilitado por padrão - use Ctrl+Shift+D
    
    // Atalho global para DevTools
    globalShortcut.register('CommandOrControl+Shift+D', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.toggleDevTools();
      }
    });
  } else {
    // Em produção, carrega o build
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  // Limpa atalhos globais
  globalShortcut.unregisterAll();
  
  // Força quit em todas plataformas
  app.quit();
});
