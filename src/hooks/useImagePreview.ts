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
      const stats = await electronService.getFileStats(path);
      const fileSize = stats.size;
      
      // OTIMIZACAO: Arquivos grandes (> 5MB) podem precisar downsampling
      const isLargeFile = fileSize > 5 * 1024 * 1024;
      const MAX_PREVIEW_DIMENSION = 2048;

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

        // Carregar dimensões e aplicar downsampling se necessário
        const img = new Image();
        img.onload = () => {
          setImageInfo({ width: img.width, height: img.height });
          
          // Se arquivo grande E dimensões grandes, reduz para preview
          if (isLargeFile && (img.width > MAX_PREVIEW_DIMENSION || img.height > MAX_PREVIEW_DIMENSION)) {
            console.log(`[Preview] Arquivo grande detectado (${(fileSize / 1024 / 1024).toFixed(1)}MB), aplicando downsampling...`);
            
            const canvas = document.createElement('canvas');
            const scale = Math.min(MAX_PREVIEW_DIMENSION / img.width, MAX_PREVIEW_DIMENSION / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              URL.revokeObjectURL(url);
              const optimizedUrl = canvas.toDataURL('image/png');
              currentUrlRef.current = optimizedUrl;
              setPreviewUrl(optimizedUrl);
              console.log(`[Preview] Preview otimizado: ${img.width}x${img.height} → ${canvas.width}x${canvas.height}`);
            } else {
              setPreviewUrl(url);
            }
          } else {
            setPreviewUrl(url);
          }
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

        // Carregar dimensões e aplicar downsampling para arquivos grandes
        const img = new Image();
        img.onload = () => {
          console.log('[useImagePreview] Imagem carregada:', img.width, 'x', img.height);
          setImageInfo({ width: img.width, height: img.height });
          
          // OTIMIZACAO: Downsampling para arquivos grandes
          if (isLargeFile && (img.width > MAX_PREVIEW_DIMENSION || img.height > MAX_PREVIEW_DIMENSION)) {
            console.log(`[Preview] Otimizando arquivo grande ${ext} (${(fileSize / 1024 / 1024).toFixed(1)}MB)...`);
            
            const canvas = document.createElement('canvas');
            const scale = Math.min(MAX_PREVIEW_DIMENSION / img.width, MAX_PREVIEW_DIMENSION / img.height);
            canvas.width = Math.floor(img.width * scale);
            canvas.height = Math.floor(img.height * scale);
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              const optimizedUrl = canvas.toDataURL('image/png');
              currentUrlRef.current = optimizedUrl;
              setPreviewUrl(optimizedUrl);
              console.log(`[Preview] ${img.width}x${img.height} → ${canvas.width}x${canvas.height} (preview otimizado)`);
            } else {
              currentUrlRef.current = dataUrl;
              setPreviewUrl(dataUrl);
            }
          } else {
            currentUrlRef.current = dataUrl;
            setPreviewUrl(dataUrl);
          }
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
