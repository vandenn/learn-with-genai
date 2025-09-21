'use client';

import { useState, useEffect } from 'react';

interface ActiveFile {
  name: string;
  path: string;
  content: string;
  projectId: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onFileLoad: (fileData: ActiveFile) => void;
}

interface Project {
  id: string;
  name: string;
  path: string;
  file_names: string[];
  created: string;
  modified: string;
}

interface Config {
  active_project_id: string | null;
  active_file_path: string | null;
  user_settings: Record<string, any>;
  created: string;
  modified: string;
}

const API_BASE = 'http://localhost:8000/api/v1';

export default function Sidebar({ collapsed, onToggle, onFileLoad }: SidebarProps) {
  const [config, setConfig] = useState<Config | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);


  const initializeApp = async () => {
    if (initialized) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([loadConfig(), loadProjects()]);
      setInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
      console.error('Error loading configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    initializeApp();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/config`);
      if (response.ok) {
        const configData = await response.json();
        setConfig(configData);

        console.log(configData);

        // Set selected project to active project if available and load its contents
        if (configData.active_project_id) {
          setSelectedProject(configData.active_project_id);
          // Load the project contents to show files
          await loadProjectContents(configData.active_project_id);
        }

        // Set active file from config
        if (configData.active_file_path) {
          setActiveFile(configData.active_file_path);
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects`);
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const loadProjectContents = async (projectId: string) => {
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}`);
      if (response.ok) {
        const project = await response.json();
        // Update the project in the projects state
        setProjects(prev =>
          prev.map(p => p.id === projectId ? project : p)
        );

        // Check for active file from dedicated endpoint before auto-selecting
        let currentActiveFile = activeFile;
        try {
          const activeFileResponse = await fetch(`${API_BASE}/config/active-file`);
          if (activeFileResponse.ok) {
            const activeFileData = await activeFileResponse.json();
            if (activeFileData.file_path) {
              currentActiveFile = activeFileData.file_path;
              setActiveFile(activeFileData.file_path);

              // Load the active file content into the editor
              const filePathParts = activeFileData.file_path.split('/');
              const fileName = filePathParts[filePathParts.length - 1].replace('.md', '');
              await handleFileSelect(projectId, fileName);
            }
          }
        } catch (err) {
          console.warn('Could not fetch active file:', err);
        }

        // Auto-select first file if project has files and no active file is set
        if (project.file_names && project.file_names.length > 0) {
          const firstFileName = project.file_names[0];

          // Only auto-select if there's no current active file or it's not in this project
          if (!currentActiveFile || !currentActiveFile.startsWith(project.path + '/')) {
            await handleFileSelect(projectId, firstFileName);
          }
        }
      }
    } catch (err) {
      console.error('Error loading project contents:', err);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProject(projectId);

    // Set as active project in backend
    try {
      await fetch(`${API_BASE}/config/active-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      // Update config state to reflect the new active project
      setConfig(prev => prev ? { ...prev, active_project_id: projectId } : prev);
    } catch (err) {
      console.error('Error setting active project:', err);
    }

    // Load project contents
    await loadProjectContents(projectId);
  };

  const handleFileSelect = async (projectId: string, fileName: string) => {
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/files/${fileName}`);

      if (response.ok) {
        const fileContent = await response.json();

        // Update local active file state
        setActiveFile(fileContent.path);

        // Update backend config with active file
        setConfig(prev => prev ? { ...prev, active_file_path: fileContent.path } : prev);

        // Persist active file to backend
        try {
          const configResponse = await fetch(`${API_BASE}/config/active-file`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file_path: fileContent.path }),
          });
          if (!configResponse.ok) {
            console.warn('Failed to update active file in backend');
          }
        } catch (configErr) {
          console.warn('Error updating active file in backend:', configErr);
        }

        // Pass file data to the parent component
        onFileLoad({
          name: fileContent.name,
          path: fileContent.path,
          content: fileContent.content,
          projectId: projectId
        });
      }
    } catch (err) {
      console.error('Error opening file:', err);
    }
  };

  const createNewProject = async () => {
    const projectName = prompt('Enter project name:');
    if (!projectName) return;

    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [...prev, newProject]);

        // Set the new project as active and update config
        await handleProjectSelect(newProject.id);
      } else {
        const errorText = await response.text();
        alert(`Failed to create project: ${errorText}`);
      }
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Failed to create project');
    }
  };

  const createNewFile = async () => {
    if (!selectedProject) return;

    const fileName = prompt('Enter file name (without .md extension):');
    if (!fileName) return;

    try {
      const response = await fetch(`${API_BASE}/projects/${selectedProject}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: fileName }),
      });

      if (response.ok) {
        // Reload project contents to show the new file
        await loadProjectContents(selectedProject);

        // Auto-select the new file
        await handleFileSelect(selectedProject, fileName);
      } else {
        const errorText = await response.text();
        alert(`Failed to create file: ${errorText}`);
      }
    } catch (err) {
      console.error('Error creating file:', err);
      alert('Failed to create file');
    }
  };

  const renderFileList = (fileNames: string[], projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];

    return fileNames.map((fileName) => {
      const filePath = `${project.path}/${fileName}.md`;
      const isActive = activeFile === filePath;

      return (
        <div key={fileName}>
          <div
            className={`flex items-center py-1 px-2 cursor-pointer rounded ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleFileSelect(projectId, fileName)}
          >
            <span className="mr-2">📄</span>
            <span className="text-sm truncate">{fileName}.md</span>
          </div>
        </div>
      );
    });
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

      {/* Error Display */}
      {error && (
        <div className="p-3 border-b border-gray-300 dark:border-gray-700">
          <div className="text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-2">
        {!initialized ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8 p-4">
            <div className="mb-4">📁</div>
            <div>{loading ? 'Initializing...' : 'Loading projects...'}</div>
          </div>
        ) : !selectedProject ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 px-2">
              Select a Project
              {config?.active_project_id && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Active: {projects.find(p => p.id === config?.active_project_id)?.name}
                </div>
              )}
            </div>
            {projects.map((project) => (
              <div
                key={project.id}
                className={`mx-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  config?.active_project_id === project.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleProjectSelect(project.id)}
              >
                <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="mr-2">📂</span>
                  {project.name}
                  {config?.active_project_id === project.id && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {project.file_names.length} files
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
                    {config?.active_project_id === project.id && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="ml-2">
                    {renderFileList(project.file_names, project.id)}
                  </div>
                  <div className="ml-2 mt-2">
                    <button
                      onClick={createNewFile}
                      className="w-full px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      + New File
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {initialized && (
        <div className="p-3 border-t border-gray-300 dark:border-gray-700">
          <button
            onClick={createNewProject}
            className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            New Project
          </button>
        </div>
      )}
    </div>
  );
}