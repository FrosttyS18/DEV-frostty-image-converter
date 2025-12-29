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

      const files = electronService.readDirectory(folderPath);
      
      const fileInfos: FileInfo[] = files
        .filter((file: string) => {
          const ext = electronService.getExtension(file).toLowerCase();
          return SUPPORTED_EXTENSIONS.includes(ext as any);
        })
        .map((file: string) => {
          const filePath = electronService.joinPath(folderPath, file);
          const stats = electronService.getFileStats(filePath);
          const extension = electronService.getExtension(file).toLowerCase();
          
          return {
            path: filePath,
            name: file,
            extension,
            size: stats.size,
          };
        });

      setSelectedFiles(fileInfos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao selecionar pasta';
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
