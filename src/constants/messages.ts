/**
 * Mensagens da aplicação em Português
 */

export const MESSAGES = {
  // Sucesso
  SUCCESS: {
    CONVERSION_COMPLETE: (count: number) => 
      `${count} arquivo${count > 1 ? 's convertido' : ' convertido'}${count > 1 ? 's' : ''} com sucesso! ✓`,
    FOLDER_LOADED: (count: number) => 
      `${count} arquivo${count > 1 ? 's carregado' : ' carregado'}${count > 1 ? 's' : ''}`,
  },

  // Erros
  ERROR: {
    CONVERSION_FAILED: 'Não foi possível converter os arquivos. Tente novamente ou escolha outros arquivos.',
    FILE_READ_ERROR: 'Não conseguimos abrir este arquivo. Ele pode estar corrompido ou em uso por outro programa.',
    FOLDER_READ_ERROR: 'Não foi possível acessar esta pasta. Verifique se você tem permissão para ler os arquivos.',
    NO_FILES_SELECTED: 'Você precisa selecionar arquivos primeiro. Clique em "Selecionar Pasta" para começar.',
    INVALID_FORMAT: 'Este formato não é suportado. Use PNG, TGA, OZT ou OZJ.',
    ELECTRON_NOT_AVAILABLE: 'Esta função só funciona na versão desktop do aplicativo.',
    PERMISSION_DENIED: 'Sem permissão para salvar arquivos nesta pasta. Escolha outra localização.',
    FILE_IN_USE: 'Este arquivo está sendo usado por outro programa. Feche-o e tente novamente.',
  },

  // Avisos
  WARNING: {
    NO_FILES_TO_CONVERT: 'Selecione pelo menos um arquivo antes de converter.',
    SELECT_FOLDER_FIRST: 'Primeiro você precisa selecionar uma pasta com arquivos do Mu Online.',
    EMPTY_FOLDER: 'Esta pasta não contém arquivos compatíveis (PNG, TGA, OZT ou OZJ).',
  },

  // Loading
  LOADING: {
    SELECTING_FOLDER: 'Selecionando pasta...',
    CONVERTING: 'Convertendo arquivos...',
    LOADING_PREVIEW: 'Carregando preview...',
  },
} as const;
