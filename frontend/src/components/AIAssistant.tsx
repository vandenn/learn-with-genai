"use client";

import { useState, useEffect } from "react";
import MessageList from "./ai/MessageList";
import MessageInput from "./ai/MessageInput";
import ThinkingIndicator from "./ai/ThinkingIndicator";
import ConsentPrompt from "./ai/ConsentPrompt";
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<{
    message: string;
    thread_id: string;
  } | null>(null);
  const [isProcessingConsent, setIsProcessingConsent] = useState(false);

  const appendToFile = (content: string) => {
    if (!textEditorRef.current) return;

    textEditorRef.current.appendContent(content);
  };

  const handleConsentResponse = async (decision: "approve" | "reject") => {
    if (!pendingConsent || !activeProjectId) return;

    setIsProcessingConsent(true);
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
            message: "", // Empty message for consent response
            project_id: activeProjectId,
            thread_id: pendingConsent.thread_id,
            conversation_history: [],
            highlighted_text: null,
            hitl_input: { content: decision },
          }),
        },
      );

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Clear pending consent state
        setPendingConsent(null);
        setIsProcessingConsent(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          while (buffer.includes("\n\n")) {
            const messageEndIndex = buffer.indexOf("\n\n");
            const messageChunk = buffer.slice(0, messageEndIndex);
            buffer = buffer.slice(messageEndIndex + 2);

            const lines = messageChunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === "note") {
                    appendToFile(data.content);
                  } else if (data.type === "consent") {
                    // Handle consent request - add to message list and set pending state
                    const consentMessage: Message = {
                      id: `${Date.now()}-${Math.random()}`,
                      type: "consent",
                      content: data.content,
                      timestamp: new Date(),
                      thread_id: data.thread_id,
                    };

                    setMessages((prev) => [...prev, consentMessage]);
                    setPendingConsent({
                      message: data.content,
                      thread_id: data.thread_id,
                    });
                    setIsThinking(false);
                  } else {
                    const aiMessage: Message = {
                      id: `${Date.now()}-${Math.random()}`,
                      type: "assistant",
                      content: data.content,
                      timestamp: new Date(),
                      thread_id: data.thread_id,
                    };

                    setMessages((prev) => [...prev, aiMessage]);

                    if (data.type === "final") {
                      setIsThinking(false);
                    }

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
      console.error("Error sending consent response:", error);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "I'm experiencing technical difficulties. Please try again later!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setPendingConsent(null);
      setIsProcessingConsent(false);
      setIsThinking(false);
    }
  };

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim() || !activeProjectId) return;

    // Build conversation history from last 5 user-assistant interaction pairs
    const conversationHistory = [];
    const reversedMessages = [...messages].reverse();
    let userInteractionCount = 0;

    for (const message of reversedMessages) {
      if (message.type === "user") {
        userInteractionCount++;
        if (userInteractionCount > 5) break;
      }

      conversationHistory.unshift({
        role: message.type === "user" ? "user" : "assistant",
        content: {
          type: "output_text",
          text: message.content,
        },
      });
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputText,
      timestamp: new Date(),
    };

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
            message: inputText,
            project_id: activeProjectId,
            conversation_history: conversationHistory,
            highlighted_text: selectedText.trim() || null,
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
                  } else if (data.type === "consent") {
                    // Handle consent request - add to message list and set pending state
                    const consentMessage: Message = {
                      id: `${Date.now()}-${Math.random()}`,
                      type: "consent",
                      content: data.content,
                      timestamp: new Date(),
                      thread_id: data.thread_id,
                    };

                    setMessages((prev) => [...prev, consentMessage]);
                    setPendingConsent({
                      message: data.content,
                      thread_id: data.thread_id,
                    });
                    setIsThinking(false);
                  } else {
                    // Handle regular messages (step, final)
                    const aiMessage: Message = {
                      id: `${Date.now()}-${Math.random()}`,
                      type: "assistant",
                      content: data.content,
                      timestamp: new Date(),
                      thread_id: data.thread_id,
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
        {pendingConsent ? (
          <ConsentPrompt
            onApprove={() => handleConsentResponse("approve")}
            onReject={() => handleConsentResponse("reject")}
            isProcessing={isProcessingConsent}
          />
        ) : (
          <MessageInput
            activeProjectId={activeProjectId}
            activeFileName={activeFileName}
            selectedText={selectedText}
            isThinking={isThinking}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
}
