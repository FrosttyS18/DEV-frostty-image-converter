import { FileInfo } from '../types';
import { ConversionType } from '../types';
import Logo from './Logo';
import Button from './Button';
import FileList from './FileList';
import { CONVERSIONS } from '../constants/formats';

interface SidebarProps {
  selectedFiles: FileInfo[];
  onSelectFolder: () => void;
  onConvert: (type: ConversionType) => void;
  onFileSelect: (path: string) => void;
  isConverting: boolean;
  isLoadingFiles: boolean;
}

const Sidebar = ({ 
  selectedFiles,
  onSelectFolder,
  onConvert,
  onFileSelect,
  isConverting,
  isLoadingFiles,
}: SidebarProps) => {

  return (
    <div className="w-80 glass rounded-2xl p-6 flex flex-col animate-fade-in">
      {/* Logo */}
      <Logo />
      
      {/* Separador sutil */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent my-4" />
      
      {/* Botões de ação */}
      <div className="flex flex-col gap-3 mb-4">
        <Button 
          onClick={onSelectFolder}
          disabled={isConverting || isLoadingFiles}
        >
          {isLoadingFiles ? 'Carregando...' : 'Selecionar Pasta'}
        </Button>
        
        {CONVERSIONS.map((conversion) => (
          <Button
            key={conversion.type}
            onClick={() => onConvert(conversion.type as ConversionType)}
            disabled={isConverting || selectedFiles.length === 0}
          >
            {isConverting ? 'Convertendo...' : conversion.label}
          </Button>
        ))}
      </div>
      
      {/* Lista de arquivos */}
      <FileList 
        files={selectedFiles}
        onFileSelect={onFileSelect}
      />
    </div>
  );
};

export default Sidebar;
