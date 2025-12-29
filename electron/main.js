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

// Handler para selecionar pasta de origem
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
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

// Handler para selecionar pasta de destino (conversão)
ipcMain.handle('select-output-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Escolha onde salvar os arquivos convertidos',
      buttonLabel: 'Salvar Aqui'
    });

    if (result.canceled) {
      return { canceled: true };
    }

    return {
      canceled: false,
      folderPath: result.filePaths[0]
    };
  } catch (error) {
    console.error('[Main] Erro ao selecionar pasta destino:', error);
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

// Handler para ler arquivo
ipcMain.handle('read-file', async (_event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return { ok: true, data: Array.from(data) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

// Handler para escrever arquivo
ipcMain.handle('write-file', async (_event, { filePath, data }) => {
  try {
    console.log('[Main] Escrevendo arquivo:', filePath);
    console.log('[Main] Tamanho dos dados:', data.length, 'bytes');
    
    // Garante que o diretório existe
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      console.log('[Main] Criando diretório:', dir);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Escreve o arquivo
    const buffer = Buffer.from(data);
    fs.writeFileSync(filePath, buffer, { mode: 0o666 });
    
    console.log('[Main] Arquivo escrito com sucesso!');
    
    // Verifica se o arquivo foi criado
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log('[Main] Arquivo verificado - tamanho:', stats.size, 'bytes');
      
      // Remove atributo de oculto no Windows (se existir)
      if (process.platform === 'win32') {
        try {
          const { execSync } = require('child_process');
          execSync(`attrib -h "${filePath}"`, { windowsHide: true });
          console.log('[Main] Atributo de oculto removido (Windows)');
        } catch (err) {
          // Ignora erro se não conseguir remover atributo
          console.log('[Main] Não foi possível remover atributo de oculto:', err.message);
        }
      }
      
      return { ok: true, size: stats.size };
    } else {
      console.error('[Main] ERRO: Arquivo não foi criado!');
      return { ok: false, error: 'Arquivo não foi criado após escrita' };
    }
  } catch (error) {
    console.error('[Main] Erro ao escrever arquivo:', error);
    return { ok: false, error: error.message };
  }
});

// Path utilities
ipcMain.handle('path-join', async (_event, paths) => {
  return path.join(...paths);
});

ipcMain.handle('path-extname', async (_event, filePath) => {
  return path.extname(filePath);
});

ipcMain.handle('path-dirname', async (_event, filePath) => {
  return path.dirname(filePath);
});

ipcMain.handle('path-basename', async (_event, filePath) => {
  return path.basename(filePath);
});

// Handler para abrir pasta no explorador
ipcMain.handle('open-folder', async (_event, folderPath) => {
  try {
    const { shell } = require('electron');
    await shell.openPath(folderPath);
    return { ok: true };
  } catch (error) {
    console.error('[Main] Erro ao abrir pasta:', error);
    return { ok: false, error: error.message };
  }
});

// Handler para mostrar arquivo no explorador
ipcMain.handle('show-file-in-folder', async (_event, filePath) => {
  try {
    const { shell } = require('electron');
    shell.showItemInFolder(filePath);
    return { ok: true };
  } catch (error) {
    console.error('[Main] Erro ao mostrar arquivo:', error);
    return { ok: false, error: error.message };
  }
});

function createWindow() {
  // Caminho absoluto do preload
  const preloadPath = path.resolve(__dirname, './preload.cjs');
  
  console.log('[Main] =================================');
  console.log('[Main] Caminho do preload:', preloadPath);
  console.log('[Main] __dirname:', __dirname);
  console.log('[Main] Arquivo existe?', fs.existsSync(preloadPath));
  
  if (!fs.existsSync(preloadPath)) {
    console.error('[Main] ERRO: Preload não encontrado!');
    console.error('[Main] Listando arquivos em electron/:');
    console.log(fs.readdirSync(__dirname));
  }
  console.log('[Main] =================================');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  // Mostra quando pronto
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

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
