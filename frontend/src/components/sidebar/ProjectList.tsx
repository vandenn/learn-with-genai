"use client";

import { Project } from "../../types";
import IconButton from "../ui/IconButton";

interface ProjectListProps {
  projects: Project[];
  activeProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
  onProjectRename: (projectId: string) => void;
  onProjectDelete: (projectId: string) => void;
}

export default function ProjectList({
  projects,
  activeProjectId,
  onProjectSelect,
  onProjectRename,
  onProjectDelete,
}: ProjectListProps) {
  return (
    <div className="space-y-1">
      {projects.map((project) => (
        <div
          key={project.id}
          className={`border rounded-lg p-3 cursor-pointer group transition-colors ${
            activeProjectId === project.id
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          onClick={() => onProjectSelect(project.id)}
        >
          <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center justify-between overflow-hidden h-6">
            <div className="flex items-center flex-1 min-w-0">
              <span className="mr-2 flex-shrink-0">📂</span>
              <span className="font-medium truncate" title={project.name}>
                {project.name}
              </span>
            </div>
            <div className="hidden group-hover:flex items-center space-x-1 ml-2 flex-shrink-0 h-6">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectRename(project.id);
                }}
                title="Rename project"
              >
                ✏️
              </IconButton>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectDelete(project.id);
                }}
                variant="danger"
                title="Delete project"
              >
                🗑️
              </IconButton>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
