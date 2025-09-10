'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  HiXMark,
  HiPaperAirplane,
  HiChatBubbleLeftRight,
} from 'react-icons/hi2';
import styles from './FloatingChatWidget.module.css';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

interface FloatingChatWidgetProps {
  onSendMessage?: (message: string) => Promise<string>;
}

export default function FloatingChatWidget({
  onSendMessage,
}: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [showPrompt, setShowPrompt] = useState(true);
  const [showGreeting, setShowGreeting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [chatDimensions, setChatDimensions] = useState({
    width: 350,
    height: 500,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const resizeDirection = useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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

  // Hide prompt after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPrompt(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Show greeting after 5 seconds
  useEffect(() => {
    const greetingTimer = setTimeout(() => {
      if (!isOpen) {
        setShowGreeting(true);
        // Hide greeting after 8 seconds
        setTimeout(() => {
          setShowGreeting(false);
        }, 8000);
      }
    }, 5000);

    return () => clearTimeout(greetingTimer);
  }, [isOpen]);

  // Resize functionality
  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    resizeDirection.current = direction;
    document.body.style.cursor = getComputedStyle(e.target as Element).cursor;
    document.body.style.userSelect = 'none';
  };

  const handleResizeMove = (e: MouseEvent) => {
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
      newHeight = Math.max(400, Math.min(window.innerHeight - 100, e.clientY - rect.top + 20));
    }
    if (direction.includes('n')) {
      newHeight = Math.max(400, Math.min(window.innerHeight - 100, rect.bottom - e.clientY + 20));
    }

    setChatDimensions({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    isResizing.current = false;
    resizeDirection.current = '';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isOpen, chatDimensions]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
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
  };

  const streamTextResponse = async (messageId: string, text: string) => {
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowPrompt(false);
      setShowGreeting(false);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <div className={styles.chatWidget}>
      {isOpen && (
        <div 
          ref={chatContainerRef}
          className={styles.chatContainer}
          style={{
            width: `${chatDimensions.width}px`,
            height: `${chatDimensions.height}px`,
          }}
        >
          <div className={styles.chatHeader}>
            <h3>Ask me anything</h3>
            <button
              onClick={closeChat}
              className={styles.closeButton}
              aria-label="Close chat"
            >
              <HiXMark className={styles.closeIcon} />
            </button>
          </div>

          <div className={styles.messagesContainer}>
            {messages.length === 0 && (
              <div className={styles.welcomeMessage}>
                <p>
                  Hi! I&apos;m here to help answer questions about Zach&apos;s
                  work, experience, and projects. What would you like to know?
                </p>
              </div>
            )}

            {messages.map(message => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.role === 'user'
                    ? styles.userMessage
                    : styles.assistantMessage
                }`}
              >
                <div className={styles.messageContent}>
                  {message.content ||
                    (message.role === 'assistant' && message.isStreaming && (
                      <div className={styles.loadingDots}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ))}
                  {message.isStreaming && message.content && (
                    <span className={styles.typingCursor}>|</span>
                  )}
                </div>
                <div className={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className={styles.inputForm}>
            <div className={styles.inputContainer}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className={styles.messageInput}
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={styles.sendButton}
                aria-label="Send message"
              >
                <HiPaperAirplane className={styles.sendIcon} />
              </button>
            </div>
          </form>
          
          {/* Resize handles */}
          <div 
            className={`${styles.resizeHandle} ${styles.resizeHandleNW}`}
            onMouseDown={handleResizeStart('nw')}
          />
          <div 
            className={`${styles.resizeHandle} ${styles.resizeHandleN}`}
            onMouseDown={handleResizeStart('n')}
          />
          <div 
            className={`${styles.resizeHandle} ${styles.resizeHandleNE}`}
            onMouseDown={handleResizeStart('ne')}
          />
          <div 
            className={`${styles.resizeHandle} ${styles.resizeHandleW}`}
            onMouseDown={handleResizeStart('w')}
          />
          <div 
            className={`${styles.resizeHandle} ${styles.resizeHandleE}`}
            onMouseDown={handleResizeStart('e')}
          />
          <div 
            className={`${styles.resizeHandle} ${styles.resizeHandleSW}`}
            onMouseDown={handleResizeStart('sw')}
          />
          <div 
            className={`${styles.resizeHandle} ${styles.resizeHandleS}`}
            onMouseDown={handleResizeStart('s')}
          />
          <div 
            className={`${styles.resizeHandle} ${styles.resizeHandleSE}`}
            onMouseDown={handleResizeStart('se')}
          />
        </div>
      )}

      {!isOpen && (
        <button
          onClick={toggleChat}
          className={styles.chatToggle}
          aria-label="Open chat"
        >
          <HiChatBubbleLeftRight className={styles.chatIcon} />
        </button>
      )}

      {!isOpen && showPrompt && (
        <div className={styles.chatPrompt}>
          <div className={styles.promptText}>
            Chat with AI and learn about Zach
          </div>
          <div className={styles.promptArrow}></div>
        </div>
      )}

      {!isOpen &&
        showGreeting &&
        mounted &&
        createPortal(
          <div className={styles.greetingBubbleOverlay}>
            <div className={styles.greetingBubble}>
              <div className={styles.greetingText}>
                Hi friend! I hope I didn&apos;t startle you. Want to chat with
                me to learn about Zach? Click the chat below to get started.
              </div>
              <button
                className={styles.greetingClose}
                onClick={() => setShowGreeting(false)}
                aria-label="Close greeting"
              >
                <HiXMark />
              </button>
              <div className={styles.greetingArrow}></div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
