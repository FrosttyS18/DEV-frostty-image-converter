import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 4000 }: ToastProps) => {
  // Auto-hide após duração
  useEffect(() => {
    if (onClose && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);
  const icons = {
    success: (
      <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const borderColors = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    warning: 'border-yellow-500/30',
    info: 'border-blue-500/30',
  };

  const bgColors = {
    success: 'bg-green-500/5',
    error: 'bg-red-500/5',
    warning: 'bg-yellow-500/5',
    info: 'bg-blue-500/5',
  };

  const textColors = {
    success: 'text-white',
    error: 'text-white',
    warning: 'text-white',
    info: 'text-white',
  };

  return (
    <div className="fixed bottom-8 right-8 z-[10000] animate-fade-in">
      <div 
        data-glow
        className={`
          glass rounded-2xl px-6 py-4 
          border ${borderColors[type]} ${bgColors[type]}
          shadow-[0_20px_60px_rgba(0,0,0,0.55)]
          backdrop-blur-xl
          flex items-center gap-4
          min-w-[320px] max-w-[480px]
        `}
      >
        {/* Ícone */}
        {icons[type]}
        
        {/* Mensagem */}
        <p className={`text-sm font-medium flex-1 ${textColors[type]}`}>
          {message}
        </p>
        
        {/* Botão fechar */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <span className="text-white/60 text-lg leading-none hover:text-white">×</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
