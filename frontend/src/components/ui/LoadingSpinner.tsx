'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'gray' | 'white';
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'blue',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-3 h-3 border',
    md: 'w-4 h-4 border-2',
    lg: 'w-6 h-6 border-2',
  };

  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  const classes = `${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin ${className}`;

  return <div className={classes} />;
}