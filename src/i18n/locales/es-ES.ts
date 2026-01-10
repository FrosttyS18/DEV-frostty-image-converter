export default {
  // Interface
  files: 'Archivos',
  selectFolder: 'Seleccionar Carpeta',
  reloadFolder: 'Actualizar lista de archivos',
  filesListTooltip: 'Lista de archivos de la carpeta seleccionada',
  selectFolderTooltip: 'Seleccionar carpeta para cargar archivos',
  searchPlaceholder: 'Buscar archivo...',
  searchTooltip: 'Buscar archivos por nombre',
  filterAll: 'Todos',
  filterTooltip: 'Filtrar archivos por tipo',
  convert: 'Convertir',
  convertMultiple: 'Convertir {count}',
  noFiles: 'No se encontraron archivos',
  noFilesLoaded: 'No se cargaron archivos',
  noFileSelected: 'Ningún archivo seleccionado',
  selectFileToView: 'Seleccione un archivo para visualizar',
  filesCount: '{count} archivo{plural}',
  tryAnotherSearch: 'Intente otra búsqueda o filtro',
  noConversionAvailable: 'No hay conversión disponible para este formato',
  selectFolderFirst: 'Seleccione una carpeta',
  
  // Canvas
  zoom: 'Zoom',
  zoomIn: 'Aumentar zoom',
  zoomOut: 'Disminuir zoom',
  autoFit: 'Ajustar al canvas',
  pan: 'Pan (Arrastrar)',
  panActivate: 'Activar pan',
  panDeactivate: 'Desactivar pan',
  zoomLevel: 'Zoom: {level}%',
  fileInfo: '{name} - {width}×{height} - {size}',
  copyFileName: 'Copiar nombre del archivo',
  
  // Settings
  settings: 'Configuración',
  language: 'Idioma / Language',
  portuguese: 'Português (PT-BR)',
  english: 'English (EN-US)',
  spanish: 'Español (ES-ES)',
  copyright: '© 2026 DEV-Frostty. Todos los derechos reservados.',
  
  // Success messages
  success: {
    conversionComplete: '{count} archivo{plural} convertido{plural} con éxito! ✓',
    folderLoaded: '{count} archivo{plural} cargado{plural}',
    filesSelected: '{count} archivo{plural} seleccionado{plural}',
  },
  
  // Error messages
  error: {
    conversionFailed: 'No se pudieron convertir los archivos. Intente nuevamente o elija otros archivos.',
    fileReadError: 'No pudimos abrir este archivo. Puede estar corrupto o en uso por otro programa.',
    folderReadError: 'No se pudo acceder a esta carpeta. Verifique si tiene permiso para leer los archivos.',
    noFilesSelected: 'Primero debe seleccionar archivos. Haga clic en "Seleccionar Carpeta" para comenzar.',
    invalidFormat: 'Este formato no es compatible. Use PNG, TGA, OZT u OZJ.',
    electronNotAvailable: 'Esta función solo funciona en la versión de escritorio de la aplicación.',
    permissionDenied: 'Sin permiso para guardar archivos en esta carpeta. Elija otra ubicación.',
    fileInUse: 'Este archivo está siendo utilizado por otro programa. Ciérrelo e intente nuevamente.',
  },
  
  // Warning messages
  warning: {
    noFilesToConvert: 'Seleccione al menos un archivo antes de convertir.',
    selectFolderFirst: 'Primero debe seleccionar una carpeta con archivos de Mu Online.',
    emptyFolder: 'Esta carpeta no contiene archivos compatibles (PNG, TGA, OZT u OZJ).',
    thumbnailTooLarge: 'miniatura max 8mb',
  },
  
  // Loading messages
  loading: {
    selectingFolder: 'Seleccionando carpeta...',
    converting: 'Convirtiendo archivos...',
    loadingPreview: 'Cargando vista previa...',
  },
  
  // Context menu
  contextMenu: {
    convertTo: 'Convertir a',
    pngToTga: 'PNG → TGA',
    tgaToPng: 'TGA → PNG',
    pngToOzt: 'PNG → OZT',
    oztToPng: 'OZT → PNG',
    ozjToJpg: 'OZJ → JPG',
    jpgToOzj: 'JPG → OZJ',
    oztToTga: 'OZT → TGA',
  },
};
