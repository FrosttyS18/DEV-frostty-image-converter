export default {
  // Interface
  files: 'Arquivos',
  selectFolder: 'Selecionar Pasta',
  reloadFolder: 'Atualizar lista de arquivos',
  filesListTooltip: 'Lista de arquivos da pasta selecionada',
  selectFolderTooltip: 'Selecionar pasta para carregar arquivos',
  searchPlaceholder: 'Buscar arquivo...',
  searchTooltip: 'Buscar arquivos por nome',
  filterAll: 'Todos',
  filterTooltip: 'Filtrar arquivos por tipo',
  convert: 'Converter',
  convertMultiple: 'Converter {count}',
  noFiles: 'Nenhum arquivo encontrado',
  noFilesLoaded: 'Nenhum arquivo carregado',
  noFileSelected: 'Nenhum arquivo selecionado',
  selectFileToView: 'Selecione um arquivo para visualizar',
  filesCount: '{count} arquivo{plural}',
  tryAnotherSearch: 'Tente outra busca ou filtro',
  noConversionAvailable: 'Nenhuma conversão disponível para este formato',
  selectFolderFirst: 'Selecione uma pasta',
  
  // Canvas
  zoom: 'Zoom',
  zoomIn: 'Aumentar zoom',
  zoomOut: 'Diminuir zoom',
  autoFit: 'Ajustar ao canvas',
  pan: 'Pan (Arrastar)',
  panActivate: 'Ativar pan',
  panDeactivate: 'Desativar pan',
  zoomLevel: 'Zoom: {level}%',
  fileInfo: '{name} - {width}×{height} - {size}',
  copyFileName: 'Copiar nome do arquivo',
  
  // Settings
  settings: 'Configurações',
  language: 'Idioma / Language',
  portuguese: 'Português (PT-BR)',
  english: 'English (EN-US)',
  spanish: 'Español (ES-ES)',
  copyright: '© 2026 DEV-Frostty. Todos os direitos reservados.',
  
  // Success messages
  success: {
    conversionComplete: '{count} arquivo{plural} convertido{plural} com sucesso! ✓',
    folderLoaded: '{count} arquivo{plural} carregado{plural}',
    filesSelected: '{count} arquivo{plural} selecionado{plural}',
  },
  
  // Error messages
  error: {
    conversionFailed: 'Não foi possível converter os arquivos. Tente novamente ou escolha outros arquivos.',
    fileReadError: 'Não conseguimos abrir este arquivo. Ele pode estar corrompido ou em uso por outro programa.',
    folderReadError: 'Não foi possível acessar esta pasta. Verifique se você tem permissão para ler os arquivos.',
    noFilesSelected: 'Você precisa selecionar arquivos primeiro. Clique em "Selecionar Pasta" para começar.',
    invalidFormat: 'Este formato não é suportado. Use PNG, TGA, OZT ou OZJ.',
    electronNotAvailable: 'Esta função só funciona na versão desktop do aplicativo.',
    permissionDenied: 'Sem permissão para salvar arquivos nesta pasta. Escolha outra localização.',
    fileInUse: 'Este arquivo está sendo usado por outro programa. Feche-o e tente novamente.',
  },
  
  // Warning messages
  warning: {
    noFilesToConvert: 'Selecione pelo menos um arquivo antes de converter.',
    selectFolderFirst: 'Primeiro você precisa selecionar uma pasta com arquivos do Mu Online.',
    emptyFolder: 'Esta pasta não contém arquivos compatíveis (PNG, TGA, OZT ou OZJ).',
    thumbnailTooLarge: 'miniatura max 8mb',
  },
  
  // Loading messages
  loading: {
    selectingFolder: 'Selecionando pasta...',
    converting: 'Convertendo arquivos...',
    loadingPreview: 'Carregando preview...',
  },
  
  // Context menu
  contextMenu: {
    convertTo: 'Converter para',
    pngToTga: 'PNG → TGA',
    tgaToPng: 'TGA → PNG',
    pngToOzt: 'PNG → OZT',
    oztToPng: 'OZT → PNG',
    ozjToJpg: 'OZJ → JPG',
    jpgToOzj: 'JPG → OZJ',
    oztToTga: 'OZT → TGA',
  },
};
