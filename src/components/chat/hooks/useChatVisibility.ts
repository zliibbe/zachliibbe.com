'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { analytics } from '@/app/utils/analytics';

interface UseChatVisibilityOptions {
  promptTimeout?: number;
  greetingDelay?: number;
  greetingDuration?: number;
}

export function useChatVisibility({
  promptTimeout = 10000,
  greetingDelay = 5000,
  greetingDuration = 8000,
}: UseChatVisibilityOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [showGreeting, setShowGreeting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const openTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide prompt after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPrompt(false);
    }, promptTimeout);

    return () => clearTimeout(timer);
  }, [promptTimeout]);

  // Show greeting after delay
  useEffect(() => {
    const greetingTimer = setTimeout(() => {
      if (!isOpen) {
        setShowGreeting(true);
        // Hide greeting after duration
        setTimeout(() => {
          setShowGreeting(false);
        }, greetingDuration);
      }
    }, greetingDelay);

    return () => clearTimeout(greetingTimer);
  }, [isOpen, greetingDelay, greetingDuration]);

  const toggleChat = useCallback(() => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    if (willOpen) {
      setShowPrompt(false);
      setShowGreeting(false);
      openTimeRef.current = Date.now();
      if (analytics.isEnabled()) {
        analytics.trackChatOpen();
      }
    }
  }, [isOpen]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setShowPrompt(false);
    setShowGreeting(false);
    openTimeRef.current = Date.now();
    if (analytics.isEnabled()) {
      analytics.trackChatOpen();
    }
  }, []);

  const closeChat = useCallback((messageCount: number = 0) => {
    // Track chat close with duration and message count
    if (analytics.isEnabled() && openTimeRef.current) {
      const durationSeconds = Math.floor(
        (Date.now() - openTimeRef.current) / 1000
      );
      analytics.trackChatClose(messageCount, durationSeconds);
    }

    setIsOpen(false);
    openTimeRef.current = null;
  }, []);

  const dismissGreeting = useCallback(() => {
    setShowGreeting(false);
  }, []);

  return {
    isOpen,
    showPrompt,
    showGreeting,
    mounted,
    toggleChat,
    openChat,
    closeChat,
    dismissGreeting,
    openTimeRef,
  };
}
