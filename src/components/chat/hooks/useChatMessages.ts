'use client';

import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseChatMessagesOptions {
  onSendMessage?: (message: string) => Promise<string>;
}

export function useChatMessages({
  onSendMessage,
}: UseChatMessagesOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  const streamTextResponse = useCallback(
    async (messageId: string, text: string) => {
      const words = text.split(' ');
      let currentText = '';

      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];

        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: currentText,
                  isStreaming: i < words.length - 1,
                }
              : msg
          )
        );

        // Add delay between words for streaming effect
        if (i < words.length - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, 50 + Math.random() * 30)
          );
        }
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: content.trim(),
        role: 'user',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      // Immediately show loading indicator
      const assistantMessageId = (Date.now() + 1).toString();
      const loadingMessage: ChatMessage = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, loadingMessage]);
      setStreamingMessageId(assistantMessageId);

      try {
        const response = onSendMessage
          ? await onSendMessage(userMessage.content)
          : 'Thanks for your message! This is a demo response.';

        // Start streaming animation
        await streamTextResponse(assistantMessageId, response);
      } catch (error) {
        console.error('Error sending message:', error);
        await streamTextResponse(
          assistantMessageId,
          'Sorry, I encountered an error. Please try again later.'
        );
      } finally {
        setIsLoading(false);
        setStreamingMessageId(null);
      }
    },
    [isLoading, onSendMessage, streamTextResponse]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    streamingMessageId,
    sendMessage,
    clearMessages,
  };
}
