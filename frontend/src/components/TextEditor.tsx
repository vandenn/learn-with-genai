'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import TurndownService from 'turndown';

const AUTO_SAVE_INTERVAL_MS = 3000;

interface ActiveFile {
  name: string;
  path: string;
  content: string;
  projectId: string;
}

interface TextEditorProps {
  activeFile: ActiveFile | null;
}

export default function TextEditor({ activeFile }: TextEditorProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: activeFile ? marked(activeFile.content) : '<h1>Welcome</h1><p>Select a file from the sidebar to start editing.</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full p-4 dark:prose-invert',
        'data-placeholder': 'Start writing...',
      },
    },
    immediatelyRender: false,
    onUpdate: () => {
      setHasUnsavedChanges(true);
    },
  });

  // Update editor content when activeFile changes
  useEffect(() => {
    if (editor && activeFile) {
      // Convert markdown to HTML before setting content
      const htmlContent = marked(activeFile.content);
      editor.commands.setContent(htmlContent);
      setHasUnsavedChanges(false);
    }
  }, [activeFile, editor]);

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!editor || !activeFile) return;

    try {
      if (isAutoSave) {
        setIsAutoSaving(true);
      }

      const htmlContent = editor.getHTML();

      // Convert HTML back to markdown before saving
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        bulletListMarker: '-'
      });
      const markdownContent = turndownService.turndown(htmlContent);

      const response = await fetch(`http://localhost:8000/api/v1/projects/${activeFile.projectId}/files/${activeFile.name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: markdownContent }),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
      } else {
        const errorText = await response.text();
        if (!isAutoSave) {
          alert(`Failed to save file: ${errorText}`);
        }
      }
    } catch (err) {
      console.error('Error saving file:', err);
      if (!isAutoSave) {
        alert('Failed to save file');
      }
    } finally {
      if (isAutoSave) {
        setIsAutoSaving(false);
      }
    }
  }, [editor, activeFile]);

  // Auto-save timer
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && !isAutoSaving) {
        handleSave(true);
      }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, isAutoSaving, handleSave]);

  // Add keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header with file info */}
      <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">📄</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {activeFile ? `${activeFile.name}.md` : 'No file selected'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              • {isAutoSaving ? 'Auto-saving...' : hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSave()}
              disabled={!activeFile || !hasUnsavedChanges}
              className={`px-3 py-1 text-xs rounded ${
                activeFile && hasUnsavedChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
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