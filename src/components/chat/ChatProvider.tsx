'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import FloatingChatWidget, { type ChatMessage } from './FloatingChatWidget';

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
            // Use the detailed error message from the API if available
            return (
              errorData.error ||
              'The daily rate limit has been exceeded. Please try again in 24 hours.'
            );
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
    <ErrorBoundary
      fallback={
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 16px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          Chat widget encountered an error. Please refresh the page.
        </div>
      }
    >
      <FloatingChatWidget onSendMessage={handleSendMessage} />
    </ErrorBoundary>,
    document.body
  );
}
