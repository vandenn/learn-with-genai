"use client";

import { useState, useEffect } from "react";
import MessageList from "./ai/MessageList";
import MessageInput from "./ai/MessageInput";
import ThinkingIndicator from "./ai/ThinkingIndicator";
import { Message, File } from "../types";
import { TextEditorRef } from "./TextEditor";

interface AIAssistantProps {
  activeProjectId?: string | null;
  activeFileName: string | null;
  selectedText: string;
  textEditorRef: React.RefObject<TextEditorRef | null>;
}

export default function AIAssistant({
  activeProjectId,
  activeFileName,
  selectedText,
  textEditorRef,
}: AIAssistantProps) {
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const fetchFileData = async () => {
      if (!activeProjectId || !activeFileName) {
        setActiveFile(null);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/projects/${activeProjectId}/files/${activeFileName}`,
        );
        if (response.ok) {
          const fileData = await response.json();
          setActiveFile(fileData);
        } else {
          console.error("Failed to fetch file data:", response.statusText);
          setActiveFile(null);
        }
      } catch (err) {
        console.error("Error fetching file data:", err);
        setActiveFile(null);
      }
    };

    fetchFileData();
  }, [activeProjectId, activeFileName]);

  const appendToFile = (content: string) => {
    if (!textEditorRef.current) return;

    textEditorRef.current.appendContent(content);
  };

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim() || !activeProjectId) return;

    // Build context-enhanced message
    let enhancedMessage = inputText;

    // Add previous conversation context
    if (messages.length >= 2) {
      // Find the last user message and all assistant responses after it
      const lastUserMessageIndex = messages.findLastIndex(
        (msg) => msg.type === "user",
      );
      if (
        lastUserMessageIndex >= 0 &&
        lastUserMessageIndex < messages.length - 1
      ) {
        const lastUserMessage = messages[lastUserMessageIndex];
        const assistantResponses = messages
          .slice(lastUserMessageIndex + 1)
          .filter((msg) => msg.type === "assistant");

        if (assistantResponses.length > 0) {
          enhancedMessage += `\n\n--- PREVIOUS CONVERSATION ---\nUser: ${lastUserMessage.content}\n`;
          assistantResponses.forEach((response) => {
            enhancedMessage += `Assistant: ${response.content}\n`;
          });
        }
      }
    }

    if (activeFile) {
      enhancedMessage += `\n\n--- ACTIVE FILE CONTENT ---\nFile: ${activeFile.name}\nContent:\n${activeFile.content}`;

      if (selectedText.trim()) {
        enhancedMessage += `\n\n--- HIGHLIGHTED TEXT ---\n${selectedText}`;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputText, // Show only the user's original input in the UI
      timestamp: new Date(),
    };

    const currentInput = enhancedMessage; // Send the context-enhanced message to backend
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/ai-tutor/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: currentInput,
            project_id: activeProjectId,
          }),
        },
      );

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Accumulate chunks in buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete messages
          while (buffer.includes("\n\n")) {
            const messageEndIndex = buffer.indexOf("\n\n");
            const messageChunk = buffer.slice(0, messageEndIndex);
            buffer = buffer.slice(messageEndIndex + 2);

            // Process each line in the message chunk
            const lines = messageChunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === "note") {
                    // Handle note content by appending to active file
                    appendToFile(data.content);
                  } else {
                    // Handle regular messages (step, final)
                    const aiMessage: Message = {
                      id: `${Date.now()}-${Math.random()}`,
                      type: "assistant",
                      content: data.content,
                      timestamp: new Date(),
                    };

                    setMessages((prev) => [...prev, aiMessage]);

                    // If this is the final message, stop thinking
                    if (data.type === "final") {
                      setIsThinking(false);
                    }

                    // Add a small delay to show messages one by one
                    await new Promise((resolve) => setTimeout(resolve, 100));
                  }
                } catch (parseError) {
                  console.error("Error parsing stream data:", parseError);
                }
              }
            }
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Error sending message to AI tutor:", error);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "I'm experiencing technical difficulties. Please try again later!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsThinking(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700">
      {/* Header */}
      <div className="p-3 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <span className="mr-2">🤖</span>
          AI Tutor
        </h2>
      </div>

      <MessageList messages={messages} isThinking={isThinking} />

      <div className="border-t border-gray-300 dark:border-gray-700">
        <ThinkingIndicator isVisible={isThinking} />
        <MessageInput
          activeProjectId={activeProjectId}
          activeFileName={activeFileName}
          selectedText={selectedText}
          isThinking={isThinking}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
