'use client';

import { useState, useEffect } from 'react';
import { ConfirmModal, PromptModal } from './Modals';

interface ActiveFile {
  name: string;
  path: string;
  content: string;
  projectId: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onFileLoad: (fileData: ActiveFile | null) => void;
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
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'file' | 'project';
    itemId: string;
    projectId?: string;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'default';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    onConfirm: () => {},
  });

  // Modal helper functions
  const showConfirmModal = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'default' = 'default') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const showPromptModal = (title: string, message: string, defaultValue: string, onConfirm: (value: string) => void) => {
    setPromptModal({
      isOpen: true,
      title,
      message,
      defaultValue,
      onConfirm,
    });
  };

  const closePromptModal = () => {
    setPromptModal(prev => ({ ...prev, isOpen: false }));
  };

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

  const createNewProject = () => {
    showPromptModal(
      'Create New Project',
      'Enter a name for your new project:',
      '',
      async (projectName: string) => {
        closePromptModal();

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
      }
    );
  };

  const createNewFile = () => {
    if (!selectedProject) return;

    showPromptModal(
      'Create New File',
      'Enter a name for your new file (without .md extension):',
      '',
      async (fileName: string) => {
        closePromptModal();

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
      }
    );
  };

  const deleteFile = (projectId: string, fileName: string) => {
    showConfirmModal(
      'Delete File',
      `Are you sure you want to delete "${fileName}.md"? This action cannot be undone.`,
      async () => {
        closeConfirmModal();

        try {
          const response = await fetch(`${API_BASE}/projects/${projectId}/files/${fileName}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            const project = projects.find(p => p.id === projectId);
            const wasActiveFile = project && activeFile === `${project.path}/${fileName}.md`;

            // Get updated project data from the server
            const projectResponse = await fetch(`${API_BASE}/projects/${projectId}`);
            if (projectResponse.ok) {
              const updatedProject = await projectResponse.json();

              // Update the project in the projects state
              setProjects(prev =>
                prev.map(p => p.id === projectId ? updatedProject : p)
              );

              // If the deleted file was active, switch to the first available file
              if (wasActiveFile) {
                if (updatedProject.file_names && updatedProject.file_names.length > 0) {
                  // Switch to the first file in the project
                  await handleFileSelect(projectId, updatedProject.file_names[0]);
                } else {
                  // No files left in project, clear the editor
                  setActiveFile(null);
                  onFileLoad(null);

                  // Update backend config to clear active file
                  try {
                    await fetch(`${API_BASE}/config/active-file`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ file_path: null }),
                    });

                    // Update local config state
                    setConfig(prev => prev ? { ...prev, active_file_path: null } : prev);
                  } catch (err) {
                    console.warn('Failed to clear active file in backend config:', err);
                  }
                }
              }
            }
          } else {
            const errorText = await response.text();
            alert(`Failed to delete file: ${errorText}`);
          }
        } catch (err) {
          console.error('Error deleting file:', err);
          alert('Failed to delete file');
        }
      },
      'danger'
    );
  };

  const renameFile = (projectId: string, oldFileName: string) => {
    showPromptModal(
      'Rename File',
      'Enter new file name (without .md extension):',
      oldFileName,
      async (newFileName: string) => {
        if (newFileName === oldFileName) {
          closePromptModal();
          return;
        }

        closePromptModal();

        try {
          const response = await fetch(`${API_BASE}/projects/${projectId}/files/${oldFileName}/rename`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ new_name: newFileName }),
          });

          if (response.ok) {
            const renamedFile = await response.json();

            // Update active file path if it was the renamed file
            const project = projects.find(p => p.id === projectId);
            if (project) {
              const oldFilePath = `${project.path}/${oldFileName}.md`;
              if (activeFile === oldFilePath) {
                setActiveFile(renamedFile.path);
                // Load the renamed file content
                await handleFileSelect(projectId, newFileName);
              }
            }

            // Reload project contents
            await loadProjectContents(projectId);
          } else {
            const errorText = await response.text();
            alert(`Failed to rename file: ${errorText}`);
          }
        } catch (err) {
          console.error('Error renaming file:', err);
          alert('Failed to rename file');
        }
      }
    );
  };

  const deleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    showConfirmModal(
      'Delete Project',
      `Are you sure you want to delete the entire project "${project.name}" and all its files? This action cannot be undone.`,
      async () => {
        closeConfirmModal();

        try {
          const response = await fetch(`${API_BASE}/projects/${projectId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            // Clear active states if this was the active project
            if (selectedProject === projectId) {
              setSelectedProject(null);
              setActiveFile(null);
              onFileLoad(null);

              // Update backend config to clear active file and project
              try {
                await Promise.all([
                  fetch(`${API_BASE}/config/active-file`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ file_path: null }),
                  }),
                  fetch(`${API_BASE}/config/active-project`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ project_id: null }),
                  })
                ]);

                // Update local config state
                setConfig(prev => prev ? { ...prev, active_project_id: null, active_file_path: null } : prev);
              } catch (err) {
                console.warn('Failed to clear active states in backend config:', err);
              }
            }

            // Remove from projects list
            setProjects(prev => prev.filter(p => p.id !== projectId));

            // Update config if this was the active project
            if (config?.active_project_id === projectId) {
              setConfig(prev => prev ? { ...prev, active_project_id: null, active_file_path: null } : prev);
            }
          } else {
            const errorText = await response.text();
            alert(`Failed to delete project: ${errorText}`);
          }
        } catch (err) {
          console.error('Error deleting project:', err);
          alert('Failed to delete project');
        }
      },
      'danger'
    );
  };

  const renameProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    showPromptModal(
      'Rename Project',
      'Enter new project name:',
      project.name,
      async (newName: string) => {
        if (newName === project.name) {
          closePromptModal();
          return;
        }

        closePromptModal();

        try {
          const response = await fetch(`${API_BASE}/projects/${projectId}/rename`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ new_name: newName }),
          });

          if (response.ok) {
            const renamedProject = await response.json();

            // Update projects list
            setProjects(prev => prev.map(p => p.id === projectId ? renamedProject : p));

            // Update selected project if it was the renamed one
            if (selectedProject === projectId) {
              setSelectedProject(renamedProject.id);
            }

            // Update config if this was the active project
            if (config?.active_project_id === projectId) {
              setConfig(prev => prev ? { ...prev, active_project_id: renamedProject.id } : prev);
            }
          } else {
            const errorText = await response.text();
            alert(`Failed to rename project: ${errorText}`);
          }
        } catch (err) {
          console.error('Error renaming project:', err);
          alert('Failed to rename project');
        }
      }
    );
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'file' | 'project', itemId: string, projectId?: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      itemId,
      projectId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const renderFileList = (fileNames: string[], projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];

    return fileNames.map((fileName) => {
      const filePath = `${project.path}/${fileName}.md`;
      const isActive = activeFile === filePath;

      return (
        <div key={fileName}>
          <div
            className={`flex items-center justify-between py-1 px-2 cursor-pointer rounded group ${
              isActive
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleFileSelect(projectId, fileName)}
            onContextMenu={(e) => handleContextMenu(e, 'file', fileName, projectId)}
          >
            <div className="flex items-center flex-1 min-w-0">
              <span className="mr-2">📄</span>
              <span className="text-sm truncate">{fileName}.md</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  renameFile(projectId, fileName);
                }}
                className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Rename file"
              >
                <span className="text-xs">✏️</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFile(projectId, fileName);
                }}
                className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-800"
                title="Delete file"
              >
                <span className="text-xs">🗑️</span>
              </button>
            </div>
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
                className={`mx-2 p-3 border rounded-lg cursor-pointer transition-colors group ${
                  config?.active_project_id === project.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleProjectSelect(project.id)}
                onContextMenu={(e) => handleContextMenu(e, 'project', project.id)}
              >
                <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center justify-between overflow-hidden h-6">
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="mr-2 flex-shrink-0">📂</span>
                    <span className="font-medium truncate" title={project.name}>{project.name}</span>
                  </div>
                  <div className="hidden group-hover:flex items-center space-x-1 ml-2 flex-shrink-0 h-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        renameProject(project.id);
                      }}
                      className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      title="Rename project"
                    >
                      <span className="text-xs">✏️</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-800"
                      title="Delete project"
                    >
                      <span className="text-xs">🗑️</span>
                    </button>
                  </div>
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
                  <div
                    className="font-medium text-gray-800 dark:text-gray-200 mb-2 px-2 flex items-center justify-between group overflow-hidden h-6"
                    onContextMenu={(e) => handleContextMenu(e, 'project', project.id)}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <span className="mr-2 flex-shrink-0">📂</span>
                      <span className="font-medium truncate" title={project.name}>{project.name}</span>
                    </div>
                    <div className="hidden group-hover:flex items-center space-x-1 ml-2 flex-shrink-0 h-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          renameProject(project.id);
                        }}
                        className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        title="Rename project"
                      >
                        <span className="text-xs">✏️</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-800"
                        title="Delete project"
                      >
                        <span className="text-xs">🗑️</span>
                      </button>
                    </div>
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

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg py-1 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {contextMenu.type === 'file' ? (
            <>
              <button
                onClick={() => {
                  renameFile(contextMenu.projectId!, contextMenu.itemId);
                  closeContextMenu();
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <span className="mr-2">✏️</span>
                Rename
              </button>
              <button
                onClick={() => {
                  deleteFile(contextMenu.projectId!, contextMenu.itemId);
                  closeContextMenu();
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-400 flex items-center"
              >
                <span className="mr-2">🗑️</span>
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  renameProject(contextMenu.itemId);
                  closeContextMenu();
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <span className="mr-2">✏️</span>
                Rename Project
              </button>
              <button
                onClick={() => {
                  deleteProject(contextMenu.itemId);
                  closeContextMenu();
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-400 flex items-center"
              >
                <span className="mr-2">🗑️</span>
                Delete Project
              </button>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        confirmText={confirmModal.type === 'danger' ? 'Delete' : 'Confirm'}
        type={confirmModal.type}
      />

      <PromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        message={promptModal.message}
        defaultValue={promptModal.defaultValue}
        onConfirm={promptModal.onConfirm}
        onCancel={closePromptModal}
      />
    </div>
  );
}