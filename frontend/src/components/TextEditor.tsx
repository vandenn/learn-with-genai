'use client';

import { useState } from 'react';

export default function TextEditor() {
  const [content, setContent] = useState(`# Welcome to Learn with GenAI

This is your markdown editor. Start typing to see how it works!

## Features

- **Live markdown editing**
- Syntax highlighting (coming soon)
- AI assistance on the right panel
- Project-based file organization

## Getting Started

1. Select a base folder from the sidebar
2. Choose or create a project
3. Start writing your notes in markdown
4. Use the AI assistant for help and insights

---

*Start editing this text or create a new file to begin your learning journey.*`);

  const [currentFile, setCurrentFile] = useState('welcome.md');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header with file info */}
      <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">📄</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{currentFile}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">• Modified</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
              Save
            </button>
            <button className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full p-4 resize-none border-none outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm leading-6"
          placeholder="Start writing your markdown here..."
          style={{
            fontFamily: 'var(--font-geist-mono), Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
          }}
        />

        {/* Line numbers (optional - could be added later) */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pointer-events-none">
          {content.split('\n').map((_, index) => (
            <div
              key={index}
              className="h-6 flex items-center justify-end pr-2 text-xs text-gray-400 dark:text-gray-500"
            >
              {index + 1}
            </div>
          ))}
        </div>

        {/* Adjust textarea padding to account for line numbers */}
        <style jsx>{`
          textarea {
            padding-left: 3.5rem !important;
          }
        `}</style>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Ln {content.substring(0, content.lastIndexOf('\n')).split('\n').length}, Col 1</span>
            <span>Markdown</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
            <span>{content.length} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}