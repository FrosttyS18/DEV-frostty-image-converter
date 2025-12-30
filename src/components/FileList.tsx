import { useState, useRef, useEffect } from 'react';
import { FileInfo, ConversionType } from '../types';
import { getValidConversions } from '../utils/conversionValidator';
import { useImagePreview } from '../hooks/useImagePreview';

interface FileListProps {
  files: FileInfo[];
  selectedFile: FileInfo | null;
  onSelectFile: (file: FileInfo) => void;
  onConvert: (file: FileInfo, type: ConversionType) => void;
  onSelectFolder: () => void;
  isConverting: boolean;
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
  isConverting,
}: FileListProps) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    file: null,
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Fecha menu ao clicar fora
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

  return (
    <div className="w-96 glass rounded-2xl p-6 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-2">Arquivos</h2>
        <button
          onClick={onSelectFolder}
          disabled={isConverting}
          className="w-full glass-button rounded-xl px-4 py-3 text-sm font-medium text-white
                   hover:bg-white/10 transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed
                   border border-white/10"
        >
          Selecionar Pasta
        </button>
      </div>

      {/* Separador */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-4" />

      {/* Lista de arquivos */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {files.length === 0 ? (
          <div className="text-center py-12 text-purple-300/60">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-sm">Nenhum arquivo carregado</p>
            <p className="text-xs mt-1">Selecione uma pasta</p>
          </div>
        ) : (
          files.map((file, index) => (
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
                <FileThumbnail file={file} />

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

      {/* Menu contextual */}
      {contextMenu.visible && contextMenu.file && (
        <div
          ref={contextMenuRef}
          className="fixed z-[99999] glass rounded-xl border border-white/20 shadow-2xl py-2 min-w-[200px]
                     backdrop-blur-xl animate-fade-in"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-xs font-medium text-purple-300 truncate">
              {contextMenu.file.name}
            </p>
          </div>

          <div className="py-1">
            {getValidOptions(contextMenu.file).map((option) => (
              <button
                key={option.type}
                onClick={() => handleConvertClick(option.type)}
                disabled={!option.enabled || isConverting}
                className={`
                  w-full px-4 py-2 text-left text-sm
                  transition-colors duration-150
                  ${option.enabled && !isConverting
                    ? 'text-white hover:bg-purple-500/20 cursor-pointer'
                    : 'text-white/30 cursor-not-allowed'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de thumbnail com lazy loading
const FileThumbnail = ({ file }: { file: FileInfo }) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!thumbnailRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAttemptedLoad) {
            setShouldLoad(true);
            setHasAttemptedLoad(true);
            // Desconecta após carregar para economizar recursos
            if (observerRef.current && thumbnailRef.current) {
              observerRef.current.unobserve(thumbnailRef.current);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Começa a carregar 50px antes de ficar visível
        threshold: 0.01,
      }
    );

    observerRef.current.observe(thumbnailRef.current);

    // Cleanup: desconecta observer quando componente desmonta
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [hasAttemptedLoad]);

  const { previewUrl, isLoading } = useImagePreview(shouldLoad ? file.path : null);

  // Placeholder enquanto não está visível
  if (!shouldLoad) {
    return (
      <div ref={thumbnailRef} className={`
        w-10 h-10 rounded-lg flex items-center justify-center
        ${file.extension === '.png' ? 'bg-green-500/20' : ''}
        ${file.extension === '.tga' ? 'bg-blue-500/20' : ''}
        ${file.extension === '.ozt' ? 'bg-purple-500/20' : ''}
        ${file.extension === '.ozj' ? 'bg-yellow-500/20' : ''}
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
    `}>
      <span className="text-xs font-bold text-white uppercase">
        {file.extension.replace('.', '')}
      </span>
    </div>
  );
};

export default FileList;
