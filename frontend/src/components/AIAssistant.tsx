'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}


interface ActiveFile {
  name: string;
  path: string;
  content: string;
  projectId: string;
}

interface AIAssistantProps {
  activeProjectId?: string;
  activeFile: ActiveFile | null;
  selectedText: string;
  appendToEditor: ((content: string) => void) | null;
}

export default function AIAssistant({ activeProjectId, activeFile, selectedText, appendToEditor }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const appendToActiveFile = (content: string) => {
    if (!appendToEditor) return;

    appendToEditor(content);

    // Show success message
    const successMessage: Message = {
      id: `${Date.now()}-success`,
      type: 'assistant',
      content: '✅ Content has been added to your note!',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, successMessage]);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeProjectId) return;

    // Build context-enhanced message
    let enhancedMessage = inputText;

    // Add previous conversation context
    if (messages.length >= 2) {
      // Find the last user message and all assistant responses after it
      const lastUserMessageIndex = messages.findLastIndex(msg => msg.type === 'user');
      if (lastUserMessageIndex >= 0 && lastUserMessageIndex < messages.length - 1) {
        const lastUserMessage = messages[lastUserMessageIndex];
        const assistantResponses = messages.slice(lastUserMessageIndex + 1).filter(msg => msg.type === 'assistant');

        if (assistantResponses.length > 0) {
          enhancedMessage += `\n\n--- PREVIOUS CONVERSATION ---\nUser: ${lastUserMessage.content}\n`;
          assistantResponses.forEach((response) => {
            enhancedMessage += `Assistant: ${response.content}\n`;
          });
        }
      }
    }

    if (activeFile) {
      enhancedMessage += `\n\n--- ACTIVE FILE CONTEXT ---\nFile: ${activeFile.name}\nContent:\n${activeFile.content}`;

      if (selectedText.trim()) {
        enhancedMessage += `\n\n--- HIGHLIGHTED TEXT ---\n${selectedText}`;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText, // Show only the user's original input in the UI
      timestamp: new Date(),
    };

    const currentInput = enhancedMessage; // Send the context-enhanced message to backend
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/ai-tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          project_id: activeProjectId
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Accumulate chunks in buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete messages
          while (buffer.includes('\n\n')) {
            const messageEndIndex = buffer.indexOf('\n\n');
            const messageChunk = buffer.slice(0, messageEndIndex);
            buffer = buffer.slice(messageEndIndex + 2);

            // Process each line in the message chunk
            const lines = messageChunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'note') {
                    // Handle note content by appending to active file
                    appendToActiveFile(data.content);
                    setIsThinking(false);
                  } else {
                    // Handle regular messages (step, final)
                    const aiMessage: Message = {
                      id: `${Date.now()}-${Math.random()}`,
                      type: 'assistant',
                      content: data.content,
                      timestamp: new Date(),
                    };

                    setMessages(prev => [...prev, aiMessage]);

                    // If this is the final message, stop thinking
                    if (data.type === 'final') {
                      setIsThinking(false);
                    }

                    // Add a small delay to show messages one by one
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                } catch (parseError) {
                  console.error('Error parsing stream data:', parseError);
                }
              }
            }
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending message to AI tutor:', error);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm experiencing technical difficulties. Please try again later!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsThinking(false);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                {message.content}
              </div>
              <div
                className={`text-xs mt-1 ${
                  message.type === 'user'
                    ? 'text-blue-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-300 dark:border-gray-700">
        {/* Thinking Status Bar */}
        {isThinking && (
          <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-blue-600 dark:text-blue-300">Thinking...</span>
            </div>
          </div>
        )}

        <div className="px-3 pt-1 pb-3">
          {/* Context Status */}
          {activeFile && (
            <div className="mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Context: {activeFile.name}
                {selectedText.trim() && (
                  <span className="text-blue-500 dark:text-blue-400"> (+ highlighted text)</span>
                )}
              </span>
            </div>
          )}
          <div className="flex space-x-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyUp={handleKeyUp}
              placeholder={activeProjectId ? "What do you want to learn about?" : "Select a project to start chatting"}
              disabled={isThinking || !activeProjectId}
              className={`flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 ${
                (isThinking || !activeProjectId) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isThinking || !activeProjectId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span className="text-sm">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}