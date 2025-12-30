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
  fileModifiedTime: number; // Timestamp de modificação do arquivo
}

// Cache LRU global (compartilhado entre todas as instâncias)
const previewCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 50;

function addToCache(path: string, url: string, info: ImageInfo, fileModifiedTime: number) {
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
  
  previewCache.set(path, { url, info, timestamp: Date.now(), fileModifiedTime });
  console.log(`[Cache] Adicionado: ${path} (${previewCache.size}/${MAX_CACHE_SIZE})`);
}

/**
 * Invalida o cache de um arquivo específico ou de todos os arquivos
 * @param filePath - Caminho do arquivo a invalidar. Se não fornecido, invalida todo o cache.
 */
export function invalidateCache(filePath?: string) {
  if (filePath) {
    // Invalida apenas o arquivo específico
    const cached = previewCache.get(filePath);
    if (cached) {
      if (cached.url.startsWith('blob:')) {
        URL.revokeObjectURL(cached.url);
      }
      previewCache.delete(filePath);
      console.log('[Cache] Invalidado:', filePath);
    }
  } else {
    // Invalida todo o cache
    previewCache.forEach((entry) => {
      if (entry.url.startsWith('blob:')) {
        URL.revokeObjectURL(entry.url);
      }
    });
    previewCache.clear();
    console.log('[Cache] Todo o cache foi invalidado');
  }
}

/**
 * Aplica downsampling na imagem se necessário
 */
function applyDownsampling(
  img: HTMLImageElement,
  maxDimension: number,
  isThumbnail: boolean,
  fileSize: number,
  ext: string
): string {
  const shouldDownsample = isThumbnail 
    ? (img.width > maxDimension || img.height > maxDimension)
    : (fileSize > 5 * 1024 * 1024 && (img.width > maxDimension || img.height > maxDimension));
  
  if (!shouldDownsample) {
    return '';
  }
  
  const mode = isThumbnail ? 'Thumbnail' : 'Preview';
  console.log(`[${mode}] Otimizando ${ext} (${(fileSize / 1024 / 1024).toFixed(1)}MB)...`);
  
  const canvas = document.createElement('canvas');
  const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
  canvas.width = Math.floor(img.width * scale);
  canvas.height = Math.floor(img.height * scale);
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const optimizedUrl = canvas.toDataURL('image/png');
    console.log(`[Preview] ${img.width}x${img.height} → ${canvas.width}x${canvas.height} (otimizado)`);
    return optimizedUrl;
  }
  
  return '';
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
  const cancelLoadRef = useRef<(() => void) | null>(null);

  const loadPreview = useCallback(async (path: string, forceRefresh: boolean = false) => {
    // Cancela carregamento anterior se existir
    if (cancelLoadRef.current) {
      cancelLoadRef.current();
      cancelLoadRef.current = null;
    }
    // Se forçar refresh, invalida cache primeiro
    if (forceRefresh) {
      invalidateCache(path);
    }
    
    // Verifica cache primeiro (com validação de timestamp do arquivo)
    const cached = previewCache.get(path);
    if (cached && !forceRefresh) {
      try {
        // Verifica se arquivo foi modificado desde que foi cacheado
        const stats = await electronService.getFileStats(path);
        const fileModifiedTime = stats.mtimeMs;
        
        if (cached.fileModifiedTime === fileModifiedTime) {
          // Arquivo não mudou, usa cache
          console.log('[Preview] Carregado do cache:', path);
          setPreviewUrl(cached.url);
          setImageInfo(cached.info);
          setIsLoading(false);
          return;
        } else {
          // Arquivo foi modificado, remove do cache e recarrega
          console.log('[Preview] Arquivo modificado, invalidando cache:', path);
          if (cached.url.startsWith('blob:')) {
            URL.revokeObjectURL(cached.url);
          }
          previewCache.delete(path);
        }
      } catch (err) {
        // Se não conseguir ler stats, usa cache mesmo
        console.log('[Preview] Carregado do cache (sem validação):', path);
        setPreviewUrl(cached.url);
        setImageInfo(cached.info);
        setIsLoading(false);
        return;
      }
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const ext = (await electronService.getExtension(path)).toLowerCase();
      const stats = await electronService.getFileStats(path);
      const fileSize = stats.size;
      const fileModifiedTime = stats.mtimeMs;
      
      // Thumbnails usam dimensão muito menor
      const MAX_PREVIEW_DIMENSION = isThumbnail ? 256 : 2048;

      if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
        // PNG/JPEG direto
        console.log(`[Preview] Carregando ${ext.toUpperCase()}${isThumbnail ? ' (thumbnail)' : ''}:`, path);
        const data = await electronService.readFile(path);
        console.log(`[Preview] Arquivo lido: ${data.length} bytes`);
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
        
        // Cria uma cópia do ArrayBuffer para evitar problemas de referência
        const arrayBuffer = data.buffer.slice(
          data.byteOffset,
          data.byteOffset + data.byteLength
        ) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Revoga URL anterior se existir
        if (currentUrlRef.current && currentUrlRef.current.startsWith('blob:')) {
          URL.revokeObjectURL(currentUrlRef.current);
        }
        
        currentUrlRef.current = url;

        // Carregar dimensões e aplicar downsampling se necessário
        const img = new Image();
        let isCancelled = false;
        
        img.onload = () => {
          // Verifica se ainda é o arquivo correto (não foi cancelado)
          if (isCancelled || currentUrlRef.current !== url) {
            URL.revokeObjectURL(url);
            return;
          }
          
          const imgInfo = { width: img.width, height: img.height };
          console.log(`[Preview] ${ext.toUpperCase()} carregado: ${img.width}x${img.height}px${isThumbnail ? ' (thumbnail mode)' : ''}`);
          setImageInfo(imgInfo);
          
          let finalUrl = url;
          
          // Aplica downsampling se necessário
          const optimizedUrl = applyDownsampling(img, MAX_PREVIEW_DIMENSION, isThumbnail, fileSize, ext);
          if (optimizedUrl) {
            // Só revoga o blob URL após criar o data URL otimizado
            // Isso garante que a imagem já foi carregada completamente
            finalUrl = optimizedUrl;
            // Revoga o blob URL de forma assíncrona para não interferir
            requestAnimationFrame(() => {
              URL.revokeObjectURL(url);
            });
          }
          
          // Adiciona ao cache
          addToCache(path, finalUrl, imgInfo, fileModifiedTime);
          currentUrlRef.current = finalUrl;
          setPreviewUrl(finalUrl);
        };
        img.onerror = (err) => {
          console.error('[Preview] Erro ao carregar imagem:', err);
          if (!isCancelled) {
            URL.revokeObjectURL(url);
            setError('Erro ao carregar dimensões da imagem');
          }
        };
        img.src = url;
        
        // Armazena função de cancelamento
        cancelLoadRef.current = () => {
          isCancelled = true;
          // Não revoga aqui, deixa o onload/onerror fazer isso
        };
        
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
          
          // Aplica downsampling se necessário
          const optimizedUrl = applyDownsampling(img, MAX_PREVIEW_DIMENSION, isThumbnail, fileSize, ext);
          if (optimizedUrl) {
            finalUrl = optimizedUrl;
          }
          
          // Adiciona ao cache
          addToCache(path, finalUrl, imgInfo, fileModifiedTime);
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
  }, [isThumbnail]);

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

    // Verifica periodicamente se o arquivo foi modificado (polling a cada 2 segundos)
    const checkInterval = setInterval(async () => {
      try {
        const cached = previewCache.get(filePath);
        if (cached) {
          const stats = await electronService.getFileStats(filePath);
          const fileModifiedTime = stats.mtimeMs;
          
          // Se arquivo foi modificado, força refresh
          if (cached.fileModifiedTime !== fileModifiedTime) {
            console.log('[Preview] Arquivo modificado detectado, forçando refresh:', filePath);
            loadPreview(filePath, true);
          }
        }
      } catch (err) {
        // Ignora erros de polling
      }
    }, 2000); // Verifica a cada 2 segundos

    // Cleanup quando o componente desmonta ou filePath muda
    return () => {
      clearInterval(checkInterval);
      // Cancela carregamento em andamento
      if (cancelLoadRef.current) {
        cancelLoadRef.current();
        cancelLoadRef.current = null;
      }
      // Revoga blob URL se existir
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
