import logoSvg from '../assets/logo-dev-frostty.svg';

const Logo = () => {
  return (
    <div className="flex items-center justify-center py-6">
      <img 
        src={logoSvg} 
        alt="DEV® Frostty" 
        className="w-40 h-auto drop-shadow-lg"
      />
    </div>
  );
};

export default Logo;
