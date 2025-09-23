'use client';

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import TextEditor, { TextEditorRef } from './TextEditor';
import AIAssistant from './AIAssistant';
import ResizeHandle from './ui/ResizeHandle';


export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelWidthPercent, setAiPanelWidthPercent] = useState(30);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const textEditorRef = useRef<TextEditorRef>(null);

  useEffect(() => {
    const loadInitialConfig = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/config');
        if (response.ok) {
          const config = await response.json();

          if (config.active_project_id) {
            setActiveProjectId(config.active_project_id);
          }

          if (config.active_file_path) {
            const fileName = config.active_file_path.split('/').pop()?.replace('.md', '');
            if (fileName) {
              setActiveFileName(fileName);
            }
          }
        }
      } catch (err) {
        console.error('Error loading initial config:', err);
      }
    };

    loadInitialConfig();
  }, []);

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      <div className={`${sidebarCollapsed ? 'w-12' : 'w-64'} transition-all duration-300 ease-in-out`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeProjectId={activeProjectId}
          activeFileName={activeFileName}
          onProjectSelect={setActiveProjectId}
          onFileSelect={setActiveFileName}
        />
      </div>

      <div className="flex-1 flex relative" ref={containerRef}>
        <div
          className="border-r border-gray-300 dark:border-gray-700"
          style={{ width: `${100 - aiPanelWidthPercent}%` }}
        >
          <TextEditor
            ref={textEditorRef}
            activeProjectId={activeProjectId}
            activeFileName={activeFileName}
            onTextSelection={setSelectedText}
          />
        </div>
        <ResizeHandle containerRef={containerRef} onWidthPercentChange={setAiPanelWidthPercent} />
        <div
          style={{ width: `${aiPanelWidthPercent}%`, minWidth: '250px' }}
        >
          <AIAssistant
            activeProjectId={activeProjectId}
            activeFileName={activeFileName}
            selectedText={selectedText}
            textEditorRef={textEditorRef}
          />
        </div>
      </div>
    </div>
  );
}

