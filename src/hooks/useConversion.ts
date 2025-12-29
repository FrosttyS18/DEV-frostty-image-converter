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
    console.log('[useConversion] Iniciando conversao...');
    console.log('[useConversion] Tipo:', type);
    console.log('[useConversion] Arquivos:', files.length);
    console.log('[useConversion] Pasta saida:', outputFolder);
    
    if (files.length === 0) {
      console.error('[useConversion] Nenhum arquivo selecionado!');
      setError('Nenhum arquivo selecionado');
      return;
    }

    setIsConverting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('[useConversion] Chamando convertFiles...');
      await convertFiles({
        type,
        files,
        preserveAlpha: true,
        outputFolder,
      });

      console.log('[useConversion] Conversao concluida com sucesso!');
      setSuccessMessage(files.length === 1 ? 'Arquivo convertido!' : `${files.length} arquivos convertidos!`);
      
      // Limpar mensagem após 3s
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err) {
      console.error('[useConversion] ERRO durante conversao:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Erro ao converter arquivos';
      setError(errorMessage);
      console.error('[useConversion] Error:', err);
    } finally {
      console.log('[useConversion] Finalizando (isConverting = false)');
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
