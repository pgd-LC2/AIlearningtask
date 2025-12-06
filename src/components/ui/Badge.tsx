interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700',
    success: 'bg-gradient-to-r from-green-100 to-green-200 text-green-700',
    warning: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700',
    error: 'bg-gradient-to-r from-red-100 to-red-200 text-red-700',
    info: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700',
    purple: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
