import { useImagePreview } from '../hooks/useImagePreview';

interface CanvasProps {
  currentPreview: string | null;
}

const Canvas = ({ currentPreview }: CanvasProps) => {
  const { previewUrl, imageInfo, isLoading, error } = useImagePreview(currentPreview);

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
      <div className="glass rounded-2xl flex-1 p-8 flex items-center justify-center overflow-auto">
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
          <div className="relative flex items-center justify-center min-w-min min-h-min">
            <img
              src={previewUrl}
              alt="Preview"
              className="rounded-lg shadow-2xl"
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
        <div className="glass rounded-2xl px-6 py-3">
          <p className="text-purple-300 text-sm">
            Arquivo selecionado para preview
          </p>
        </div>
      )}
    </div>
  );
};

export default Canvas;
