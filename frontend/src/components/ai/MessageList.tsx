"use client";

import { useRef, useEffect } from "react";
import { Message } from "../../types";

interface MessageListProps {
  messages: Message[];
  isThinking: boolean;
}

export default function MessageList({
  messages,
  isThinking,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-lg p-3 ${
              message.type === "user"
                ? "bg-blue-600 text-white"
                : message.type === "consent"
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            }`}
          >
            {message.type === "consent" && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                <span className="text-sm font-medium">Approval Required</span>
              </div>
            )}
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            <div
              className={`text-xs mt-1 ${
                message.type === "user"
                  ? "text-blue-100"
                  : message.type === "consent"
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
