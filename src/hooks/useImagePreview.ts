import { useState, useEffect, useCallback } from 'react';
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

  const loadPreview = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const ext = electronService.getExtension(path).toLowerCase();

      if (ext === '.png') {
        // PNG direto
        const data = electronService.readFile(path);
        const blob = new Blob([data], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
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
        setPreviewUrl(dataUrl);

        // Carregar dimensões
        const img = new Image();
        img.onload = () => {
          setImageInfo({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          setError('Erro ao carregar dimensões da imagem');
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
      setPreviewUrl(null);
      setImageInfo(null);
      setError(null);
      return;
    }

    loadPreview(filePath);

    // Cleanup
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [filePath]);

  return {
    previewUrl,
    imageInfo,
    isLoading,
    error,
  };
};
