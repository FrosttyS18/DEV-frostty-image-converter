import { useState, useCallback, useRef, useEffect } from 'react';
import { FileInfo, ConversionType } from '../types';
import { convertFiles } from '../utils/converter';
import { invalidateCache } from './useImagePreview';
import { translate } from '../i18n';
import { electronService } from '../services/electronService';

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
      const destinationFolder = await convertFiles({
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
      
      // Abre a pasta de destino no explorador do Windows (APENAS UMA VEZ, mesmo com múltiplos arquivos)
      // Garantia: só abre uma janela, independente de quantos arquivos foram convertidos
      let folderToOpen: string | null = null;
      
      if (destinationFolder) {
        // Se há pasta de destino específica, todos os arquivos foram salvos lá
        folderToOpen = destinationFolder;
        console.log('[useConversion] Pasta de destino definida:', folderToOpen);
      } else {
        // Se não há pasta de destino, todos os arquivos foram salvos na mesma pasta de origem
        // Usa a pasta do primeiro arquivo (todos devem estar na mesma pasta)
        folderToOpen = await electronService.getDirname(files[0].path);
        console.log('[useConversion] Pasta de origem (primeiro arquivo):', folderToOpen);
      }
      
      // Abre a pasta apenas uma vez
      if (folderToOpen) {
        try {
          console.log('[useConversion] Abrindo pasta no explorador:', folderToOpen);
          await electronService.openFolder(folderToOpen);
          console.log('[useConversion] Pasta aberta com sucesso!');
        } catch (error) {
          console.error('[useConversion] Erro ao abrir pasta (não crítico):', error);
          // Não bloqueia o fluxo se falhar ao abrir pasta
        }
      }
      
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
