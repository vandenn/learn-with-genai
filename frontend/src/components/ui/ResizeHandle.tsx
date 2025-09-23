"use client";

import React, { useState, useCallback, useEffect } from "react";

interface ResizeHandleProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onWidthPercentChange: (widthPercent: number) => void;
  minWidthPercent?: number;
  maxWidthPercent?: number;
}

export default function ResizeHandle({
  containerRef,
  onWidthPercentChange,
  minWidthPercent = 20,
  maxWidthPercent = 60,
}: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      // Calculate percentage from the right edge
      const newWidthPercent =
        ((containerWidth - mouseX) / containerWidth) * 100;

      // Constrain between min and max
      const constrainedWidthPercent = Math.min(
        Math.max(newWidthPercent, minWidthPercent),
        maxWidthPercent,
      );
      onWidthPercentChange(constrainedWidthPercent);
    },
    [
      isResizing,
      containerRef,
      onWidthPercentChange,
      minWidthPercent,
      maxWidthPercent,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  // Add event listeners for mouse events
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-col-resize transition-colors relative ${
        isResizing ? "bg-blue-500" : ""
      }`}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator for resize handle */}
      <div className="absolute inset-y-0 left-0 w-1 flex items-center justify-center">
        <div className="w-0.5 h-8 bg-gray-400 dark:bg-gray-600 rounded-full opacity-50"></div>
      </div>
    </div>
  );
}
