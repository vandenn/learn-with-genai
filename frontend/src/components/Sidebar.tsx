"use client";

import { useState, useEffect } from "react";
import { ConfirmModal, TextInputModal } from "./Modals";
import ProjectList from "./sidebar/ProjectList";
import FileList from "./sidebar/FileList";
import Button from "./ui/Button";
import LoadingSpinner from "./ui/LoadingSpinner";
import { Project } from "../types";
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "../utils/api";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeProjectId: string | null;
  activeFileName: string | null;
  onProjectSelect: (projectId: string | null) => void;
  onFileSelect: (fileName: string | null) => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
  activeProjectId,
  activeFileName,
  onProjectSelect,
  onFileSelect,
}: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmType?: "danger" | "default";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [textInputModal, setTextInputModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    placeholder: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    placeholder: "",
    defaultValue: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!initialized) {
      loadProjects();
      setInitialized(true);
    }
  }, [initialized]);

  const loadProjects = async () => {
    try {
      const projectsData = await apiGet<Project[]>("/projects");
      setProjects(projectsData);
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  };

  const loadProjectContents = async (projectId: string) => {
    try {
      const project = await apiGet<Project>(`/projects/${projectId}`);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? project : p)),
      );

      if (activeFileName && project.file_names.includes(activeFileName)) {
        onFileSelect(activeFileName);
      } else if (project.file_names.length > 0) {
        const firstFile = project.file_names[0];
        await setActiveFileAndLoad(projectId, firstFile);
      } else {
        onFileSelect(null);
      }
    } catch (err) {
      console.error("Error loading project contents:", err);
    }
  };

  const setActiveFileAndLoad = async (projectId: string, fileName: string) => {
    try {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      await apiPost("/config/active-file", { file_name: fileName });
      onFileSelect(fileName);
    } catch (err) {
      console.error("Error setting active file:", err);
    }
  };

  const handleProjectSelect = async (projectId: string | null) => {
    setLoading(true);
    setError(null);

    try {
      await apiPost("/config/active-project", { project_id: projectId });
      onProjectSelect(projectId);
      onFileSelect(null); // Allow subsequent code to load the first file, but impt to clear prev active file first
      if (projectId) {
        await loadProjectContents(projectId);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (fileName: string) => {
    if (!activeProjectId) return;
    await setActiveFileAndLoad(activeProjectId, fileName);
  };

  const createProject = () => {
    setTextInputModal({
      isOpen: true,
      title: "Create New Project",
      message: "Enter a name for the new project:",
      placeholder: "Project name",
      defaultValue: "",
      onConfirm: async (name: string) => {
        try {
          const newProject = await apiPost<Project>("/projects", { name });
          await loadProjects();
          await handleProjectSelect(newProject.id);
          setTextInputModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error("Error creating project:", err);
        }
      },
    });
  };

  const renameProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    setTextInputModal({
      isOpen: true,
      title: "Rename Project",
      message: "Enter a new name for the project:",
      placeholder: "Project name",
      defaultValue: project.name,
      onConfirm: async (newName: string) => {
        try {
          await apiPut(`/projects/${projectId}`, { new_name: newName });
          await loadProjects();
          setTextInputModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error("Error renaming project:", err);
        }
      },
    });
  };

  const renameFile = (fileName: string) => {
    if (!activeProjectId) return;

    setTextInputModal({
      isOpen: true,
      title: "Rename File",
      message: "Enter a new name for the file:",
      placeholder: "File name",
      defaultValue: fileName,
      onConfirm: async (newName: string) => {
        try {
          await apiPut(`/projects/${activeProjectId}/files/${fileName}`, {
            new_name: newName,
          });

          if (activeFileName === fileName) {
            await setActiveFileAndLoad(activeProjectId, newName);
          }

          await loadProjectContents(activeProjectId);
          setTextInputModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error("Error renaming file:", err);
        }
      },
    });
  };

  const deleteProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete Project",
      message: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      confirmType: "danger",
      onConfirm: async () => {
        try {
          await apiDelete(`/projects/${projectId}`);

          if (activeProjectId === projectId) {
            onProjectSelect(null);
            onFileSelect(null);
            await apiPost("/config/active-project", { project_id: null });
            await apiPost("/config/active-file", { file_name: null });
          }

          await loadProjects();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error("Error deleting project:", err);
        }
      },
    });
  };

  const deleteFile = (fileName: string) => {
    if (!activeProjectId) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete File",
      message: `Are you sure you want to delete "${fileName}.md"? This action cannot be undone.`,
      confirmType: "danger",
      onConfirm: async () => {
        try {
          await apiDelete(`/projects/${activeProjectId}/files/${fileName}`);

          if (activeFileName === fileName) {
            const project = projects.find((p) => p.id === activeProjectId);
            const remainingFiles =
              project?.file_names.filter((f) => f !== fileName) || [];

            if (remainingFiles.length > 0) {
              await setActiveFileAndLoad(activeProjectId, remainingFiles[0]);
            } else {
              onFileSelect(null);
              await apiPost("/config/active-file", { file_name: null });
            }
          }

          await loadProjectContents(activeProjectId);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      },
    });
  };

  if (collapsed) {
    return (
      <div className="h-full bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          📁
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <span className="mr-2">📁</span>
            Projects
          </h2>
          <button
            onClick={onToggle}
            className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            ←
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              Loading...
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="p-4 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              No projects yet
            </p>
            <Button onClick={createProject} size="sm">
              Create First Project
            </Button>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="p-4 space-y-4">
            {!activeProjectId ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    All Projects ({projects.length})
                  </span>
                  <Button onClick={createProject} size="sm">
                    New Project
                  </Button>
                </div>

                <ProjectList
                  projects={projects}
                  activeProjectId={activeProjectId}
                  onProjectSelect={handleProjectSelect}
                  onProjectRename={renameProject}
                  onProjectDelete={deleteProject}
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleProjectSelect(null)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    <span className="mr-1">←</span>
                    Back to Projects
                  </button>
                </div>

                {projects
                  .filter((project) => project.id === activeProjectId)
                  .map((project) => (
                    <div key={project.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                          <span className="mr-2">📂</span>
                          {project.name}
                        </h3>
                        <Button
                          onClick={() => {
                            setTextInputModal({
                              isOpen: true,
                              title: "Create New File",
                              message: "Enter a name for the new file:",
                              placeholder: "File name",
                              defaultValue: "",
                              onConfirm: async (file_name: string) => {
                                try {
                                  await apiPost(
                                    `/projects/${activeProjectId}/files`,
                                    { file_name },
                                  );
                                  await loadProjectContents(activeProjectId);
                                  setTextInputModal((prev) => ({
                                    ...prev,
                                    isOpen: false,
                                  }));
                                } catch (err) {
                                  console.error("Error creating file:", err);
                                }
                              },
                            });
                          }}
                          size="sm"
                        >
                          +
                        </Button>
                      </div>

                      <FileList
                        project={project}
                        activeFileName={activeFileName}
                        onFileSelect={handleFileSelect}
                        onFileRename={renameFile}
                        onFileDelete={deleteFile}
                      />
                    </div>
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        type={confirmModal.confirmType}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <TextInputModal
        isOpen={textInputModal.isOpen}
        title={textInputModal.title}
        message={textInputModal.message}
        placeholder={textInputModal.placeholder}
        defaultValue={textInputModal.defaultValue}
        onConfirm={textInputModal.onConfirm}
        onCancel={() =>
          setTextInputModal((prev) => ({ ...prev, isOpen: false }))
        }
        confirmText="Create"
        cancelText="Cancel"
      />
    </div>
  );
}
