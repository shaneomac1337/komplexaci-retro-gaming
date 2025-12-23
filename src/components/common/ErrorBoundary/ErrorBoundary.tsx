/**
 * ErrorBoundary Component
 * Catches JavaScript errors in child components and displays fallback UI.
 * Implements React 18+ error boundary pattern with proper TypeScript typing.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import styles from './ErrorBoundary.module.css';

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Optional custom fallback UI component */
  fallback?: ReactNode;
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional callback when reset is triggered */
  onReset?: () => void;
  /** Optional title for the error message */
  errorTitle?: string;
  /** Whether to show technical error details (default: false in production) */
  showDetails?: boolean;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Default fallback component displayed when an error occurs
 */
function DefaultFallback({
  error,
  errorInfo,
  onReset,
  errorTitle = 'Something went wrong',
  showDetails = false,
}: {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset?: () => void;
  errorTitle?: string;
  showDetails?: boolean;
}) {
  return (
    <div className={styles.container} role="alert" aria-live="assertive">
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className={styles.title}>{errorTitle}</h2>

        <p className={styles.message}>
          An unexpected error occurred. Please try again or refresh the page.
        </p>

        {showDetails && error && (
          <details className={styles.details}>
            <summary className={styles.detailsSummary}>
              Technical Details
            </summary>
            <div className={styles.detailsContent}>
              <p className={styles.errorName}>{error.name}</p>
              <p className={styles.errorMessage}>{error.message}</p>
              {errorInfo?.componentStack && (
                <pre className={styles.stackTrace}>
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          </details>
        )}

        <div className={styles.actions}>
          {onReset && (
            <button
              type="button"
              className={styles.resetButton}
              onClick={onReset}
            >
              Try Again
            </button>
          )}
          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ErrorBoundary Component
 *
 * A React error boundary that catches JavaScript errors anywhere in its
 * child component tree, logs those errors, and displays a fallback UI.
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, info) => logErrorToService(error, info)}
 *   onReset={() => resetAppState()}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * // With custom fallback
 * <ErrorBoundary
 *   fallback={<CustomErrorPage />}
 * >
 *   <FeatureComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Static lifecycle method called when an error is thrown
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle method called after an error has been thrown
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error info
    this.setState({ errorInfo });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Reset the error boundary state
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call optional reset callback
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const {
      children,
      fallback,
      errorTitle,
      showDetails = import.meta.env.DEV,
    } = this.props;

    if (hasError) {
      // If a custom fallback is provided, render it
      if (fallback) {
        return fallback;
      }

      // Otherwise, render the default fallback UI
      return (
        <DefaultFallback
          error={error}
          errorInfo={errorInfo}
          onReset={this.handleReset}
          errorTitle={errorTitle}
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
