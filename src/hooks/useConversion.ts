import { useState, useCallback } from 'react';
import { FileInfo, ConversionType } from '../types';
import { convertFiles } from '../utils/converter';

/**
 * Hook para gerenciar conversões de arquivos
 */
export const useConversion = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const convert = useCallback(async (
    type: ConversionType,
    files: FileInfo[],
    outputFolder?: string
  ) => {
    if (files.length === 0) {
      setError('Nenhum arquivo selecionado');
      return;
    }

    setIsConverting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await convertFiles({
        type,
        files,
        preserveAlpha: true,
        outputFolder,
      });

      setSuccessMessage(`${files.length} arquivo(s) convertido(s) com sucesso!`);
      
      // Limpar mensagem após 3s
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Erro ao converter arquivos';
      setError(errorMessage);
      console.error('[useConversion] Error:', err);
    } finally {
      setIsConverting(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  return {
    isConverting,
    error,
    successMessage,
    convert,
    clearMessages,
  };
};
