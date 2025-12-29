const { contextBridge, ipcRenderer } = require("electron");

console.log('[Preload] Iniciando preload.cjs...');

/**
 * Expõe API via contextBridge - SOMENTE IPC, sem fs/path direto
 */
contextBridge.exposeInMainWorld("electronAPI", {
  // Dialogs
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  
  // File operations (via IPC)
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', { filePath, data }),
  readDirectory: (folderPath) => ipcRenderer.invoke('read-directory', folderPath),
  getFileStats: (filePath) => ipcRenderer.invoke('get-file-stats', filePath),
  
  // Path utilities (via IPC)
  pathJoin: (...paths) => ipcRenderer.invoke('path-join', paths),
  pathExtname: (filePath) => ipcRenderer.invoke('path-extname', filePath),
  pathDirname: (filePath) => ipcRenderer.invoke('path-dirname', filePath),
  pathBasename: (filePath) => ipcRenderer.invoke('path-basename', filePath),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  toggleMaximizeWindow: () => ipcRenderer.send('window-toggle-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
});

console.log('[Preload] electronAPI exposta com sucesso!');
