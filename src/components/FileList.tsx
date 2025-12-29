import { FileInfo } from '../types';
import { EXTENSION_COLORS } from '../constants/formats';
import { formatFileSize } from '../utils/formatters';

interface FileListProps {
  files: FileInfo[];
  onFileSelect: (path: string) => void;
}

const FileList = ({ files, onFileSelect }: FileListProps) => {
  const getExtensionColor = (ext: string): string => {
    return EXTENSION_COLORS[ext.toLowerCase()] || 'text-gray-400';
  };

  return (
    <div className="glass rounded-2xl p-4 flex-1 overflow-hidden flex flex-col">
      <h3 className="text-white font-semibold mb-3 text-sm">
        Arquivos ({files.length})
      </h3>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {files.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-8">
            Nenhum arquivo selecionado
          </div>
        ) : (
          files.map((file, index) => (
            <div
              key={index}
              onClick={() => onFileSelect(file.path)}
              className="glass rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate group-hover:text-purple-300 transition-colors">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-mono ${getExtensionColor(file.extension)}`}>
                      {file.extension.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileList;
