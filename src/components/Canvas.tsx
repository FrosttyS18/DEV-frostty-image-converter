import { useState, useRef, useEffect } from 'react';
import { useImagePreview } from '../hooks/useImagePreview';

interface CanvasProps {
  currentPreview: string | null;
}

const Canvas = ({ currentPreview }: CanvasProps) => {
  const { previewUrl, imageInfo, isLoading, error } = useImagePreview(currentPreview);
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
      // Calcula quanto o mouse moveu desde o início do drag
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Atualiza a posição (movimento relativo)
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      // Atualiza o ponto de início para o próximo frame
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="glass-strong rounded-2xl px-6 py-4">
        <h2 className="text-white text-xl font-semibold">Canvas Visualizador</h2>
        {imageInfo && (
          <p className="text-purple-300 text-sm mt-1">
            {imageInfo.width} × {imageInfo.height} pixels
          </p>
        )}
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
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              transformOrigin: 'center center',
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
      
      {/* Info footer */}
      {currentPreview && (
        <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between">
          <p className="text-purple-300 text-sm">
            Arquivo selecionado para preview
          </p>
          {imageInfo && (
            <div className="flex items-center gap-3">
              <span className="text-purple-400 text-xs">
                Zoom: {Math.round(zoom * 100)}%
              </span>
              <span className="text-purple-500/50 text-xs">
                Alt+Scroll = zoom | Espaco = mover | Ctrl+0 = auto-fit
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Canvas;
