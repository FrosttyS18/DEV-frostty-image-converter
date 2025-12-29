import { useState, useEffect, useCallback, useRef } from 'react';
import { electronService } from '../services/electronService';
import { loadImageAsDataUrl } from '../utils/imageLoader';

interface ImageInfo {
  width: number;
  height: number;
}

/**
 * Hook para gerenciar preview de imagens
 */
export const useImagePreview = (filePath: string | null) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para manter track do URL atual e fazer cleanup correto
  const currentUrlRef = useRef<string | null>(null);

  const loadPreview = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const ext = (await electronService.getExtension(path)).toLowerCase();

      if (ext === '.png') {
        // PNG direto
        const data = await electronService.readFile(path);
        const blob = new Blob([data.buffer as ArrayBuffer], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        
        // Revoga URL anterior se existir
        if (currentUrlRef.current && currentUrlRef.current.startsWith('blob:')) {
          URL.revokeObjectURL(currentUrlRef.current);
        }
        
        currentUrlRef.current = url;
        setPreviewUrl(url);

        // Carregar dimensões
        const img = new Image();
        img.onload = () => {
          setImageInfo({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          setError('Erro ao carregar dimensões da imagem');
        };
        img.src = url;
        
      } else if (ext === '.tga' || ext === '.ozt' || ext === '.ozj') {
        // Converter para preview
        const dataUrl = await loadImageAsDataUrl(path);
        
        // Revoga URL anterior se existir (pode ser blob: ou data:)
        if (currentUrlRef.current && currentUrlRef.current.startsWith('blob:')) {
          URL.revokeObjectURL(currentUrlRef.current);
        }
        
        currentUrlRef.current = dataUrl;
        setPreviewUrl(dataUrl);

        // Carregar dimensões
        const img = new Image();
        img.onload = () => {
          console.log('[useImagePreview] Imagem carregada:', img.width, 'x', img.height);
          setImageInfo({ width: img.width, height: img.height });
        };
        img.onerror = (e) => {
          console.error('[useImagePreview] img.onerror disparou:', e);
          console.error('[useImagePreview] dataUrl:', dataUrl.substring(0, 100));
          setError('Não foi possível decodificar a imagem. Arquivo pode estar corrompido.');
        };
        img.src = dataUrl;
      } else {
        setError('Formato não suportado para preview');
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Erro ao carregar preview';
      setError(errorMessage);
      console.error('[useImagePreview] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!filePath) {
      // Limpa URL anterior se existir
      if (currentUrlRef.current && currentUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrlRef.current);
      }
      currentUrlRef.current = null;
      setPreviewUrl(null);
      setImageInfo(null);
      setError(null);
      return;
    }

    loadPreview(filePath);

    // Cleanup quando o componente desmonta ou filePath muda
    return () => {
      if (currentUrlRef.current && currentUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [filePath, loadPreview]);

  return {
    previewUrl,
    imageInfo,
    isLoading,
    error,
  };
};
