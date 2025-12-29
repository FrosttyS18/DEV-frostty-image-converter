const Logo = () => {
  return (
    <div className="glass-strong rounded-2xl p-6 flex items-center justify-center glow-purple">
      <div className="text-center">
        {/* Logo SVG - Estilo "DEU Frostty" */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Seta esquerda roxa */}
            <path 
              d="M2 20L18 10L18 30L2 20Z" 
              fill="url(#gradient1)"
            />
            {/* Seta direita roxa */}
            <path 
              d="M38 20L22 30L22 10L38 20Z" 
              fill="url(#gradient2)"
            />
            
            <defs>
              <linearGradient id="gradient1" x1="2" y1="20" x2="18" y2="20">
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#7B3FF2" />
              </linearGradient>
              <linearGradient id="gradient2" x1="22" y1="20" x2="38" y2="20">
                <stop offset="0%" stopColor="#7B3FF2" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
          </svg>
          
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              DEU<span className="text-xs align-super">®</span>
            </h1>
            <p className="text-sm text-purple-300 tracking-wider">Frostty</p>
          </div>
        </div>
        
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
      </div>
    </div>
  );
};

export default Logo;
