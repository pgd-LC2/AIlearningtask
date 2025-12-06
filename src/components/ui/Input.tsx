import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ fullWidth = false, error, className = '', ...props }, ref) => {
    const baseStyles = 'h-10 px-4 text-sm bg-white border transition-all duration-200';
    const stateStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
    const widthClass = fullWidth ? 'w-full' : '';
    const roundedClass = 'rounded-lg';

    return (
      <div className={widthClass}>
        <input
          ref={ref}
          className={`${baseStyles} ${stateStyles} ${roundedClass} ${widthClass} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600 px-4">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
