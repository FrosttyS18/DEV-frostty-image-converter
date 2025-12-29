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
      <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const borderColors = {
    success: 'border-green-400/20',
    error: 'border-red-400/20',
    warning: 'border-yellow-400/20',
    info: 'border-purple-400/20',
  };

  const bgColors = {
    success: 'bg-green-500/10',
    error: 'bg-red-500/10',
    warning: 'bg-yellow-500/10',
    info: 'bg-purple-500/10',
  };

  const textColors = {
    success: 'text-white',
    error: 'text-white',
    warning: 'text-white',
    info: 'text-white',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[10000] animate-slide-in-right">
      <div 
        data-glow
        className={`
          glass rounded-xl px-4 py-3
          border ${borderColors[type]} ${bgColors[type]}
          shadow-[0_20px_60px_rgba(0,0,0,0.55)]
          backdrop-blur-xl
          flex items-center gap-3
          max-w-[280px]
          transform transition-all duration-300
          hover:scale-[1.02]
        `}
      >
        {/* Ícone */}
        <div className="animate-bounce-in flex-shrink-0">
          {icons[type]}
        </div>
        
        {/* Mensagem */}
        <p className={`text-xs font-medium flex-1 whitespace-nowrap overflow-hidden text-ellipsis ${textColors[type]}`}>
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
        
        {/* Barra de progresso */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 rounded-b-xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 animate-progress"
              style={{
                animation: `progress ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
};

export default Toast;
