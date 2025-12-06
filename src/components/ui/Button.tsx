import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

    const variants = {
      primary: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 shadow-md hover:shadow-lg focus-visible:ring-amber-500',
      secondary: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-md hover:shadow-lg focus-visible:ring-blue-500',
      ghost: 'bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md focus-visible:ring-slate-400',
      outline: 'bg-transparent border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-400',
      danger: 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-md hover:shadow-lg focus-visible:ring-red-500',
      success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg focus-visible:ring-emerald-500'
    };

    const sizes = {
      sm: 'h-8 px-4 text-sm gap-1.5 rounded-full',
      md: 'h-10 px-6 text-sm gap-2 rounded-full',
      lg: 'h-12 px-8 text-base gap-2.5 rounded-full'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
