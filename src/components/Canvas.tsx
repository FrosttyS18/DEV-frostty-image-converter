import { useState, useEffect } from 'react';
import { FileInfo } from '../types';

interface CanvasProps {
  currentPreview: string | null;
  selectedFiles: FileInfo[];
}

const Canvas = ({ currentPreview, selectedFiles }: CanvasProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!currentPreview) {
      setPreviewUrl(null);
      setImageInfo(null);
      return;
    }

    const loadPreview = async () => {
      try {
        const fs = window.require('fs');
        const path = window.require('path');
        
        const ext = path.extname(currentPreview).toLowerCase();
        
        if (ext === '.png') {
          // PNG direto
          const data = fs.readFileSync(currentPreview);
          const blob = new Blob([data], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          
          // Carregar dimensões
          const img = new Image();
          img.onload = () => {
            setImageInfo({ width: img.width, height: img.height });
          };
          img.src = url;
          
        } else if (ext === '.tga' || ext === '.ozt' || ext === '.ozj') {
          // Converter para preview
          const { loadImageAsDataUrl } = await import('../utils/imageLoader');
          const dataUrl = await loadImageAsDataUrl(currentPreview);
          setPreviewUrl(dataUrl);
          
          // Carregar dimensões
          const img = new Image();
          img.onload = () => {
            setImageInfo({ width: img.width, height: img.height });
          };
          img.src = dataUrl;
        }
        
      } catch (error) {
        console.error('Erro ao carregar preview:', error);
        setPreviewUrl(null);
      }
    };

    loadPreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [currentPreview]);

  return (
    <div className="flex-1 flex flex-col gap-4 animate-fade-in">
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
      <div className="glass rounded-2xl flex-1 p-8 flex items-center justify-center overflow-hidden">
        {previewUrl ? (
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{
                imageRendering: 'pixelated', // Para manter qualidade de pixel art
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
      {selectedFiles.length > 0 && (
        <div className="glass rounded-2xl px-6 py-3">
          <p className="text-purple-300 text-sm">
            💾 {selectedFiles.length} arquivo(s) carregado(s)
          </p>
        </div>
      )}
    </div>
  );
};

export default Canvas;
