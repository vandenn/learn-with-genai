'use client';

import { useState } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ThinkingStep {
  id: string;
  title: string;
  content: string;
  completed: boolean;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);

  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Mock thinking steps for demonstration
  const [thinkingSteps] = useState<ThinkingStep[]>([
    { id: '1', title: 'Analyzing your question', content: 'Understanding the context and requirements...', completed: true },
    { id: '2', title: 'Searching knowledge base', content: 'Looking through relevant information sources...', completed: true },
    { id: '3', title: 'Formulating response', content: 'Crafting a comprehensive and helpful answer...', completed: false },
  ]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    const currentInput = inputText;
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/ai-tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
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
    } finally {
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

      {/* Chain of Thought Section */}
      {isThinking && (
        <div className="p-3 border-b border-gray-300 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Thinking...</h3>
          <div className="space-y-2">
            {thinkingSteps.map((step) => (
              <div key={step.id} className="flex items-start space-x-2">
                <div className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 ${
                  step.completed
                    ? 'bg-green-500'
                    : 'bg-yellow-500 animate-pulse'
                }`}>
                  {step.completed && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    {step.title}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">
                    {step.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-300 dark:border-gray-700">
        <div className="flex space-x-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyUp={handleKeyUp}
            placeholder="What do you want to learn about?"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isThinking}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <span className="text-sm">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}