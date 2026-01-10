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

  const loadFolderFiles = useCallback(async (folderPath: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const files = await electronService.readDirectory(folderPath);
      
      // Filtra e mapeia arquivos em uma única passada (otimização: evita chamada duplicada de getExtension)
      const fileInfosPromises = files.map(async (file: string) => {
        const filePath = await electronService.joinPath(folderPath, file);
        const ext = await electronService.getExtension(file);
        const extension = ext.toLowerCase();
        
        // Filtra por extensão
        if (!SUPPORTED_EXTENSIONS.includes(extension as any)) {
          return null;
        }
        
        const stats = await electronService.getFileStats(filePath);
        
        return {
          path: filePath,
          name: file,
          extension: extension,
          size: stats.size,
        } as FileInfo;
      });
      
      const results = await Promise.all(fileInfosPromises);
      
      // Remove nulls (arquivos não suportados)
      const validFiles = results.filter((file): file is FileInfo => file !== null);

      // Verifica se encontrou arquivos
      if (validFiles.length === 0) {
        setError('Esta pasta não contém arquivos compatíveis (PNG, TGA, OZT, OZJ, JPG, JPEG).');
        setSelectedFiles([]);
        setIsLoading(false);
        return;
      }

      setSelectedFiles(validFiles);
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
    setIsLoading(true);
    setError(null);

    try {
      const folderPath = await electronService.selectFolder();
      
      if (!folderPath) {
        setIsLoading(false);
        return;
      }

      setCurrentFolderPath(folderPath);
      await loadFolderFiles(folderPath);
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

  const reloadFolder = useCallback(async () => {
    if (!currentFolderPath) {
      return;
    }
    await loadFolderFiles(currentFolderPath);
  }, [currentFolderPath, loadFolderFiles]);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setError(null);
    setCurrentFolderPath(null);
  }, []);

  return {
    selectedFiles,
    isLoading,
    error,
    selectFolder,
    reloadFolder,
    clearFiles,
    currentFolderPath,
  };
};
