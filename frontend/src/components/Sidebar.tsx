'use client';

import { useState } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface Project {
  id: string;
  name: string;
  files: FileItem[];
}

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Mock data
  const [projects] = useState<Project[]>([
    {
      id: 'project1',
      name: 'Machine Learning Notes',
      files: [
        { id: 'file1', name: 'introduction.md', type: 'file' },
        { id: 'file2', name: 'neural-networks.md', type: 'file' },
        {
          id: 'folder1',
          name: 'algorithms',
          type: 'folder',
          children: [
            { id: 'file3', name: 'linear-regression.md', type: 'file' },
            { id: 'file4', name: 'decision-trees.md', type: 'file' },
          ],
        },
      ],
    },
    {
      id: 'project2',
      name: 'Web Development',
      files: [
        { id: 'file5', name: 'react-basics.md', type: 'file' },
        { id: 'file6', name: 'nextjs-guide.md', type: 'file' },
      ],
    },
  ]);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const selectBaseFolder = () => {
    // Mock function for selecting base folder
    setSelectedFolder('/home/user/learning-notes');
    setSelectedProject(null); // Reset project selection when changing base folder
    alert('Mock: Selected base folder "/home/user/learning-notes"');
  };

  const renderFileTree = (items: FileItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.id} style={{ marginLeft: `${level * 16}px` }}>
        <div
          className="flex items-center py-1 px-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer rounded"
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.id);
            } else {
              // Handle file selection
              console.log('Selected file:', item.name);
            }
          }}
        >
          {item.type === 'folder' ? (
            <span className="mr-2">
              {expandedFolders.has(item.id) ? '📂' : '📁'}
            </span>
          ) : (
            <span className="mr-2">📄</span>
          )}
          <span className="text-sm truncate">{item.name}</span>
        </div>
        {item.type === 'folder' && expandedFolders.has(item.id) && item.children && (
          <div>{renderFileTree(item.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  if (collapsed) {
    return (
      <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 p-2">
        <button
          onClick={onToggle}
          className="w-full h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Expand sidebar"
        >
          <span className="text-lg">📁</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Explorer</h2>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Collapse sidebar"
        >
          <span className="text-sm">◀</span>
        </button>
      </div>

      {/* Base Folder Selection */}
      <div className="p-3 border-b border-gray-300 dark:border-gray-700">
        <button
          onClick={selectBaseFolder}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Select Base Folder
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-2">
        {!selectedFolder ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8 p-4">
            <div className="mb-4">📁</div>
            <div>Select a base folder to see your projects</div>
          </div>
        ) : !selectedProject ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 px-2">
              Select a Project
            </div>
            {projects.map((project) => (
              <div
                key={project.id}
                className="mx-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => setSelectedProject(project.id)}
              >
                <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="mr-2">📂</span>
                  {project.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {project.files.length} files
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back to project selection */}
            <div className="px-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <span className="mr-1">←</span>
                Back to Projects
              </button>
            </div>

            {/* Current project files */}
            {projects
              .filter((project) => project.id === selectedProject)
              .map((project) => (
                <div key={project.id}>
                  <div className="font-medium text-gray-800 dark:text-gray-200 mb-2 px-2 flex items-center">
                    <span className="mr-2">📂</span>
                    {project.name}
                  </div>
                  <div className="ml-2">
                    {renderFileTree(project.files)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {selectedFolder && (
        <div className="p-3 border-t border-gray-300 dark:border-gray-700">
          <button className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
            New Project
          </button>
        </div>
      )}
    </div>
  );
}