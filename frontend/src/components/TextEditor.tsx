'use client';

import React, { useRef, useImperativeHandle, useState, useEffect, useCallback, forwardRef } from 'react';
import { Selection } from '@tiptap/extensions';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { File } from '../types';

const AUTO_SAVE_INTERVAL_MS = 3000;
const WELCOME_CONTENT = '<h1>Welcome</h1><p>Select a file from the sidebar to start editing.</p>';

export interface TextEditorRef {
  appendContent: (content: string) => void;
  insertAtCursor: (content: string) => void;
}

interface TextEditorProps {
  activeProjectId: string | null;
  activeFileName: string | null;
  onTextSelection: (text: string) => void;
  ref?: React.Ref<TextEditorRef>;
}

export default function TextEditor({ activeProjectId, activeFileName, onTextSelection, ref }: TextEditorProps) {
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const editor = useEditor({
    extensions: [Selection, StarterKit],
    content: activeFile ? marked(activeFile.content) : WELCOME_CONTENT,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full h-full p-8 dark:prose-invert overflow-y-auto',
        'data-placeholder': 'Start writing...',
      },
    },
    onUpdate: () => {
      setHasUnsavedChanges(true);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const selectedText = editor.state.doc.textBetween(from, to);
        onTextSelection(selectedText);
      } else {
        onTextSelection('');
      }
    },
    immediatelyRender: false,
  });

  useImperativeHandle(ref, () => {
    return {
      appendContent(content: string) {
        if (!editor) return;
        const htmlContent = marked(content);
        editor.commands.focus('end');
        editor.commands.insertContent(htmlContent);

        // Scroll to bottom after content is added
        setTimeout(() => {
          const editorElement = editor.view.dom;
          editorElement.scrollTop = editorElement.scrollHeight;
        }, 100);
      },

      insertAtCursor(content: string) {
        if (!editor) return;
        const htmlContent = marked(content);
        editor.commands.insertContent(htmlContent);
      }
    };
  }, [editor]);

  useEffect(() => {
    const fetchFileData = async () => {
      if (!activeProjectId || !activeFileName) {
        setActiveFile(null);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/v1/projects/${activeProjectId}/files/${activeFileName}`);
        if (response.ok) {
          const fileData = await response.json();
          setActiveFile(fileData);
        } else {
          console.error('Failed to fetch file data:', response.statusText);
          setActiveFile(null);
        }
      } catch (err) {
        console.error('Error fetching file data:', err);
        setActiveFile(null);
      }
    };

    fetchFileData();
  }, [activeProjectId, activeFileName]);

  // Update editor content when activeFile changes
  useEffect(() => {
    if (editor) {
      if (activeFile) {
        const htmlContent = marked(activeFile.content);
        editor.commands.setContent(htmlContent);
        setHasUnsavedChanges(false);
      } else {
        editor.commands.setContent(WELCOME_CONTENT);
        setHasUnsavedChanges(false);
      }
    }
  }, [activeFile, editor]);

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!editor || !activeProjectId || !activeFileName) return;

    try {
      if (isAutoSave) {
        setIsAutoSaving(true);
      }

      const htmlContent = editor.getHTML();
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        bulletListMarker: '-'
      });
      const markdownContent = turndownService.turndown(htmlContent);

      const response = await fetch(`http://localhost:8000/api/v1/projects/${activeProjectId}/files/${activeFileName}`, {
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
  }, [editor, activeProjectId, activeFileName]);

  // Auto-save timer
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && !isAutoSaving) {
        handleSave(true);
      }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, isAutoSaving, handleSave]);

  // Keyboard shortcut for saving
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
    <div className="h-full flex flex-col bg-gray-200 dark:bg-gray-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">📄</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {activeFileName ? `${activeFileName}.md` : 'No file selected'}
            </span>
            {activeFileName && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                • {isAutoSaving ? 'Auto-saving...' : hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSave()}
              disabled={!activeFileName || !hasUnsavedChanges}
              className={`px-3 py-1 text-xs rounded ${
                activeFileName && hasUnsavedChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save (Ctrl + S)
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        <EditorContent
          editor={editor}
          className="h-full overflow-y-auto"
        />
      </div>
    </div>
  );
}