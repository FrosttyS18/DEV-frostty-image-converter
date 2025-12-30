import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FileInfo, ConversionType } from '../types';
import { getValidConversions } from '../utils/conversionValidator';
import { useImagePreview } from '../hooks/useImagePreview';
import { SUPPORTED_EXTENSIONS } from '../constants/formats';

// Sistema de fila global com prioridades
interface QueueTask {
  execute: () => void;
  priority: number;
  fileSize: number;
}

const thumbnailQueue: QueueTask[] = [];
let activeLoads = { high: 0, medium: 0, low: 0 };
const MAX_LOADS = {
  high: 10,   // Arquivos < 1MB
  medium: 5,  // Arquivos 1-5MB
  low: 2,     // Arquivos > 5MB
};

function getPriority(fileSize: number): 'high' | 'medium' | 'low' {
  if (fileSize < 1024 * 1024) return 'high';
  if (fileSize < 5 * 1024 * 1024) return 'medium';
  return 'low';
}

function canLoad(priority: 'high' | 'medium' | 'low'): boolean {
  return activeLoads[priority] < MAX_LOADS[priority];
}

function processQueue() {
  if (thumbnailQueue.length === 0) return;
  
  // Ordena por prioridade (high = 3, medium = 2, low = 1)
  thumbnailQueue.sort((a, b) => b.priority - a.priority);
  
  // Processa tasks que podem carregar
  for (let i = thumbnailQueue.length - 1; i >= 0; i--) {
    const task = thumbnailQueue[i];
    const priority = getPriority(task.fileSize);
    
    if (canLoad(priority)) {
      thumbnailQueue.splice(i, 1);
      task.execute();
      break; // Processa uma por vez
    }
  }
}

interface FileListProps {
  files: FileInfo[];
  selectedFile: FileInfo | null;
  onSelectFile: (file: FileInfo) => void;
  onConvert: (file: FileInfo, type: ConversionType) => void;
  onSelectFolder: () => void;
  onReloadFolder?: () => void;
  isConverting: boolean;
  folderPath?: string | null;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  file: FileInfo | null;
}

const FileList = ({
  files,
  selectedFile,
  onSelectFile,
  onConvert,
  onSelectFolder,
  onReloadFolder,
  isConverting,
  folderPath,
}: FileListProps) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    file: null,
  });
  const [isScrolling, setIsScrolling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounce do scroll
  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150); // 150ms de debounce
  }, []);
  
  // Cleanup do timeout
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Fecha menu contextual ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0, file: null });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu.visible]);

  // Fecha dropdown de filtro ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFilterOpen]);

  const handleContextMenu = (e: React.MouseEvent, file: FileInfo) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      file,
    });
  };

  const handleConvertClick = (type: ConversionType) => {
    if (contextMenu.file) {
      onConvert(contextMenu.file, type);
      setContextMenu({ visible: false, x: 0, y: 0, file: null });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getValidOptions = (file: FileInfo | null) => {
    if (!file) return [];
    return getValidConversions(file.extension);
  };

  // Filtra arquivos baseado em busca e tipo
  const filteredFiles = files.filter(file => {
    // Filtro de busca por nome
    const matchesSearch = searchQuery === '' || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtro por tipo
    const matchesType = filterType === 'all' || 
      file.extension === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-96 glass rounded-2xl p-6 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-2">Arquivos</h2>
        <div className="flex gap-2">
          <button
            onClick={onSelectFolder}
            disabled={isConverting}
            className="flex-1 glass-button rounded-xl px-4 py-3 text-sm font-medium text-white
                     hover:bg-white/10 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     border border-white/10"
          >
            Selecionar Pasta
          </button>
          {onReloadFolder && folderPath && (
            <div className="relative group">
              <button
                onClick={onReloadFolder}
                disabled={isConverting || !folderPath}
                className="glass-button rounded-xl px-3 py-3 text-sm font-medium text-white
                         hover:bg-white/10 transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         border border-white/10 flex items-center justify-center"
                title="Atualizar lista de arquivos"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
                            bg-black/90 text-white text-xs rounded-lg whitespace-nowrap
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200
                            pointer-events-none z-50">
                Atualizar lista de arquivos
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1
                              border-4 border-transparent border-t-black/90"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Info da pasta selecionada */}
        {folderPath && files.length > 0 && (
          <div className="mt-3 glass-strong rounded-lg px-3 py-2 border border-white/5">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/80 truncate" title={folderPath}>
                  {folderPath}
                </p>
                <p className="text-xs text-purple-300/60 mt-0.5">
                  {files.length} arquivos
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Separador */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-4" />

      {/* Search e Filtro (lado a lado) */}
      {files.length > 0 && (
        <div className="mb-3 space-y-2">
          <div className="flex gap-2">
            {/* Campo de busca */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full h-9 glass-strong rounded-lg px-3 pl-8 text-xs text-white
                         placeholder:text-white/40 border border-white/10
                         focus:border-purple-400/50 focus:outline-none
                         transition-all duration-200"
              />
              <svg 
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Dropdown customizado (glass morphism) */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="h-9 glass-strong rounded-xl px-3 text-xs text-white
                         border border-white/10 flex items-center gap-2
                         hover:border-purple-400/30 focus:outline-none
                         transition-all duration-200 w-24 font-medium"
              >
                <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="flex-1 text-left">
                  {filterType === 'all' ? 'Todos' : filterType.toUpperCase().replace('.', '')}
                </span>
                <svg 
                  className={`w-3 h-3 text-white/40 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isFilterOpen && (
                <div className="absolute top-full mt-1 right-0 w-24 glass rounded-xl border border-white/20
                              shadow-xl py-1 backdrop-blur-xl z-50 animate-fade-in">
                  <button
                    onClick={() => { setFilterType('all'); setIsFilterOpen(false); }}
                    className={`w-full px-3 py-2 text-xs text-center hover:bg-purple-500/20 rounded-lg
                              transition-colors duration-150
                              ${filterType === 'all' ? 'text-purple-300 font-medium' : 'text-white'}`}
                  >
                    Todos
                  </button>
                  {SUPPORTED_EXTENSIONS.map(ext => (
                    <button
                      key={ext}
                      onClick={() => { setFilterType(ext); setIsFilterOpen(false); }}
                      className={`w-full px-3 py-2 text-xs text-center hover:bg-purple-500/20 rounded-lg
                                transition-colors duration-150
                                ${filterType === ext ? 'text-purple-300 font-medium' : 'text-white'}`}
                    >
                      {ext.toUpperCase().replace('.', '')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contador de resultados */}
          {(searchQuery || filterType !== 'all') && (
            <div className="text-xs text-purple-300/60 text-center">
              {filteredFiles.length} de {files.length}
            </div>
          )}
        </div>
      )}

      {/* Lista de arquivos */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-2 pr-2"
      >
        {filteredFiles.length === 0 && files.length > 0 ? (
          <div className="text-center py-12 text-purple-300/60">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm">Nenhum arquivo encontrado</p>
            <p className="text-xs mt-1">Tente outra busca ou filtro</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-purple-300/60">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-sm">Nenhum arquivo carregado</p>
            <p className="text-xs mt-1">Selecione uma pasta</p>
          </div>
        ) : (
          filteredFiles.map((file, index) => (
            <div
              key={`${file.path}-${index}`}
              onClick={() => onSelectFile(file)}
              onContextMenu={(e) => handleContextMenu(e, file)}
              className={`
                glass-strong rounded-lg p-3 cursor-pointer
                transition-all duration-200
                border border-transparent
                hover:border-purple-400/30 hover:bg-white/5
                ${selectedFile?.path === file.path ? 'border-purple-400/50 bg-purple-500/10' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Thumbnail ou ícone do tipo de arquivo */}
                <FileThumbnail file={file} isScrolling={isScrolling} />

                {/* Info do arquivo */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-purple-300/60">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Menu contextual usando Portal */}
      {contextMenu.visible && contextMenu.file && createPortal(
        <div
          ref={contextMenuRef}
          className="fixed z-[999999] glass rounded-xl border border-white/20 shadow-2xl
                     backdrop-blur-xl animate-fade-in w-[160px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          {/* Header compacto com título abreviado */}
          <div className="px-3 py-1.5 border-b border-white/10">
            <p 
              className="text-xs font-medium text-purple-300 truncate"
              title={contextMenu.file.name}
            >
              {contextMenu.file.name}
            </p>
          </div>

          {/* Opções de conversão */}
          <div className="py-1">
            {getValidOptions(contextMenu.file).map((option) => (
              <button
                key={option.type}
                onClick={() => handleConvertClick(option.type)}
                disabled={!option.enabled || isConverting}
                title={option.enabled ? `Converter ${option.label}` : 'Não disponível'}
                className={`
                  w-full px-3 py-2 text-xs text-center rounded-lg mx-1
                  transition-all duration-150
                  ${option.enabled && !isConverting
                    ? 'text-white hover:bg-purple-500/20 cursor-pointer font-medium'
                    : 'text-white/30 cursor-not-allowed'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Componente de thumbnail com lazy loading e fila priorizada
const FileThumbnail = ({ file, isScrolling }: { file: FileInfo; isScrolling: boolean }) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const priority = getPriority(file.size);
  const priorityValue = priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;

  // Intersection Observer para detectar visibilidade
  useEffect(() => {
    if (!thumbnailRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          
          // Se saiu da viewport, remove da fila se ainda não carregou
          if (!entry.isIntersecting && !shouldLoad) {
            const index = thumbnailQueue.findIndex(t => t.execute.name === `load_${file.path}`);
            if (index !== -1) {
              thumbnailQueue.splice(index, 1);
            }
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    observerRef.current.observe(thumbnailRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [file.path, shouldLoad]);

  // Adiciona à fila quando visível e não está scrollando
  useEffect(() => {
    if (isVisible && !isScrolling && !shouldLoad) {
      const loadTask = function executeLoad() {
        if (canLoad(priority)) {
          activeLoads[priority]++;
          setShouldLoad(true);
          
          // Libera slot e processa fila após carregar
          setTimeout(() => {
            activeLoads[priority]--;
            processQueue();
          }, 200);
        } else {
          // Adiciona à fila com prioridade
          thumbnailQueue.push({
            execute: loadTask,
            priority: priorityValue,
            fileSize: file.size,
          });
        }
      };
      
      // Tenta carregar ou adiciona à fila
      loadTask();
    }
  }, [isVisible, isScrolling, shouldLoad, file.size, file.path, priority, priorityValue]);

  // Para thumbnails, usa modo otimizado (max 256x256)
  const { previewUrl, isLoading } = useImagePreview(shouldLoad ? file.path : null, true);

  // Placeholder enquanto não está visível
  if (!shouldLoad) {
    return (
      <div ref={thumbnailRef} className={`
        w-10 h-10 rounded-lg flex items-center justify-center
        ${file.extension === '.png' ? 'bg-green-500/20' : ''}
        ${file.extension === '.tga' ? 'bg-blue-500/20' : ''}
        ${file.extension === '.ozt' ? 'bg-purple-500/20' : ''}
        ${file.extension === '.ozj' ? 'bg-yellow-500/20' : ''}
        ${file.extension === '.jpg' || file.extension === '.jpeg' ? 'bg-orange-500/20' : ''}
      `}>
        <span className="text-xs font-bold text-white uppercase">
          {file.extension.replace('.', '')}
        </span>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div ref={thumbnailRef} className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Preview carregado
  if (previewUrl) {
    return (
      <div ref={thumbnailRef} className="w-10 h-10 rounded-lg overflow-hidden bg-black/20 border border-white/10">
        <img 
          src={previewUrl} 
          alt={file.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback se falhou
  return (
    <div ref={thumbnailRef} className={`
      w-10 h-10 rounded-lg flex items-center justify-center
      ${file.extension === '.png' ? 'bg-green-500/20' : ''}
      ${file.extension === '.tga' ? 'bg-blue-500/20' : ''}
      ${file.extension === '.ozt' ? 'bg-purple-500/20' : ''}
      ${file.extension === '.ozj' ? 'bg-yellow-500/20' : ''}
      ${file.extension === '.jpg' || file.extension === '.jpeg' ? 'bg-orange-500/20' : ''}
    `}>
      <span className="text-xs font-bold text-white uppercase">
        {file.extension.replace('.', '')}
      </span>
    </div>
  );
};

export default FileList;
