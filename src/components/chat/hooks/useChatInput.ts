'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseChatInputOptions {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function useChatInput({
  onSendMessage,
  disabled = false,
}: UseChatInputOptions) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // Max height in pixels (about 6 lines)
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [inputValue]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!inputValue.trim() || disabled) return;

      onSendMessage(inputValue.trim());
      setInputValue('');
    },
    [inputValue, disabled, onSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return {
    inputValue,
    setInputValue,
    inputRef,
    handleSubmit,
    handleKeyDown,
    focusInput,
  };
}
