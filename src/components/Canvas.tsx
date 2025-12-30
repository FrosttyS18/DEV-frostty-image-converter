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
  const [isSpacePressed, setIsSpacePressed] = useState(false); // Estado interno para tecla espaço
  const isSpacePressedRef = useRef(false); // Ref para evitar re-renders desnecessários
  const [isPanModeActive, setIsPanModeActive] = useState(false); // Estado do botão (só muda ao clicar)
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
  
  // Listener para teclas (ESPACO = pan temporário, Ctrl+0 = auto-fit)
  useEffect(() => {
    if (!previewUrl) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESPACO: permite pan temporário (NÃO ativa o botão visualmente)
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        // Ignora se estiver digitando em um input
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        // Ignora se estiver em um botão ou elemento interativo
        if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
          return;
        }
        // Atualiza ref imediatamente (sem re-render)
        if (!isSpacePressedRef.current) {
          isSpacePressedRef.current = true;
          // Só atualiza estado se necessário para o cursor
          setIsSpacePressed(true);
        }
        // Previne scroll da página, mas NÃO interfere com eventos de mouse
        e.preventDefault();
      }
      
      // Ctrl+0: reseta zoom para auto-fit
      if (e.ctrlKey && e.key === '0') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        console.log('[Canvas] Resetando para auto-fit:', autoFitZoomRef.current);
        setZoom(autoFitZoomRef.current);
        setPosition({ x: 0, y: 0 });
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        // Ignora se estiver digitando em um input
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        // Ignora se estiver em um botão ou elemento interativo
        if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
          return;
        }
        // Atualiza ref imediatamente (sem re-render)
        if (isSpacePressedRef.current) {
          isSpacePressedRef.current = false;
          // Só atualiza estado se necessário para o cursor
          setIsSpacePressed(false);
        }
        // Previne comportamento padrão, mas NÃO interfere com eventos de mouse
        e.preventDefault();
      }
    };
    
    // Usa bubble phase normal (não capture) para evitar conflitos
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
  
  // Pan/arrastar: ESPACO + clique esquerdo OU pan mode ativo OU zoom > 1
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignora se clicou em um botão ou elemento interativo
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    
    // Ignora botão direito ou meio
    if (e.button !== 0) {
      return;
    }
    
    // Ativa pan se:
    // 1. ESPAÇO está pressionado (pan temporário) - usa ref para verificação mais rápida
    // 2. Pan mode está ativo (botão clicado)
    // 3. Zoom > 1 (sempre permite arrastar quando zoomado)
    if (isSpacePressedRef.current || isPanModeActive || zoom > 1) {
      // Previne seleção de texto e outros comportamentos padrão
      e.preventDefault();
      // NÃO usa stopPropagation para não interferir com outros handlers
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX, 
        y: e.clientY 
      });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current && imageInfo) {
      // Calcula delta do movimento
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Calcula limites para evitar que a imagem saia da tela
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 64; // Padding
      const containerHeight = container.clientHeight - 64;
      
      const scaledWidth = imageInfo.width * zoom;
      const scaledHeight = imageInfo.height * zoom;
      
      setPosition(prev => {
        // Calcula nova posição
        let newX = prev.x + deltaX;
        let newY = prev.y + deltaY;
        
        // Aplica limites apenas se a imagem for maior que o container
        // Se a imagem for menor, permite movimento livre (sem limites rígidos)
        if (scaledWidth > containerWidth) {
          // Limites: a imagem não pode sair completamente da área visível
          const maxX = (scaledWidth - containerWidth) / 2;
          const minX = -maxX;
          newX = Math.max(minX, Math.min(maxX, newX));
        }
        // Se a imagem é menor que o container, permite movimento livre (sem forçar a 0)
        
        if (scaledHeight > containerHeight) {
          // Limites: a imagem não pode sair completamente da área visível
          const maxY = (scaledHeight - containerHeight) / 2;
          const minY = -maxY;
          newY = Math.max(minY, Math.min(maxY, newY));
        }
        // Se a imagem é menor que o container, permite movimento livre (sem forçar a 0)
        
        return { x: newX, y: newY };
      });
      
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    // O pan será desativado quando soltar o espaço (no handleKeyUp)
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-4 animate-fade-in">
      {/* Header com info do arquivo */}
      <div className="flex items-stretch gap-4">
        <div className="glass-strong rounded-2xl px-4 py-3 flex-1">
          <h2 className="text-white text-lg font-semibold truncate relative group/filename inline-block">
            {selectedFile?.name || 'Nenhum arquivo selecionado'}
            {selectedFile?.name && (
              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 
                            bg-black/90 text-white text-xs rounded-lg whitespace-nowrap
                            opacity-0 group-hover/filename:opacity-100 transition-opacity duration-200
                            pointer-events-none z-50">
                {selectedFile.name}
                <div className="absolute top-full left-4 -mt-1
                              border-4 border-transparent border-t-black/90"></div>
              </div>
            )}
          </h2>
          <div className="flex items-center gap-2 mt-0.5 text-xs">
            {imageInfo && (
              <span className="text-purple-300 relative group/dimensions inline-block">
                {imageInfo.width}×{imageInfo.height}
                <div className="absolute bottom-full left-0 mb-2 px-2 py-1 
                              bg-black/90 text-white text-xs rounded-lg whitespace-nowrap
                              opacity-0 group-hover/dimensions:opacity-100 transition-opacity duration-200
                              pointer-events-none z-50">
                  Dimensões: {imageInfo.width}×{imageInfo.height} pixels
                  <div className="absolute top-full left-4 -mt-1
                                border-4 border-transparent border-t-black/90"></div>
                </div>
              </span>
            )}
            {selectedFile && (
              <>
                {imageInfo && <span className="text-white/30">•</span>}
                <span className="text-purple-300/80 relative group/filesize inline-block">
                  {formatFileSize(selectedFile.size)}
                  <div className="absolute bottom-full left-0 mb-2 px-2 py-1 
                                bg-black/90 text-white text-xs rounded-lg whitespace-nowrap
                                opacity-0 group-hover/filesize:opacity-100 transition-opacity duration-200
                                pointer-events-none z-50">
                    Tamanho do arquivo: {formatFileSize(selectedFile.size)}
                    <div className="absolute top-full left-4 -mt-1
                                  border-4 border-transparent border-t-black/90"></div>
                  </div>
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
        className="glass rounded-2xl flex-1 min-w-0 min-h-0 p-8 flex items-center justify-center overflow-hidden relative outline-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        tabIndex={-1}
        style={{ 
          cursor: (zoom > 1 || isSpacePressed || isPanModeActive) 
            ? (isDragging ? 'grabbing' : 'grab') 
            : 'default',
          outline: 'none' // Remove contorno ao clicar
        }}
        onFocus={(e) => e.target.blur()} // Remove foco automaticamente
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
            <div className="relative group/zoomout">
              <button
                onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                className="glass-strong rounded-lg p-2 hover:bg-white/10 transition-all border border-white/10"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                            bg-black/90 text-white text-xs rounded-lg whitespace-nowrap
                            opacity-0 group-hover/zoomout:opacity-100 transition-opacity duration-200
                            pointer-events-none z-50">
                Diminuir zoom
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1
                              border-4 border-transparent border-t-black/90"></div>
              </div>
            </div>
            
            <div className="relative group/zoomin">
              <button
                onClick={() => setZoom(Math.min(5, zoom + 0.1))}
                className="glass-strong rounded-lg p-2 hover:bg-white/10 transition-all border border-white/10"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                            bg-black/90 text-white text-xs rounded-lg whitespace-nowrap
                            opacity-0 group-hover/zoomin:opacity-100 transition-opacity duration-200
                            pointer-events-none z-50">
                Aumentar zoom
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1
                              border-4 border-transparent border-t-black/90"></div>
              </div>
            </div>
            
            <div className="relative group/auto">
              <button
                onClick={() => { setZoom(autoFitZoomRef.current); setPosition({ x: 0, y: 0 }); }}
                className="glass-strong rounded-lg px-3 py-2 hover:bg-white/10 transition-all border border-white/10 text-xs text-white font-medium"
              >
                Auto
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                            bg-black/90 text-white text-xs rounded-lg whitespace-nowrap
                            opacity-0 group-hover/auto:opacity-100 transition-opacity duration-200
                            pointer-events-none z-50">
                Ajustar zoom automaticamente
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1
                              border-4 border-transparent border-t-black/90"></div>
              </div>
            </div>
            
            <div className="relative group/pan">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Toggle do botão pan mode (só muda ao clicar, não com tecla espaço)
                  setIsPanModeActive(prev => !prev);
                }}
                onMouseDown={(e) => {
                  // Previne que o clique no botão interfira com o pan
                  e.stopPropagation();
                }}
                className={`
                  glass-strong rounded-lg p-2 transition-all border
                  ${isPanModeActive 
                    ? 'bg-purple-500/20 border-purple-400/50 hover:bg-purple-500/30 hover:border-purple-400/60' 
                    : 'border-white/10 hover:bg-white/10 hover:border-purple-400/30'
                  }
                `}
              >
                <svg 
                  className={`w-4 h-4 transition-colors ${
                    isPanModeActive ? 'text-purple-300' : 'text-white'
                  }`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                            bg-black/90 text-white text-xs rounded-lg whitespace-nowrap
                            opacity-0 group-hover/pan:opacity-100 transition-opacity duration-200
                            pointer-events-none z-50">
                {isPanModeActive ? 'Desativar' : 'Ativar'} modo pan permanente (ou pressione ESPAÇO temporariamente)
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1
                              border-4 border-transparent border-t-black/90"></div>
              </div>
            </div>
          </div>
          
          {/* Indicador de zoom */}
          <div className="text-white/60 text-xs font-mono relative group/zoomdisplay inline-block">
            Zoom: {Math.round(zoom * 100)}%
            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 
                          bg-black/90 text-white text-xs rounded-lg whitespace-nowrap
                          opacity-0 group-hover/zoomdisplay:opacity-100 transition-opacity duration-200
                          pointer-events-none z-50">
              Nível de zoom atual: {Math.round(zoom * 100)}%
              <div className="absolute top-full right-4 -mt-1
                            border-4 border-transparent border-t-black/90"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
