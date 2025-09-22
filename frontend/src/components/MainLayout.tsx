'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import TextEditor from './TextEditor';
import AIAssistant from './AIAssistant';

interface ActiveFile {
  name: string;
  path: string;
  content: string;
  projectId: string;
}

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelWidth, setAiPanelWidth] = useState(30); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [appendToEditor, setAppendToEditor] = useState<((content: string) => void) | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;

    // Calculate percentage from the right edge
    const newWidth = ((containerWidth - mouseX) / containerWidth) * 100;

    // Constrain between 20% and 60%
    const constrainedWidth = Math.min(Math.max(newWidth, 20), 60);
    setAiPanelWidth(constrainedWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleFileLoad = useCallback((fileData: ActiveFile | null) => {
    setActiveFile(fileData);
  }, []);

  const handleTextSelection = useCallback((text: string) => {
    setSelectedText(text);
  }, []);

  const handleSetAppendFunction = useCallback((appendFn: (content: string) => void) => {
    setAppendToEditor(() => appendFn);
  }, []);

  // Add event listeners for mouse events
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-12' : 'w-64'} transition-all duration-300 ease-in-out`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onFileLoad={handleFileLoad}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex relative" ref={containerRef}>
        {/* Text Editor */}
        <div
          className="border-r border-gray-300 dark:border-gray-700"
          style={{ width: `${100 - aiPanelWidth}%` }}
        >
          <TextEditor
            activeFile={activeFile}
            onTextSelection={handleTextSelection}
            onSetAppendFunction={handleSetAppendFunction}
          />
        </div>

        {/* Resize Handle */}
        <div
          className={`w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-col-resize transition-colors relative ${
            isResizing ? 'bg-blue-500' : ''
          }`}
          onMouseDown={handleMouseDown}
        >
          {/* Visual indicator for resize handle */}
          <div className="absolute inset-y-0 left-0 w-1 flex items-center justify-center">
            <div className="w-0.5 h-8 bg-gray-400 dark:bg-gray-600 rounded-full opacity-50"></div>
          </div>
        </div>

        {/* AI Assistant Panel */}
        <div
          style={{ width: `${aiPanelWidth}%`, minWidth: '250px' }}
        >
          <AIAssistant
            activeProjectId={activeFile?.projectId}
            activeFile={activeFile}
            selectedText={selectedText}
            appendToEditor={appendToEditor}
          />
        </div>
      </div>
    </div>
  );
}