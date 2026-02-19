import { act, renderHook, waitFor } from '@testing-library/react';
import { useChatMessages } from '../useChatMessages';

// Suppress streaming timeouts in tests
jest.useFakeTimers();

// Mock analytics so tests don't hit real tracking
jest.mock('@/app/utils/analytics', () => ({
  analytics: {
    isEnabled: jest.fn().mockReturnValue(false),
    trackChatMessage: jest.fn(),
  },
}));

describe('useChatMessages', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('starts with empty messages and not loading', () => {
    const { result } = renderHook(() => useChatMessages());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.streamingMessageId).toBeNull();
  });

  it('ignores empty or whitespace-only messages', async () => {
    const { result } = renderHook(() => useChatMessages());

    await act(async () => {
      result.current.sendMessage('   ');
    });

    expect(result.current.messages).toHaveLength(0);
  });

  it('adds user message immediately on send', async () => {
    const onSendMessage = jest.fn().mockResolvedValue('Hello back');
    const { result } = renderHook(() => useChatMessages({ onSendMessage }));

    act(() => {
      result.current.sendMessage('Hello');
    });

    expect(result.current.messages[0]).toMatchObject({
      content: 'Hello',
      role: 'user',
    });
  });

  it('adds a loading assistant message immediately after user message', async () => {
    const onSendMessage = jest.fn().mockResolvedValue('A response');
    const { result } = renderHook(() => useChatMessages({ onSendMessage }));

    act(() => {
      result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Searching knowledge base...',
      isStreaming: true,
    });
  });

  it('calls onSendMessage callback with trimmed user input', async () => {
    const onSendMessage = jest.fn().mockResolvedValue('Response');
    const { result } = renderHook(() => useChatMessages({ onSendMessage }));

    await act(async () => {
      result.current.sendMessage('  hello world  ');
      await jest.runAllTimersAsync();
    });

    expect(onSendMessage).toHaveBeenCalledWith('hello world');
  });

  it('uses default demo response when no callback provided', async () => {
    const { result } = renderHook(() => useChatMessages());

    await act(async () => {
      result.current.sendMessage('Hi');
      await jest.runAllTimersAsync();
    });

    await waitFor(() => {
      const assistantMsg = result.current.messages.find(
        m => m.role === 'assistant'
      );
      expect(assistantMsg?.content).toContain('demo response');
    });
  });

  it('sets isLoading to false after response completes', async () => {
    const onSendMessage = jest.fn().mockResolvedValue('Done');
    const { result } = renderHook(() => useChatMessages({ onSendMessage }));

    await act(async () => {
      result.current.sendMessage('Hi');
      await jest.runAllTimersAsync();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('clears streamingMessageId after response completes', async () => {
    const onSendMessage = jest.fn().mockResolvedValue('Done');
    const { result } = renderHook(() => useChatMessages({ onSendMessage }));

    await act(async () => {
      result.current.sendMessage('Hi');
      await jest.runAllTimersAsync();
    });

    await waitFor(() => {
      expect(result.current.streamingMessageId).toBeNull();
    });
  });

  it('shows rate limit error message on 429 error', async () => {
    const onSendMessage = jest
      .fn()
      .mockRejectedValue(new Error('rate limit exceeded'));
    const { result } = renderHook(() => useChatMessages({ onSendMessage }));

    await act(async () => {
      result.current.sendMessage('Hi');
      await jest.runAllTimersAsync();
    });

    await waitFor(() => {
      const assistantMsg = result.current.messages.find(
        m => m.role === 'assistant'
      );
      expect(assistantMsg?.content).toContain('Too many requests');
    });
  });

  it('shows service error message on 500 error', async () => {
    const onSendMessage = jest
      .fn()
      .mockRejectedValue(new Error('500 service error'));
    const { result } = renderHook(() => useChatMessages({ onSendMessage }));

    await act(async () => {
      result.current.sendMessage('Hi');
      await jest.runAllTimersAsync();
    });

    await waitFor(() => {
      const assistantMsg = result.current.messages.find(
        m => m.role === 'assistant'
      );
      expect(assistantMsg?.content).toContain('temporarily unavailable');
    });
  });

  it('clearMessages resets to empty array', async () => {
    const onSendMessage = jest.fn().mockResolvedValue('Hello');
    const { result } = renderHook(() => useChatMessages({ onSendMessage }));

    await act(async () => {
      result.current.sendMessage('Hi');
      await jest.runAllTimersAsync();
    });

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toHaveLength(0);
  });
});
