import { useState, useCallback, useRef, useEffect } from 'react';
import { FileInfo, ConversionType } from '../types';
import { convertFiles } from '../utils/converter';
import { invalidateCache } from './useImagePreview';
import { translate } from '../i18n';

/**
 * Hook para gerenciar conversões de arquivos
 */
export const useConversion = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup de timeout ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const convert = useCallback(async (
    type: ConversionType,
    files: FileInfo[],
    outputFolder?: string
  ) => {
    console.log('[useConversion] Iniciando conversao...');
    console.log('[useConversion] Tipo:', type);
    console.log('[useConversion] Arquivos:', files.length);
    console.log('[useConversion] Pasta saida:', outputFolder);
    
    // Limpa timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (files.length === 0) {
      console.error('[useConversion] Nenhum arquivo selecionado!');
      setError(translate('error.noFilesSelected'));
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
      setSuccessMessage(translate('success.conversionComplete', { count: files.length }));
      
      // Invalida cache de todos os arquivos convertidos (entrada e saída)
      // Isso garante que thumbnails sejam atualizados após conversão
      files.forEach(file => {
        invalidateCache(file.path);
      });
      console.log('[useConversion] Cache invalidado para arquivos convertidos');
      
      // Limpar mensagem após 3s (com cleanup)
      timeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
        timeoutRef.current = null;
      }, 3000);
      
    } catch (err) {
      console.error('[useConversion] ERRO durante conversao:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : translate('error.conversionFailed');
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
