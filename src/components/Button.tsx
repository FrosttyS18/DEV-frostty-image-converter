import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const Button = ({ children, onClick, disabled = false }: ButtonProps) => {
  // Usa as classes premium do mu-server-manager
  const baseStyles = "premium-btn sm-sidebar-btn w-full py-3 px-4 font-medium text-white text-sm";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={baseStyles}
    >
      {children}
    </button>
  );
};

export default Button;
