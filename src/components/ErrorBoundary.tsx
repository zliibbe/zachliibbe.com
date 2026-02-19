'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '@/lib/error-handling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  prevResetKeys: Array<string | number>;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      prevResetKeys: props.resetKeys || [],
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  static getDerivedStateFromProps(
    props: Props,
    state: State
  ): Partial<State> | null {
    const { resetKeys = [], resetOnPropsChange = false } = props;
    const { prevResetKeys, hasError } = state;

    // Reset error boundary if resetKeys have changed
    if (
      hasError &&
      resetOnPropsChange &&
      resetKeys.length > 0 &&
      (resetKeys.length !== prevResetKeys.length ||
        resetKeys.some((key, index) => key !== prevResetKeys[index]))
    ) {
      return {
        hasError: false,
        error: null,
        errorInfo: null,
        prevResetKeys: resetKeys,
      };
    }

    if (resetKeys !== prevResetKeys) {
      return {
        prevResetKeys: resetKeys,
      };
    }

    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      resetKeys: this.props.resetKeys,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { hasError } = this.state;
    const { resetKeys = [] } = this.props;
    const prevResetKeys = prevProps.resetKeys || [];

    // Reset error boundary if resetKeys have changed
    if (
      hasError &&
      prevState.hasError &&
      resetKeys.length > 0 &&
      (resetKeys.length !== prevResetKeys.length ||
        resetKeys.some((key, index) => key !== prevResetKeys[index]))
    ) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#fff5f5',
            color: '#d63031',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <h2
            style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}
          >
            Something went wrong
          </h2>
          <p style={{ margin: '0 0 16px 0', lineHeight: 1.5 }}>
            We encountered an unexpected error. This has been logged and
            we&apos;ll look into it.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ margin: '16px 0' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '300px',
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#d63031',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
interface UseErrorBoundaryState {
  error: Error | null;
}

export function useErrorBoundary() {
  const [state, setState] = React.useState<UseErrorBoundaryState>({
    error: null,
  });

  const resetErrorBoundary = React.useCallback(() => {
    setState({ error: null });
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setState({ error });
    logError(error, { context: 'useErrorBoundary hook' });
  }, []);

  React.useEffect(() => {
    if (state.error) {
      throw state.error;
    }
  }, [state.error]);

  return {
    captureError,
    resetErrorBoundary,
  };
}

// Higher-order component wrapper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
