import { useState, useRef, useEffect, useCallback } from 'react';
import { useImagePreview } from '../hooks/useImagePreview';
import { FileInfo } from '../types';
import logoSvg from '../assets/logo-dev-frostty.svg';
import { useTranslation } from '../hooks/useTranslation';

interface CanvasProps {
  currentPreview: string | null;
  selectedFile?: FileInfo | null;
}

const Canvas = ({ currentPreview, selectedFile }: CanvasProps) => {
  const { previewUrl, imageInfo, isLoading, error } = useImagePreview(currentPreview);
  const { t } = useTranslation();
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const autoFitZoomRef = useRef<number>(1);
  
  // REMOVIDO: const [isPanModeActive, setIsPanModeActive] = useState(false);
  
  // Sistema de inércia e física
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastPositionsRef = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const animationFrameRef = useRef<number | null>(null);
  const FRICTION = 0.925;

  // 1. Auto-fit ao carregar imagem
  useEffect(() => {
    if (!imageInfo || !containerRef.current) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      autoFitZoomRef.current = 1;
      return;
    }
    
    const container = containerRef.current;
    // Mantém o padding visual no cálculo (-64px)
    const containerWidth = container.clientWidth - 64; 
    const containerHeight = container.clientHeight - 64;
    
    const scaleX = containerWidth / imageInfo.width;
    const scaleY = containerHeight / imageInfo.height;
    const autoZoom = Math.min(scaleX, scaleY, 1);
    
    autoFitZoomRef.current = autoZoom;
    setZoom(autoZoom);
    setPosition({ x: 0, y: 0 });
  }, [imageInfo]);

  // 2. Observer para redimensionamento da janela
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // Força re-render para recalcular limites se a janela mudar
      setPosition(prev => ({ ...prev }));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  
  // 3. Atalhos de Teclado (Apenas Ctrl+0 para resetar)
  useEffect(() => {
    if (!previewUrl) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+0: reseta zoom para auto-fit
      if (e.ctrlKey && e.key === '0') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setZoom(autoFitZoomRef.current);
        setPosition({ x: 0, y: 0 });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewUrl]);
  
  // 4. Zoom com Alt + Scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prevZoom => Math.max(0.1, Math.min(10, prevZoom * delta)));
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);
  
  // 5. Início do Arraste (Sempre ativo se tiver imagem)
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) return;
    if (e.button !== 0) return; // Apenas botão esquerdo
    
    // ALTERADO: Ativa sempre que tiver imagem carregada
    if (previewUrl && imageInfo) {
      e.preventDefault();
      
      velocityRef.current = { x: 0, y: 0 };
      lastPositionsRef.current = [];
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };
  
  // 6. Cálculos de Limites (Física)
  const calculateLimits = useCallback(() => {
    if (!containerRef.current || !imageInfo) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const scaledWidth = imageInfo.width * zoom;
    const scaledHeight = imageInfo.height * zoom;
    
    const overflowX = scaledWidth - containerWidth;
    const overflowY = scaledHeight - containerHeight;

    let minX, maxX, minY, maxY;

    if (overflowX > 0) {
      maxX = overflowX / 2;
      minX = -overflowX / 2;
    } else {
      const emptySpaceX = containerWidth - scaledWidth;
      maxX = emptySpaceX / 2;
      minX = -emptySpaceX / 2;
    }

    if (overflowY > 0) {
      maxY = overflowY / 2;
      minY = -overflowY / 2;
    } else {
      const emptySpaceY = containerHeight - scaledHeight;
      maxY = emptySpaceY / 2;
      minY = -emptySpaceY / 2;
    }
    
    return { minX, maxX, minY, maxY };
  }, [zoom, imageInfo]);

  const applyLimits = useCallback((x: number, y: number) => {
    const limits = calculateLimits();
    let newX = x;
    let newY = y;
    let hitBoundary = false;
    
    if (x < limits.minX) { newX = limits.minX; hitBoundary = true; }
    else if (x > limits.maxX) { newX = limits.maxX; hitBoundary = true; }
    
    if (y < limits.minY) { newY = limits.minY; hitBoundary = true; }
    else if (y > limits.maxY) { newY = limits.maxY; hitBoundary = true; }
    
    if (hitBoundary) velocityRef.current = { x: 0, y: 0 };
    
    return { x: newX, y: newY };
  }, [calculateLimits]);

  // 7. Atualização durante o arraste
  const updatePositionDuringDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current || !imageInfo) return;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    let newPosition = { x: 0, y: 0 };
    
    setPosition(prev => {
      const newX = prev.x + deltaX;
      const newY = prev.y + deltaY;
      newPosition = applyLimits(newX, newY);
      return newPosition;
    });
    
    const now = Date.now();
    const currentPos = { x: newPosition.x, y: newPosition.y, time: now };
    
    lastPositionsRef.current.push(currentPos);
    if (lastPositionsRef.current.length > 5) lastPositionsRef.current.shift();
    
    if (lastPositionsRef.current.length >= 2) {
      const first = lastPositionsRef.current[0];
      const last = lastPositionsRef.current[lastPositionsRef.current.length - 1];
      const timeDelta = (last.time - first.time) || 1;
      velocityRef.current = {
        x: ((last.x - first.x) / timeDelta) * 16,
        y: ((last.y - first.y) / timeDelta) * 16
      };
    }
    
    dragStartRef.current = { x: clientX, y: clientY };
  }, [isDragging, imageInfo, applyLimits]);

  // 8. Loop de Física
  const physicsLoop = useCallback(() => {
    const velocity = velocityRef.current;
    if (Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1) {
      velocityRef.current = { x: 0, y: 0 };
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    setPosition(prev => {
      const newX = prev.x + velocity.x;
      const newY = prev.y + velocity.y;
      return applyLimits(newX, newY);
    });
    
    velocityRef.current = {
      x: velocity.x * FRICTION,
      y: velocity.y * FRICTION
    };
    animationFrameRef.current = requestAnimationFrame(physicsLoop);
  }, [applyLimits]);

  // 9. Handlers Globais e Locais
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) updatePositionDuringDrag(e.clientX, e.clientY);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    const velocity = velocityRef.current;
    if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(physicsLoop);
    } else {
      velocityRef.current = { x: 0, y: 0 };
      lastPositionsRef.current = [];
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleGlobalMouseMove = (e: MouseEvent) => updatePositionDuringDrag(e.clientX, e.clientY);
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      const velocity = velocityRef.current;
      if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(physicsLoop);
      } else {
        velocityRef.current = { x: 0, y: 0 };
        lastPositionsRef.current = [];
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, updatePositionDuringDrag, physicsLoop]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // === RENDERIZAÇÃO ===
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-stretch gap-4">
        <div className="glass-strong rounded-2xl px-4 py-3 flex-1">
          <h2 className="text-white text-lg font-semibold truncate relative group/filename inline-block">
            {selectedFile?.name || t('noFileSelected')}
            {selectedFile?.name && (
              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/filename:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                {selectedFile.name}
                <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-black/90"></div>
              </div>
            )}
          </h2>
          <div className="flex items-center gap-2 mt-0.5 text-xs">
            {imageInfo && (
              <span className="text-purple-300">
                {imageInfo.width}×{imageInfo.height}
              </span>
            )}
            {selectedFile && (
              <>
                {imageInfo && <span className="text-white/30">•</span>}
                <span className="text-purple-300/80">
                  {formatFileSize(selectedFile.size)}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src={logoSvg} 
            alt="DEV Frostty" 
            className="h-full w-auto opacity-80 drop-shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            style={{ maxHeight: '80px' }}
          />
        </div>
      </div>
      
      {/* Canvas */}
      <div 
        ref={containerRef}
        className="glass rounded-2xl flex-1 min-w-0 min-h-0 flex items-center justify-center overflow-hidden relative outline-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        tabIndex={-1}
        style={{ 
          // ALTERADO: Cursor grab aparece sempre que tiver imagem carregada
          cursor: (previewUrl && imageInfo)
            ? (isDragging ? 'grabbing' : 'grab') 
            : 'default',
          outline: 'none'
        }}
        onFocus={(e) => e.target.blur()}
      >
        {isLoading ? (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">{t('loading.loadingPreview')}</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-400">{error}</p>
          </div>
        ) : previewUrl && imageInfo ? (
          <div 
            className="relative flex items-center justify-center"
            style={{
              width: imageInfo.width, 
              height: imageInfo.height,
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'none',
              willChange: 'transform',
            }}
          >
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain rounded-lg shadow-2xl select-none"
              draggable={false}
              style={{ imageRendering: 'auto' }}
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
              <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">{t('selectFileToView')}</p>
          </div>
        )}
      </div>
      
      {/* Toolbar */}
      {currentPreview && imageInfo && (
        <div className="glass rounded-2xl px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Zoom Out */}
            <div className="relative group/zoomout">
              <button
                onClick={(e) => {
                  setZoom(Math.max(0.1, zoom - 0.1));
                  e.currentTarget.blur();
                }}
                className="glass-strong rounded-lg p-2 hover:bg-white/10 transition-all border border-white/10"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/zoomout:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                {t('zoomOut')}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
              </div>
            </div>
            
            {/* Zoom In */}
            <div className="relative group/zoomin">
              <button
                onClick={(e) => {
                  setZoom(Math.min(5, zoom + 0.1));
                  e.currentTarget.blur();
                }}
                className="glass-strong rounded-lg p-2 hover:bg-white/10 transition-all border border-white/10"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/zoomin:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                {t('zoomIn')}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
              </div>
            </div>
            
            {/* Auto Fit */}
            <div className="relative group/auto">
              <button
                onClick={(e) => { 
                  setZoom(autoFitZoomRef.current); 
                  setPosition({ x: 0, y: 0 }); 
                  e.currentTarget.blur();
                }}
                className="glass-strong rounded-lg px-3 py-2 hover:bg-white/10 transition-all border border-white/10 text-xs text-white font-medium"
              >
                Auto
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/auto:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                {t('autoFit')} (Ctrl+0)
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
              </div>
            </div>
            
            {/* REMOVIDO BOTÃO DE PAN (MÃOZINHA) */}
          </div>
          
          <div className="text-white/60 text-xs font-mono relative group/zoomdisplay inline-block">
            {t('zoomLevel', { level: Math.round(zoom * 100) })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;