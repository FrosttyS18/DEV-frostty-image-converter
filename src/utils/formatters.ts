/**
 * Utilitários de formatação
 */

/**
 * Formata tamanho de arquivo em bytes para formato legível
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
};

/**
 * Formata dimensões de imagem
 */
export const formatDimensions = (width: number, height: number): string => {
  return `${width} × ${height} pixels`;
};
