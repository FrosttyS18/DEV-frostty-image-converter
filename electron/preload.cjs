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
  generateThumbnail: (filePath) => ipcRenderer.invoke('generate-thumbnail', filePath),
  
  
  // Path utilities (via IPC)
  pathJoin: (...paths) => ipcRenderer.invoke('path-join', paths),
  pathExtname: (filePath) => ipcRenderer.invoke('path-extname', filePath),
  pathDirname: (filePath) => ipcRenderer.invoke('path-dirname', filePath),
  pathBasename: (filePath) => ipcRenderer.invoke('path-basename', filePath),
  
  // Folder operations
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  toggleMaximizeWindow: () => ipcRenderer.send('window-toggle-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  
  // File list window events
  onFilesLoaded: (callback) => ipcRenderer.on('files-loaded', (event, files, folderPath) => callback(files, folderPath)),
  fileSelected: (filePath) => ipcRenderer.send('file-selected', filePath),
  onFileSelected: (callback) => ipcRenderer.on('file-selected', (event, filePath) => callback(filePath)),
  
  // File list window controls
  minimizeFileListWindow: () => ipcRenderer.send('filelist-window-minimize'),
  maximizeFileListWindow: () => ipcRenderer.send('filelist-window-maximize'),
  closeFileListWindow: () => ipcRenderer.send('filelist-window-close'),
  onWindowMaximized: (callback) => ipcRenderer.on('window-maximized', (event, isMaximized) => callback(isMaximized)),
  resizeFileListWindow: (width, height) => ipcRenderer.send('filelist-window-resize', { width, height }),
  setFileListWindowBounds: (bounds) => ipcRenderer.send('filelist-window-set-bounds', bounds),
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
});

console.log('[Preload] electronAPI exposta com sucesso!');
