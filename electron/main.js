const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const remoteMain = require('@electron/remote/main');

remoteMain.initialize();

// IPC Handlers para controles de janela
let mainWindow = null;
let fileListWindow = null;

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

// Handler para selecionar pasta de origem e abrir janela de lista
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Selecione a pasta com arquivos do Mu Online'
    });

    if (result.canceled) {
      return { canceled: true };
    }

    const folderPath = result.filePaths[0];
    
    // Abre a janela de lista de arquivos
    openFileListWindow(folderPath);

    return {
      canceled: false,
      filePath: folderPath
    };
  } catch (error) {
    console.error('[Main] Erro ao selecionar pasta:', error);
    return {
      canceled: true,
      error: 'Não foi possível abrir o seletor'
    };
  }
});

// Abre ou atualiza janela de lista de arquivos
function openFileListWindow(folderPath) {
  // Se ja existe, REUTILIZA e apenas atualiza o conteudo
  if (fileListWindow && !fileListWindow.isDestroyed()) {
    console.log('[Main] Reutilizando janela de lista existente');
    
    // Atualiza os arquivos
    updateFileList(folderPath);
    
    // Traz para frente se estava minimizada ou atras
    if (fileListWindow.isMinimized()) {
      fileListWindow.restore();
    }
    fileListWindow.focus();
    
    return;
  }
  
  // Cria nova janela
  console.log('[Main] Criando nova janela de lista');
  
  const preloadPath = path.resolve(__dirname, './preload.cjs');
  
  fileListWindow = new BrowserWindow({
    width: 500,
    height: 700,
    minWidth: 400,
    minHeight: 500,
    title: 'Lista de Arquivos',
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
  });
  
  // Carrega a pagina HTML
  fileListWindow.loadFile(path.join(__dirname, 'fileListWindow.html'));
  
  // Quando carregar, envia os arquivos
  fileListWindow.webContents.on('did-finish-load', () => {
    updateFileList(folderPath);
  });
  
  fileListWindow.on('closed', () => {
    fileListWindow = null;
  });
}

// Funcao auxiliar para atualizar lista de arquivos
function updateFileList(folderPath) {
  if (!fileListWindow || fileListWindow.isDestroyed()) return;
  
  try {
    const files = fs.readdirSync(folderPath);
    const supportedExtensions = ['.tga', '.png', '.ozj', '.ozt', '.ozb', '.ozd', '.jpg', '.jpeg'];
    
    const fileList = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return supportedExtensions.includes(ext);
      })
      .map(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          extension: path.extname(file)
        };
      });
    
    fileListWindow.webContents.send('files-loaded', fileList, folderPath);
    console.log(`[Main] Lista atualizada: ${fileList.length} arquivos`);
  } catch (err) {
    console.error('[Main] Erro ao ler pasta:', err);
  }
}

// Handler quando arquivo eh selecionado na lista
ipcMain.on('file-selected', (event, filePath) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('file-selected', filePath);
  }
});

// Controles da janela de lista
ipcMain.on('filelist-window-minimize', () => {
  if (fileListWindow && !fileListWindow.isDestroyed()) {
    fileListWindow.minimize();
  }
});

ipcMain.on('filelist-window-close', () => {
  if (fileListWindow && !fileListWindow.isDestroyed()) {
    fileListWindow.close();
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

// Handler para converter OZD usando o conversor C com DLL
ipcMain.handle('convert-ozd-to-dds', async (_event, { inputPath, outputPath }) => {
  try {
    const { spawn } = require('child_process');
    
    console.log('[OZD Converter] Iniciando conversão...');
    console.log('[OZD Converter] Input:', inputPath);
    console.log('[OZD Converter] Output:', outputPath);
    
    // Garante que o diretório de saída existe
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Caminho para o conversor
    const converterPath = path.join(__dirname, '..', 'ozd-converter-v2.exe');
    
    if (!fs.existsSync(converterPath)) {
      throw new Error(`Conversor não encontrado: ${converterPath}`);
    }
    
    // Executa o conversor usando spawn (melhor para Windows)
    // Define o cwd como a pasta do executável para encontrar a DLL
    const converterDir = path.dirname(converterPath);
    
    return new Promise((resolve, reject) => {
      const process = spawn(converterPath, [inputPath, outputPath], {
        windowsHide: true,
        cwd: converterDir // Define o diretório de trabalho
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        console.log('[OZD Converter] Saída:', stdout);
        if (stderr) {
          console.log('[OZD Converter] Erros:', stderr);
        }
        
        if (code !== 0) {
          reject(new Error(`Conversor falhou com código ${code}: ${stderr || stdout}`));
          return;
        }
        
        // Verifica se o arquivo DDS foi criado
        if (!fs.existsSync(outputPath)) {
          reject(new Error('Arquivo DDS não foi criado pelo conversor'));
          return;
        }
        
        const stats = fs.statSync(outputPath);
        console.log('[OZD Converter] Arquivo DDS criado com sucesso!');
        console.log('[OZD Converter] Tamanho:', stats.size, 'bytes');
        
        resolve({ ok: true, size: stats.size });
      });
      
      process.on('error', (error) => {
        reject(new Error(`Erro ao executar conversor: ${error.message}`));
      });
    });
  } catch (error) {
    console.error('[OZD Converter] Erro:', error);
    return { ok: false, error: error.message };
  }
});

// Handler para gerar thumbnail (simplificado - retorna os dados raw)
// A janela de lista renderiza apenas PNG/JPG por enquanto
// TGA/OZT/OZJ usam placeholder ate implementacao completa
ipcMain.handle('generate-thumbnail', async (_event, filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const data = fs.readFileSync(filePath);
    
    // Por enquanto, apenas retorna indicacao de sucesso
    // Thumbnails customizados (TGA/OZT/OZJ) podem ser implementados depois
    return { 
      ok: true, 
      data: Array.from(data),
      extension: ext 
    };
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
