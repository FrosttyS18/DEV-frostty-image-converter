import { useState, useEffect, useCallback, useRef } from 'react';
import { electronService } from '../services/electronService';
import { loadImageAsDataUrl } from '../utils/imageLoader';

interface ImageInfo {
  width: number;
  height: number;
}

interface CacheEntry {
  url: string;
  info: ImageInfo;
  timestamp: number;
}

// Cache LRU global (compartilhado entre todas as instâncias)
const previewCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 50;

function addToCache(path: string, url: string, info: ImageInfo) {
  // Remove mais antigo se cache estiver cheio
  if (previewCache.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    previewCache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      const removed = previewCache.get(oldestKey);
      if (removed && removed.url.startsWith('blob:')) {
        URL.revokeObjectURL(removed.url);
      }
      previewCache.delete(oldestKey);
      console.log('[Cache] Removido item mais antigo:', oldestKey);
    }
  }
  
  previewCache.set(path, { url, info, timestamp: Date.now() });
  console.log(`[Cache] Adicionado: ${path} (${previewCache.size}/${MAX_CACHE_SIZE})`);
}

/**
 * Hook para gerenciar preview de imagens com cache LRU
 * @param filePath - Caminho do arquivo
 * @param isThumbnail - Se true, aplica downsampling agressivo (max 256x256)
 */
export const useImagePreview = (filePath: string | null, isThumbnail: boolean = false) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para manter track do URL atual e fazer cleanup correto
  const currentUrlRef = useRef<string | null>(null);

  const loadPreview = useCallback(async (path: string) => {
    // Verifica cache primeiro
    const cached = previewCache.get(path);
    if (cached) {
      console.log('[Preview] Carregado do cache:', path);
      setPreviewUrl(cached.url);
      setImageInfo(cached.info);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const ext = (await electronService.getExtension(path)).toLowerCase();
      const stats = await electronService.getFileStats(path);
      const fileSize = stats.size;
      
      // OTIMIZACAO: Arquivos grandes (> 5MB) podem precisar downsampling
      const isLargeFile = fileSize > 5 * 1024 * 1024;
      // Thumbnails usam dimensão muito menor
      const MAX_PREVIEW_DIMENSION = isThumbnail ? 256 : 2048;

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
          const imgInfo = { width: img.width, height: img.height };
          setImageInfo(imgInfo);
          
          let finalUrl = url;
          
          // Para thumbnails, SEMPRE aplica downsampling se maior que 256
          // Para preview, só se arquivo grande (> 5MB) E maior que 2048
          const shouldDownsample = isThumbnail 
            ? (img.width > MAX_PREVIEW_DIMENSION || img.height > MAX_PREVIEW_DIMENSION)
            : (isLargeFile && (img.width > MAX_PREVIEW_DIMENSION || img.height > MAX_PREVIEW_DIMENSION));
          
          if (shouldDownsample) {
            const mode = isThumbnail ? 'thumbnail' : 'preview';
            console.log(`[${mode}] Aplicando downsampling (${(fileSize / 1024 / 1024).toFixed(1)}MB)...`);
            
            const canvas = document.createElement('canvas');
            const scale = Math.min(MAX_PREVIEW_DIMENSION / img.width, MAX_PREVIEW_DIMENSION / img.height);
            canvas.width = Math.floor(img.width * scale);
            canvas.height = Math.floor(img.height * scale);
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              URL.revokeObjectURL(url);
              finalUrl = canvas.toDataURL('image/png');
              console.log(`[Preview] Preview otimizado: ${img.width}x${img.height} → ${canvas.width}x${canvas.height}`);
            }
          }
          
          // Adiciona ao cache
          addToCache(path, finalUrl, imgInfo);
          currentUrlRef.current = finalUrl;
          setPreviewUrl(finalUrl);
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
          const imgInfo = { width: img.width, height: img.height };
          setImageInfo(imgInfo);
          
          let finalUrl = dataUrl;
          
          // OTIMIZACAO: Downsampling (mais agressivo para thumbnails)
          const shouldDownsample = isThumbnail 
            ? (img.width > MAX_PREVIEW_DIMENSION || img.height > MAX_PREVIEW_DIMENSION)
            : (isLargeFile && (img.width > MAX_PREVIEW_DIMENSION || img.height > MAX_PREVIEW_DIMENSION));
          
          if (shouldDownsample) {
            const mode = isThumbnail ? 'Thumbnail' : 'Preview';
            console.log(`[${mode}] Otimizando ${ext} (${(fileSize / 1024 / 1024).toFixed(1)}MB)...`);
            
            const canvas = document.createElement('canvas');
            const scale = Math.min(MAX_PREVIEW_DIMENSION / img.width, MAX_PREVIEW_DIMENSION / img.height);
            canvas.width = Math.floor(img.width * scale);
            canvas.height = Math.floor(img.height * scale);
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              finalUrl = canvas.toDataURL('image/png');
              console.log(`[Preview] ${img.width}x${img.height} → ${canvas.width}x${canvas.height} (otimizado)`);
            }
          }
          
          // Adiciona ao cache
          addToCache(path, finalUrl, imgInfo);
          currentUrlRef.current = finalUrl;
          setPreviewUrl(finalUrl);
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
