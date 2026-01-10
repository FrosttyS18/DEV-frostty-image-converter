export default {
  // Interface
  files: 'Files',
  selectFolder: 'Select Folder',
  reloadFolder: 'Refresh file list',
  filesListTooltip: 'List of files in the selected folder',
  selectFolderTooltip: 'Select folder to load files',
  searchPlaceholder: 'Search file...',
  searchTooltip: 'Search files by name',
  filterAll: 'All',
  filterTooltip: 'Filter files by type',
  convert: 'Convert',
  convertMultiple: 'Convert {count}',
  noFiles: 'No files found',
  noFilesLoaded: 'No files loaded',
  noFileSelected: 'No file selected',
  selectFileToView: 'Select a file to view',
  filesCount: '{count} file{plural}',
  tryAnotherSearch: 'Try another search or filter',
  noConversionAvailable: 'No conversion available for this format',
  selectFolderFirst: 'Select a folder',
  
  // Canvas
  zoom: 'Zoom',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  autoFit: 'Fit to canvas',
  pan: 'Pan (Drag)',
  panActivate: 'Activate pan',
  panDeactivate: 'Deactivate pan',
  zoomLevel: 'Zoom: {level}%',
  fileInfo: '{name} - {width}×{height} - {size}',
  copyFileName: 'Copy file name',
  
  // Settings
  settings: 'Settings',
  language: 'Language / Idioma',
  portuguese: 'Português (PT-BR)',
  english: 'English (EN-US)',
  spanish: 'Español (ES-ES)',
  copyright: '© 2026 DEV-Frostty. All rights reserved.',
  
  // Success messages
  success: {
    conversionComplete: '{count} file{plural} converted successfully! ✓',
    folderLoaded: '{count} file{plural} loaded',
    filesSelected: '{count} file{plural} selected',
  },
  
  // Error messages
  error: {
    conversionFailed: 'Could not convert the files. Try again or choose other files.',
    fileReadError: 'We could not open this file. It may be corrupted or in use by another program.',
    folderReadError: 'Could not access this folder. Check if you have permission to read the files.',
    noFilesSelected: 'You need to select files first. Click "Select Folder" to start.',
    invalidFormat: 'This format is not supported. Use PNG, TGA, OZT or OZJ.',
    electronNotAvailable: 'This function only works in the desktop version of the application.',
    permissionDenied: 'No permission to save files in this folder. Choose another location.',
    fileInUse: 'This file is being used by another program. Close it and try again.',
  },
  
  // Warning messages
  warning: {
    noFilesToConvert: 'Select at least one file before converting.',
    selectFolderFirst: 'First you need to select a folder with Mu Online files.',
    emptyFolder: 'This folder does not contain compatible files (PNG, TGA, OZT or OZJ).',
    thumbnailTooLarge: 'thumbnail max 8mb',
  },
  
  // Loading messages
  loading: {
    selectingFolder: 'Selecting folder...',
    converting: 'Converting files...',
    loadingPreview: 'Loading preview...',
  },
  
  // Context menu
  contextMenu: {
    convertTo: 'Convert to',
    pngToTga: 'PNG → TGA',
    tgaToPng: 'TGA → PNG',
    pngToOzt: 'PNG → OZT',
    oztToPng: 'OZT → PNG',
    ozjToJpg: 'OZJ → JPG',
    jpgToOzj: 'JPG → OZJ',
    oztToTga: 'OZT → TGA',
  },
};
