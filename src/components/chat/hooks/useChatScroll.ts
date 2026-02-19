'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from './useChatMessages';

export function useChatScroll(messages: ChatMessage[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return {
    messagesEndRef,
    scrollToBottom,
  };
}
