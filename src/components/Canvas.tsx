import { useState, useRef, useEffect } from 'react';
import { useImagePreview } from '../hooks/useImagePreview';
import { FileInfo } from '../types';

interface CanvasProps {
  currentPreview: string | null;
  selectedFile?: FileInfo | null;
}

const Canvas = ({ currentPreview, selectedFile }: CanvasProps) => {
  const { previewUrl, imageInfo, isLoading, error } = useImagePreview(currentPreview);
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoFitZoomRef = useRef<number>(1);
  
  // Auto-fit: Calcula zoom inicial para imagem caber no canvas
  useEffect(() => {
    if (!imageInfo || !containerRef.current) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      autoFitZoomRef.current = 1;
      return;
    }
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 64; // Padding
    const containerHeight = container.clientHeight - 64;
    
    // Calcula zoom para caber (usa o menor entre width e height)
    const scaleX = containerWidth / imageInfo.width;
    const scaleY = containerHeight / imageInfo.height;
    const autoZoom = Math.min(scaleX, scaleY, 1); // Máximo 1 (100%)
    
    console.log('[Canvas] Auto-fit calculado:', {
      containerSize: `${containerWidth}x${containerHeight}`,
      imageSize: `${imageInfo.width}x${imageInfo.height}`,
      zoom: `${Math.round(autoZoom * 100)}%`
    });
    
    autoFitZoomRef.current = autoZoom;
    setZoom(autoZoom);
    setPosition({ x: 0, y: 0 }); // Centraliza
  }, [imageInfo]);
  
  // Listener para teclas (ESPACO = pan, Ctrl+0 = auto-fit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESPACO: ativa pan mode
      if (e.code === 'Space' && !e.repeat && previewUrl) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      
      // Ctrl+0: reseta zoom para auto-fit
      if (e.ctrlKey && e.key === '0' && previewUrl) {
        e.preventDefault();
        console.log('[Canvas] Resetando para auto-fit:', autoFitZoomRef.current);
        setZoom(autoFitZoomRef.current);
        setPosition({ x: 0, y: 0 });
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsDragging(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [previewUrl]);
  
  // Zoom com Alt+Scroll (igual Photoshop)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prevZoom => {
          const newZoom = Math.max(0.1, Math.min(10, prevZoom * delta));
          return newZoom;
        });
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);
  
  // Pan/arrastar: ESPACO + clique esquerdo para caminhar
  const handleMouseDown = (e: React.MouseEvent) => {
    // Só ativa pan se ESPACO estiver pressionado OU se zoom > 1
    if (isSpacePressed || zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX, 
        y: e.clientY 
      });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      // Usa requestAnimationFrame para suavidade
      requestAnimationFrame(() => {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        setPosition(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        
        setDragStart({
          x: e.clientX,
          y: e.clientY
        });
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-4 animate-fade-in">
      {/* Header com info do arquivo */}
      <div className="flex items-stretch gap-4">
        <div className="glass-strong rounded-2xl px-4 py-3 flex-1">
          <h2 className="text-white text-lg font-semibold truncate" title={selectedFile?.name}>
            {selectedFile?.name || 'Nenhum arquivo selecionado'}
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
        
        {/* Logo ao lado do box - altura do box */}
        <div className="flex items-center">
          <img 
            src="/src/assets/logo-dev-frostty.svg" 
            alt="DEV Frostty" 
            className="h-full w-auto opacity-80 drop-shadow-[0_0_20px_rgba(139,92,246,0.4)]"
            style={{ maxHeight: '80px' }}
          />
        </div>
      </div>
      
      {/* Canvas área */}
      <div 
        ref={containerRef}
        className="glass rounded-2xl flex-1 min-w-0 min-h-0 p-8 flex items-center justify-center overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          cursor: (zoom > 1 || isSpacePressed) 
            ? (isDragging ? 'grabbing' : 'grab') 
            : 'default' 
        }}
      >
        {isLoading ? (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Carregando preview...</p>
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
        ) : previewUrl ? (
          <div 
            className="relative flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transition: 'none',
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          >
            <img
              src={previewUrl}
              alt="Preview"
              className="rounded-lg shadow-2xl select-none"
              draggable={false}
              style={{
                imageRendering: 'pixelated',
                maxWidth: 'none',
                maxHeight: 'none',
              }}
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">
              Selecione um arquivo para visualizar
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Suporte: PNG, TGA, OZT, OZJ
            </p>
          </div>
        )}
      </div>
      
      {/* Toolbar (estilo Photoshop) */}
      {currentPreview && imageInfo && (
        <div className="glass rounded-2xl px-4 py-2 flex items-center justify-between gap-4">
          {/* Controles de zoom */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              className="glass-strong rounded-lg p-2 hover:bg-white/10 transition-all border border-white/10"
              title="Zoom Out"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            
            <button
              onClick={() => setZoom(Math.min(5, zoom + 0.1))}
              className="glass-strong rounded-lg p-2 hover:bg-white/10 transition-all border border-white/10"
              title="Zoom In"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
            
            <button
              onClick={() => { setZoom(autoFitZoomRef.current); setPosition({ x: 0, y: 0 }); }}
              className="glass-strong rounded-lg px-3 py-2 hover:bg-white/10 transition-all border border-white/10 text-xs text-white font-medium"
              title="Auto-fit"
            >
              Auto
            </button>
            
            <button
              onClick={() => setIsSpacePressed(!isSpacePressed)}
              className={`glass-strong rounded-lg p-2 hover:bg-white/10 transition-all border border-white/10
                         ${isSpacePressed ? 'bg-purple-500/20 border-purple-400/30' : ''}`}
              title="Pan/Mover"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
            </button>
          </div>
          
          {/* Indicador de zoom */}
          <div className="text-white/60 text-xs font-mono">
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
