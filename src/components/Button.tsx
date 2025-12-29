import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const Button = ({ children, onClick, disabled = false, variant = 'primary' }: ButtonProps) => {
  const baseStyles = "w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 border";
  
  const variantStyles = variant === 'primary' 
    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-purple-500 hover:shadow-lg hover:shadow-purple-500/50"
    : "bg-transparent hover:bg-white/5 text-white border-purple-500/30 hover:border-purple-500/50";
  
  const disabledStyles = "opacity-50 cursor-not-allowed hover:shadow-none";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles}
        ${disabled ? disabledStyles : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
};

export default Button;
