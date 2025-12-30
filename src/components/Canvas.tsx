import { useState, useRef, useEffect, useCallback } from 'react';
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
  const dragStartRef = useRef({ x: 0, y: 0 }); // MUDANÇA: De useState para useRef (Instantâneo)
  const [isSpacePressed, setIsSpacePressed] = useState(false); // Estado interno para tecla espaço
  const isSpacePressedRef = useRef(false); // Ref para evitar re-renders desnecessários
  const [isPanModeActive, setIsPanModeActive] = useState(false); // Estado do botão (só muda ao clicar)
  const containerRef = useRef<HTMLDivElement>(null);
  const autoFitZoomRef = useRef<number>(1);
  
  // Sistema de inércia (Kinetic Scrolling)
  const velocityRef = useRef({ x: 0, y: 0 }); // Velocidade atual
  const lastPositionsRef = useRef<Array<{ x: number; y: number; time: number }>>([]); // Histórico de posições para média móvel
  const animationFrameRef = useRef<number | null>(null);
  const FRICTION = 0.925; // Sweet spot para sensação "pesada" tipo Photoshop
  
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
  
  // NOVO: Adicione isso para corrigir bugs ao redimensionar a janela
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // Força o React a recalcular os limites com o novo tamanho
      // Usamos o setPosition com o valor atual apenas para disparar o re-render
      setPosition(prev => ({ ...prev }));
    });

    observer.observe(container);
    
    // Cleanup: desliga o observador quando sair da tela
    return () => observer.disconnect();
  }, []);
  
  // Listener para teclas (ESPACO = pan temporário, Ctrl+0 = auto-fit)
  useEffect(() => {
    if (!previewUrl) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESPACO: permite pan temporário (NÃO ativa o botão visualmente)
      // Só funciona quando NÃO está digitando texto
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        
        // SÓ ignora se estiver digitando em um input/textarea
        // Fora disso, SEMPRE ativa a mãozinha
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return; // Deixa o espaço funcionar normalmente para digitação
        }
        
        // CORREÇÃO: Sempre previne o scroll, independente se é repeat ou não
        e.preventDefault();
        
        // Só atualiza o estado se NÃO for repetição (para performance)
        if (!e.repeat) {
          // Atualiza ref imediatamente (sem re-render)
          if (!isSpacePressedRef.current) {
            isSpacePressedRef.current = true;
            // Só atualiza estado se necessário para o cursor
            setIsSpacePressed(true);
          }
        }
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
        
        // SÓ ignora se estiver digitando em um input/textarea
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return; // Deixa o espaço funcionar normalmente para digitação
        }
        
        // Atualiza ref imediatamente (sem re-render)
        if (isSpacePressedRef.current) {
          isSpacePressedRef.current = false;
          // Só atualiza estado se necessário para o cursor
          setIsSpacePressed(false);
        }
        // Se estava arrastando, para o arrasto quando soltar espaço
        if (isDragging) {
          setIsDragging(false);
        }
        // Previne comportamento padrão quando espaço é usado para pan
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
  }, [previewUrl, isDragging]);
  
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
      
      // Zera velocidade e histórico ao iniciar novo arraste
      velocityRef.current = { x: 0, y: 0 };
      lastPositionsRef.current = [];
      
      // Cancela animação anterior se existir
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setIsDragging(true);
      
      // MUDANÇA: Grava posição inicial no Ref (Instantâneo)
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };
  
  // Função auxiliar para calcular limites baseados no tamanho escalado (com zoom)
  // Versão "mesa livre": permite arrastar imagens pequenas livremente pela tela
  const calculateLimits = useCallback(() => {
    if (!containerRef.current || !imageInfo) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth; 
    const containerHeight = container.clientHeight;
    
    const scaledWidth = imageInfo.width * zoom;
    const scaledHeight = imageInfo.height * zoom;
    
    const overflowX = scaledWidth - containerWidth;
    const overflowY = scaledHeight - containerHeight;

    let minX, maxX, minY, maxY;

    // LÓGICA X
    if (overflowX > 0) {
      // Imagem maior que a tela: move pelas bordas da imagem
      maxX = overflowX / 2;
      minX = -overflowX / 2;
    } else {
      // Imagem menor que a tela: permite mover até a imagem encostar na borda oposta
      // Invertemos a lógica: o limite é o espaço vazio
      const emptySpaceX = containerWidth - scaledWidth;
      maxX = emptySpaceX / 2;
      minX = -emptySpaceX / 2;
    }

    // LÓGICA Y
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

  // Função para aplicar limites (clamping) e zerar velocidade se bater na borda
  const applyLimits = useCallback((x: number, y: number) => {
    const limits = calculateLimits();
    let newX = x;
    let newY = y;
    let hitBoundary = false;
    
    // Aplica limites (hard stop)
    if (x < limits.minX) {
      newX = limits.minX;
      hitBoundary = true;
    } else if (x > limits.maxX) {
      newX = limits.maxX;
      hitBoundary = true;
    }
    
    if (y < limits.minY) {
      newY = limits.minY;
      hitBoundary = true;
    } else if (y > limits.maxY) {
      newY = limits.maxY;
      hitBoundary = true;
    }
    
    // Se bateu na borda, zera velocidade (hard stop tipo Photoshop)
    if (hitBoundary) {
      velocityRef.current = { x: 0, y: 0 };
    }
    
    return { x: newX, y: newY };
  }, [calculateLimits]);

  // Função para atualizar posição durante arraste (Fase 1: A "Mão")
  const updatePositionDuringDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current || !imageInfo) return;
    
    // MUDANÇA: Usa o Ref para calcular o Delta
    // Como o Ref atualiza na hora, o Delta é sempre perfeito
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    // Calcula nova posição e armazena para calcular velocidade
    let newPosition = { x: 0, y: 0 };
    setPosition(prev => {
      // Nova posição = posição anterior + delta
      const newX = prev.x + deltaX;
      const newY = prev.y + deltaY;
      
      // Aplica limites
      newPosition = applyLimits(newX, newY);
      return newPosition;
    });
    
    // Calcula velocidade baseada na posição da IMAGEM (não do mouse)
    const now = Date.now();
    const currentPos = { x: newPosition.x, y: newPosition.y, time: now };
    
    // Adiciona à lista de posições recentes (máximo 5) para média móvel
    lastPositionsRef.current.push(currentPos);
    if (lastPositionsRef.current.length > 5) {
      lastPositionsRef.current.shift();
    }
    
    // Calcula velocidade média dos últimos movimentos (média móvel)
    if (lastPositionsRef.current.length >= 2) {
      const first = lastPositionsRef.current[0];
      const last = lastPositionsRef.current[lastPositionsRef.current.length - 1];
      const timeDelta = (last.time - first.time) || 1; // Evita divisão por zero
      
      // Velocidade = diferença de posição da imagem / tempo (normalizada para ~60fps)
      velocityRef.current = {
        x: ((last.x - first.x) / timeDelta) * 16,
        y: ((last.y - first.y) / timeDelta) * 16
      };
    }
    
    // MUDANÇA: Atualiza o Ref para o próximo frame
    dragStartRef.current = { x: clientX, y: clientY };
  }, [isDragging, imageInfo, applyLimits]); // Removido 'dragStart' das dependências

  // Loop de física para inércia (Fase 2: O "Flick")
  const physicsLoop = useCallback(() => {
    const velocity = velocityRef.current;
    
    // Se velocidade for muito baixa, para o loop
    if (Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1) {
      velocityRef.current = { x: 0, y: 0 };
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    
    // Aplica inércia: posição += velocidade
    setPosition(prev => {
      const newX = prev.x + velocity.x;
      const newY = prev.y + velocity.y;
      
      // Aplica limites (pode zerar velocidade se bater na borda)
      const clamped = applyLimits(newX, newY);
      
      return clamped;
    });
    
    // Aplica atrito: velocidade *= atrito
    velocityRef.current = {
      x: velocity.x * FRICTION,
      y: velocity.y * FRICTION
    };
    
    // Continua o loop
    animationFrameRef.current = requestAnimationFrame(physicsLoop);
  }, [applyLimits]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updatePositionDuringDrag(e.clientX, e.clientY);
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Fase 2: Inicia inércia se houver velocidade
    const velocity = velocityRef.current;
    if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
      // Cancela loop anterior se existir
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Inicia loop de física
      animationFrameRef.current = requestAnimationFrame(physicsLoop);
    } else {
      // Se não há velocidade, zera tudo
      velocityRef.current = { x: 0, y: 0 };
      lastPositionsRef.current = [];
    }
    
    // O pan será desativado quando soltar o espaço (no handleKeyUp)
  };

  // Listener global de mouse para continuar arrastando mesmo quando mouse sai do canvas
  // Comportamento tipo Photoshop: objeto trava na borda quando mouse sai, mas continua arrastando
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Continua arrastando mesmo quando mouse está fora do canvas
      updatePositionDuringDrag(e.clientX, e.clientY);
    };

    const handleGlobalMouseUp = () => {
      // Para o arrasto quando soltar o mouse em qualquer lugar
      setIsDragging(false);
      
      // Fase 2: Inicia inércia se houver velocidade
      const velocity = velocityRef.current;
      if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
        // Cancela loop anterior se existir
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        // Inicia loop de física
        animationFrameRef.current = requestAnimationFrame(physicsLoop);
      } else {
        // Se não há velocidade, zera tudo
        velocityRef.current = { x: 0, y: 0 };
        lastPositionsRef.current = [];
      }
    };

    // Adiciona listeners globais no document para capturar movimento mesmo fora do canvas
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, updatePositionDuringDrag, physicsLoop]);

  // Cleanup: cancela animação quando componente desmonta
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
      
      {/* Canvas área - física controla o movimento, sem padding para cálculo correto */}
      <div 
        ref={containerRef}
        className="glass rounded-2xl flex-1 min-w-0 min-h-0 flex items-center justify-center overflow-hidden relative outline-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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
        ) : previewUrl && imageInfo ? (
          <div 
            className="relative flex items-center justify-center"
            style={{
              // Forçamos o wrapper a ter o tamanho exato da imagem
              width: imageInfo.width, 
              height: imageInfo.height,
              // Aplicamos o transform
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
              style={{
                imageRendering: 'pixelated',
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
