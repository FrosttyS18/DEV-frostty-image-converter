import { useEffect } from 'react';

/**
 * Hook para efeito spotlight que segue o cursor
 */
export const useGlowPointer = () => {
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      
      document.documentElement.style.setProperty('--x', x.toFixed(2));
      document.documentElement.style.setProperty('--y', y.toFixed(2));
      document.documentElement.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
      document.documentElement.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
    };
    
    document.body.addEventListener('pointermove', handlePointerMove);
    
    return () => {
      document.body.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);
};
