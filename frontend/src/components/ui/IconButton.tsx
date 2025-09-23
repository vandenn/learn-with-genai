"use client";

import { ReactNode } from "react";

interface IconButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  variant?: "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
  title?: string;
}

export default function IconButton({
  children,
  onClick,
  disabled = false,
  variant = "ghost",
  size = "sm",
  className = "",
  title,
}: IconButtonProps) {
  const baseClasses =
    "rounded-full flex items-center justify-center transition-colors disabled:cursor-not-allowed";

  const variantClasses = {
    ghost:
      "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50",
    danger:
      "text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 disabled:opacity-50",
  };

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classes}
      title={title}
    >
      {children}
    </button>
  );
}
