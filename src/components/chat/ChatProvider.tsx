'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import FloatingChatWidget, { ChatMessage } from './FloatingChatWidget';

interface ChatResponse {
  success: boolean;
  message: string;
  sources?: string[];
  error?: string;
  rateLimited?: boolean;
}

export default function ChatProvider() {
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>(
    []
  );
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show chat widget on work page
  const shouldShowChat = pathname === '/work';

  const handleSendMessage = useCallback(
    async (message: string): Promise<string> => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationHistory: conversationHistory.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
        });

        if (!response.ok) {
          const errorData: ChatResponse = await response
            .json()
            .catch(() => ({}));

          if (response.status === 429) {
            return "I'm receiving too many messages right now. Please wait a moment before trying again.";
          }

          return (
            errorData.error ||
            "I'm sorry, I encountered an error. Please try again later."
          );
        }

        const data: ChatResponse = await response.json();

        if (!data.success) {
          return (
            data.error ||
            "I'm sorry, I encountered an error. Please try again later."
          );
        }

        // Update conversation history for context
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          content: message,
          role: 'user',
          timestamp: new Date(),
        };

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: data.message,
          role: 'assistant',
          timestamp: new Date(),
        };

        setConversationHistory(prev => [
          ...prev,
          userMessage,
          assistantMessage,
        ]);

        return data.message;
      } catch (error) {
        console.error('Error sending message:', error);
        return "I'm sorry, I encountered a network error. Please check your connection and try again.";
      }
    },
    [conversationHistory]
  );

  if (!mounted || !shouldShowChat) return null;

  return createPortal(
    <FloatingChatWidget onSendMessage={handleSendMessage} />,
    document.body
  );
}
