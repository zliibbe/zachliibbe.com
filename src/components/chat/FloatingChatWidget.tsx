'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  HiXMark,
  HiPaperAirplane,
  HiChatBubbleLeftRight,
} from 'react-icons/hi2';
import styles from './FloatingChatWidget.module.css';
import {
  useChatMessages,
  useChatInput,
  useChatResize,
  useChatVisibility,
  useChatScroll,
  ChatMessage,
} from './hooks';

export type { ChatMessage };

interface FloatingChatWidgetProps {
  onSendMessage?: (message: string) => Promise<string>;
}

export default function FloatingChatWidget({
  onSendMessage,
}: FloatingChatWidgetProps) {
  // Custom hooks for separated concerns
  const { messages, isLoading, sendMessage } = useChatMessages(
    onSendMessage ? { onSendMessage } : {}
  );
  const { messagesEndRef } = useChatScroll(messages);
  const {
    isOpen,
    showPrompt,
    showGreeting,
    mounted,
    toggleChat,
    closeChat,
    dismissGreeting,
  } = useChatVisibility();

  const { chatDimensions, chatContainerRef, handleResizeStart } = useChatResize(
    {
      isOpen,
    }
  );

  const {
    inputValue,
    setInputValue,
    inputRef,
    handleSubmit,
    handleKeyDown,
    focusInput,
  } = useChatInput({
    onSendMessage: sendMessage,
    disabled: isLoading,
  });

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      focusInput();
    }
  }, [isOpen, focusInput]);

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

          <form onSubmit={handleSubmit} className={styles.inputForm}>
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
                onClick={dismissGreeting}
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
