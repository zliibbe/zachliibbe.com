'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  HiChevronUp,
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
  const [showPrompt, setShowPrompt] = useState(true);
  const [showGreeting, setShowGreeting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

    try {
      const response = onSendMessage
        ? await onSendMessage(userMessage.content)
        : 'Thanks for your message! This is a demo response.';

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again later.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
        <div className={styles.chatContainer}>
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
                  Hi! I'm here to help answer questions about Zach's work,
                  experience, and projects. What would you like to know?
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
                <div className={styles.messageContent}>{message.content}</div>
                <div className={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}

            {isLoading && (
              <div
                className={`${styles.message} ${styles.assistantMessage} ${styles.loadingMessage}`}
              >
                <div className={styles.messageContent}>
                  <div className={styles.loadingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

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
        </div>
      )}

      <button
        onClick={toggleChat}
        className={`${styles.chatToggle} ${isOpen ? styles.chatToggleOpen : ''}`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <HiChevronUp className={styles.toggleIcon} />
        ) : (
          <HiChatBubbleLeftRight className={styles.chatIcon} />
        )}
      </button>

      {!isOpen && showPrompt && (
        <div className={styles.chatPrompt}>
          <div className={styles.promptText}>
            Chat with AI and learn about Zach
          </div>
          <div className={styles.promptArrow}></div>
        </div>
      )}

      {!isOpen && showGreeting && mounted && createPortal(
        <div className={styles.greetingBubbleOverlay}>
          <div className={styles.greetingBubble}>
            <div className={styles.greetingText}>
              Hi friend! I hope I didn't startle you. Want to chat with me to
              learn about Zach?
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
