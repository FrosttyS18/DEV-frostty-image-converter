import { electronService } from '../services/electronService';

const CustomTitlebar = () => {
  const handleMinimize = () => {
    electronService.minimizeWindow();
  };

  const handleMaximize = () => {
    electronService.toggleMaximizeWindow();
  };

  const handleClose = () => {
    electronService.closeWindow();
  };

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-8 bg-gradient-to-r from-[#0a0f1a] via-[#0d1420] to-[#0a0f1a] border-b border-purple-500/20 flex items-center justify-between px-4 z-[9999] rounded-t-[14px]"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Área vazia para arrastar */}
      <div className="flex-1"></div>
      
      {/* Botões de controle */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Minimizar */}
        <button
          onClick={handleMinimize}
          className="w-11 h-8 flex items-center justify-center hover:bg-white/10 transition-colors group"
          aria-label="Minimizar"
        >
          <svg className="w-3 h-3 text-white/60 group-hover:text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor">
            <path strokeLinecap="round" strokeWidth={1.5} d="M0 6h12"/>
          </svg>
        </button>

        {/* Maximizar/Restaurar */}
        <button
          onClick={handleMaximize}
          className="w-11 h-8 flex items-center justify-center hover:bg-white/10 transition-colors group"
          aria-label="Maximizar"
        >
          <svg className="w-3 h-3 text-white/60 group-hover:text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor">
            <rect x="0.75" y="0.75" width="10.5" height="10.5" strokeWidth={1.5}/>
          </svg>
        </button>

        {/* Fechar */}
        <button
          onClick={handleClose}
          className="w-11 h-8 flex items-center justify-center hover:bg-red-600 transition-colors group"
          aria-label="Fechar"
        >
          <svg className="w-3 h-3 text-white/60 group-hover:text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor">
            <path strokeLinecap="round" strokeWidth={1.5} d="M1 1l10 10M11 1L1 11"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CustomTitlebar;
