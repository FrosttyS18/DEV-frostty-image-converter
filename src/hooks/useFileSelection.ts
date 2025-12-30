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
  const [currentFolderPath, setCurrentFolderPath] = useState<string | null>(null);

  const loadFilesFromFolder = useCallback(async (folderPath: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const files = await electronService.readDirectory(folderPath);
      
      // Primeiro filtra arquivos por extensão
      const filteredFiles = [];
      for (const file of files) {
        const ext = await electronService.getExtension(file);
        if (SUPPORTED_EXTENSIONS.includes(ext.toLowerCase() as any)) {
          filteredFiles.push(file);
        }
      }
      
      // Depois mapeia para FileInfo
      const fileInfos: FileInfo[] = await Promise.all(
        filteredFiles.map(async (file: string) => {
          const filePath = await electronService.joinPath(folderPath, file);
          const stats = await electronService.getFileStats(filePath);
          const extension = await electronService.getExtension(file);
          
          return {
            path: filePath,
            name: file,
            extension: extension.toLowerCase(),
            size: stats.size,
          };
        })
      );

      // Verifica se encontrou arquivos
      if (fileInfos.length === 0) {
        setError('Esta pasta não contém arquivos compatíveis (PNG, TGA, OZT, OZJ, JPG).');
        setSelectedFiles([]);
        setIsLoading(false);
        return;
      }

      setSelectedFiles(fileInfos);
      setCurrentFolderPath(folderPath);
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

  const selectFolder = useCallback(async () => {
    const folderPath = await electronService.selectFolder();
    
    if (!folderPath) {
      return;
    }

    await loadFilesFromFolder(folderPath);
  }, [loadFilesFromFolder]);

  const reloadFiles = useCallback(async () => {
    if (!currentFolderPath) {
      setError('Nenhuma pasta selecionada para recarregar.');
      return;
    }
    
    await loadFilesFromFolder(currentFolderPath);
  }, [currentFolderPath, loadFilesFromFolder]);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setError(null);
  }, []);

  return {
    selectedFiles,
    isLoading,
    error,
    selectFolder,
    reloadFiles,
    clearFiles,
    currentFolderPath,
  };
};
