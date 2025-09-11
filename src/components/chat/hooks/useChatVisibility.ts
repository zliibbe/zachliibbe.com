'use client';

import { useState, useEffect, useCallback } from 'react';

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
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowPrompt(false);
      setShowGreeting(false);
    }
  }, [isOpen]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setShowPrompt(false);
    setShowGreeting(false);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
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
  };
}
