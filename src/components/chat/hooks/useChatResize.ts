'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ChatDimensions {
  width: number;
  height: number;
}

interface UseChatResizeOptions {
  initialDimensions?: ChatDimensions;
  isOpen: boolean;
}

export function useChatResize({
  initialDimensions = { width: 350, height: 500 },
  isOpen,
}: UseChatResizeOptions) {
  const [chatDimensions, setChatDimensions] =
    useState<ChatDimensions>(initialDimensions);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const resizeDirection = useRef<string>('');

  const handleResizeStart = useCallback(
    (direction: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      resizeDirection.current = direction;
      document.body.style.cursor = getComputedStyle(e.target as Element).cursor;
      document.body.style.userSelect = 'none';
    },
    []
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current || !chatContainerRef.current) return;

      const container = chatContainerRef.current;
      const rect = container.getBoundingClientRect();
      const direction = resizeDirection.current;

      let newWidth = chatDimensions.width;
      let newHeight = chatDimensions.height;

      // Calculate new dimensions based on direction
      if (direction.includes('e')) {
        newWidth = Math.max(300, Math.min(800, e.clientX - rect.left + 20));
      }
      if (direction.includes('w')) {
        newWidth = Math.max(300, Math.min(800, rect.right - e.clientX + 20));
      }
      if (direction.includes('s')) {
        newHeight = Math.max(
          400,
          Math.min(window.innerHeight - 100, e.clientY - rect.top + 20)
        );
      }
      if (direction.includes('n')) {
        newHeight = Math.max(
          400,
          Math.min(window.innerHeight - 100, rect.bottom - e.clientY + 20)
        );
      }

      setChatDimensions({ width: newWidth, height: newHeight });
    },
    [chatDimensions.width, chatDimensions.height]
  );

  const handleResizeEnd = useCallback(() => {
    isResizing.current = false;
    resizeDirection.current = '';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
    return undefined;
  }, [isOpen, handleResizeMove, handleResizeEnd]);

  return {
    chatDimensions,
    setChatDimensions,
    chatContainerRef,
    handleResizeStart,
  };
}
