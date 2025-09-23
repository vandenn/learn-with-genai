'use client';

import LoadingSpinner from '../ui/LoadingSpinner';

interface ThinkingIndicatorProps {
  isVisible: boolean;
}

export default function ThinkingIndicator({ isVisible }: ThinkingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-300 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <LoadingSpinner size="sm" color="blue" />
        <span className="text-sm text-blue-600 dark:text-blue-300">Thinking...</span>
      </div>
    </div>
  );
}