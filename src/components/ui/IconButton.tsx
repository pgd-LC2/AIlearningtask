import { ButtonHTMLAttributes, forwardRef } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'danger';
  size?: 'sm' | 'md';
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', className = '', children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

    const variants = {
      ghost: 'hover:bg-gray-100 active:bg-gray-200 text-gray-900',
      danger: 'hover:bg-red-50 active:bg-red-100 text-red-600'
    };

    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-9 h-9'
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
