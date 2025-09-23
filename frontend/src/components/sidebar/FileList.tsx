"use client";

import { Project } from "../../types";
import IconButton from "../ui/IconButton";

interface FileListProps {
  project: Project;
  activeFileName: string | null;
  onFileSelect: (fileName: string) => void;
  onFileRename: (fileName: string) => void;
  onFileDelete: (fileName: string) => void;
}

export default function FileList({
  project,
  activeFileName,
  onFileSelect,
  onFileRename,
  onFileDelete,
}: FileListProps) {
  return (
    <div className="ml-4 space-y-1">
      {project.file_names.map((fileName) => {
        const isActive = activeFileName === fileName;

        return (
          <div
            key={fileName}
            className={`p-2 rounded cursor-pointer group flex items-center justify-between transition-colors ${
              isActive
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
            onClick={() => onFileSelect(fileName)}
          >
            <div className="flex items-center flex-1 min-w-0">
              <span className="mr-2">📄</span>
              <span className="text-sm truncate">{fileName}.md</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRename(fileName);
                }}
                title="Rename file"
              >
                ✏️
              </IconButton>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onFileDelete(fileName);
                }}
                variant="danger"
                title="Delete file"
              >
                🗑️
              </IconButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
