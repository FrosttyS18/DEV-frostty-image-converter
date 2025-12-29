import { ConversionType } from '../types';
import Logo from './Logo';
import Button from './Button';
import { CONVERSIONS } from '../constants/formats';

interface SidebarProps {
  onSelectFolder: () => void;
  onConvert: (type: ConversionType) => void;
  isConverting: boolean;
  hasFiles: boolean;
}

const Sidebar = ({ 
  onSelectFolder,
  onConvert,
  isConverting,
  hasFiles,
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
          disabled={isConverting}
        >
          Selecionar Pasta
        </Button>
        
        {CONVERSIONS.map((conversion) => (
          <Button
            key={conversion.type}
            onClick={() => onConvert(conversion.type as ConversionType)}
            disabled={isConverting || !hasFiles}
          >
            {isConverting ? 'Convertendo...' : conversion.label}
          </Button>
        ))}
      </div>
      
      {/* Info */}
      {hasFiles && (
        <div className="mt-6 glass-strong rounded-xl p-4 text-center">
          <p className="text-purple-300 text-sm">
            Arquivos carregados!
          </p>
          <p className="text-purple-400/60 text-xs mt-1">
            Selecione na janela de lista
          </p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
