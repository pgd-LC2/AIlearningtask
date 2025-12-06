import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({ children, className = '', onClick, hoverable = false, ...rest }: CardProps) {
  const hoverStyles = hoverable ? 'hover:shadow-lg hover:border-gray-400 cursor-pointer' : '';
  const clickable = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all duration-200 ${hoverStyles} ${clickable} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
}
