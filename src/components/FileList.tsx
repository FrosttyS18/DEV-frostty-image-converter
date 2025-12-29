import { useState } from 'react';
import { FileInfo } from '../types';
import { EXTENSION_COLORS } from '../constants/formats';
import { formatFileSize } from '../utils/formatters';

interface FileListProps {
  files: FileInfo[];
  onFileSelect: (path: string) => void;
}

const FileList = ({ files, onFileSelect }: FileListProps) => {
  const [search, setSearch] = useState('');
  
  const getExtensionColor = (ext: string): string => {
    return EXTENSION_COLORS[ext.toLowerCase()] || 'text-gray-400';
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.extension.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div data-glow className="glass rounded-2xl p-4 flex-1 overflow-hidden flex flex-col">
      <h3 className="text-white font-semibold mb-2 text-sm">
        Arquivos ({filteredFiles.length}/{files.length})
      </h3>
      
      {/* Busca */}
      <input
        type="text"
        placeholder="Buscar... (ex: .tga, .png)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-3 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
      />
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredFiles.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-8">
            {files.length === 0 ? 'Nenhum arquivo selecionado' : 'Nenhum arquivo encontrado'}
          </div>
        ) : (
          filteredFiles.map((file, index) => (
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
