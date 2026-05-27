import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'teal' | 'coral' | 'orange' | 'gray' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const variants = {
  teal: 'bg-[#3EABA2] hover:bg-[#349990] text-white',
  coral: 'bg-[#E74C3C] hover:bg-[#c0392b] text-white',
  orange: 'bg-[#E86742] hover:bg-[#d4572f] text-white',
  gray: 'bg-[#4A4A4A] hover:bg-[#333] text-white',
  outline: 'border border-[#3EABA2] text-[#3EABA2] hover:bg-[#3EABA2] hover:text-white bg-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ children, onClick, variant = 'teal', size = 'md', className = '', disabled, type = 'button' }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
