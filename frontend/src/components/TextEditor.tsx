'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

export default function TextEditor() {
  const [currentFile, setCurrentFile] = useState('untitled.md');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<h1>Title</h1>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full p-4 dark:prose-invert',
        'data-placeholder': 'Title',
      },
    },
    immediatelyRender: false,
  });

  const handleSave = () => {
    if (editor) {
      const content = editor.getHTML();
      console.log('Saving content:', content);
      // Here you would typically save to your backend
      alert('File saved! (Mock functionality)');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header with file info */}
      <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">📄</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{currentFile}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">• Saved</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1">
        <EditorContent
          editor={editor}
          className="h-full"
        />
      </div>
    </div>
  );
}