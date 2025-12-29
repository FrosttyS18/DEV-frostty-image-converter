import { ConversionType } from '../types';
import Logo from './Logo';
import Button from './Button';
import { CONVERSIONS } from '../constants/formats';

interface SidebarProps {
  onSelectFolder: () => void;
  onConvert: (type: ConversionType) => void;
  isConverting: boolean;
  currentConversionType: ConversionType | null;
  hasFiles: boolean;
}

const Sidebar = ({ 
  onSelectFolder,
  onConvert,
  isConverting,
  currentConversionType,
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
        
        {CONVERSIONS.map((conversion) => {
          const isThisConverting = isConverting && currentConversionType === conversion.type;
          return (
            <Button
              key={conversion.type}
              onClick={() => onConvert(conversion.type as ConversionType)}
              disabled={isConverting || !hasFiles}
            >
              {isThisConverting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                  Convertendo...
                </span>
              ) : (
                conversion.label
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
