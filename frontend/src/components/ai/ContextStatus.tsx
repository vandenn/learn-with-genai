'use client';

interface ContextStatusProps {
  activeFileName: string | null;
  selectedText: string;
}

export default function ContextStatus({ activeFileName, selectedText }: ContextStatusProps) {
  if (!activeFileName) return null;

  return (
    <div className="mb-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Context: {activeFileName}
        {selectedText.trim() && (
          <span className="text-blue-500 dark:text-blue-400"> (+ highlighted text)</span>
        )}
      </span>
    </div>
  );
}