"use client";

import { useState } from "react";
import Button from "../ui/Button";
import ContextStatus from "./ContextStatus";

interface MessageInputProps {
  activeProjectId?: string | null;
  activeFileName: string | null;
  selectedText: string;
  isThinking: boolean;
  onSendMessage: (message: string) => void;
}

export default function MessageInput({
  activeProjectId,
  activeFileName,
  selectedText,
  isThinking,
  onSendMessage,
}: MessageInputProps) {
  const [inputText, setInputText] = useState("");
  const shouldPreventUserInput = isThinking || !activeProjectId;

  const handleSubmit = () => {
    if (!inputText.trim() || shouldPreventUserInput) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // shift key check to support newlines
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-3 pt-1 pb-3">
      <ContextStatus
        activeFileName={activeFileName}
        selectedText={selectedText}
      />
      <div className="flex space-x-2">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyUp={handleKeyUp}
          placeholder={
            activeProjectId
              ? "What do you want to learn about?"
              : "Select a project to start chatting"
          }
          disabled={shouldPreventUserInput}
          className={`flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 ${
            shouldPreventUserInput ? "opacity-50 cursor-not-allowed" : ""
          }`}
          rows={2}
        />
        <Button
          onClick={handleSubmit}
          disabled={!inputText.trim() || shouldPreventUserInput}
          size="md"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
