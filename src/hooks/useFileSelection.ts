import { useState, useCallback } from 'react';
import { FileInfo } from '../types';
import { electronService } from '../services/electronService';
import { SUPPORTED_EXTENSIONS } from '../constants/formats';

/**
 * Hook para gerenciar seleção de arquivos
 */
export const useFileSelection = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFolder = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const folderPath = await electronService.selectFolder();
      
      if (!folderPath) {
        setIsLoading(false);
        return;
      }

      const files = await electronService.readDirectory(folderPath);
      
      const fileInfos: FileInfo[] = await Promise.all(
        files
          .filter((file: string) => {
            const ext = electronService.getExtension(file).toLowerCase();
            return SUPPORTED_EXTENSIONS.includes(ext as any);
          })
          .map(async (file: string) => {
            const filePath = electronService.joinPath(folderPath, file);
            const stats = await electronService.getFileStats(filePath);
            const extension = electronService.getExtension(file).toLowerCase();
            
            return {
              path: filePath,
              name: file,
              extension,
              size: stats.size,
            };
          })
      );

      // Verifica se encontrou arquivos
      if (fileInfos.length === 0) {
        setError('Esta pasta não contém arquivos compatíveis (PNG, TGA, OZT, OZJ, OZB, OZD).');
        setSelectedFiles([]);
        setIsLoading(false);
        return;
      }

      setSelectedFiles(fileInfos);
    } catch (err) {
      let errorMessage = 'Não foi possível acessar esta pasta.';
      
      if (err instanceof Error) {
        if (err.message.includes('EACCES') || err.message.includes('permission')) {
          errorMessage = 'Sem permissão para acessar esta pasta. Escolha outra localização.';
        } else if (err.message.includes('ENOENT')) {
          errorMessage = 'Esta pasta não existe ou foi movida.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('[useFileSelection] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setError(null);
  }, []);

  return {
    selectedFiles,
    isLoading,
    error,
    selectFolder,
    clearFiles,
  };
};
