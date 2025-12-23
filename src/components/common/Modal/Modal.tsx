/**
 * Modal Component
 * Accessible modal dialog with portal, focus trap, and cyberpunk styling
 */

import {
  useEffect,
  useRef,
  useCallback,
  memo,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Icon } from '../Icon';
import styles from './Modal.module.css';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title (optional) */
  title?: string;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  /** Modal content */
  children: ReactNode;
  /** Show close button (default: true) */
  showCloseButton?: boolean;
  /** Close on overlay click (default: true) */
  closeOnOverlayClick?: boolean;
  /** Close on Escape key (default: true) */
  closeOnEscape?: boolean;
  /** Additional class name for the modal */
  className?: string;
}

// Get all focusable elements within a container
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
}

/**
 * Modal component with focus trap and accessibility features
 * Renders via portal to document.body
 */
export const Modal = memo(function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle Escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = getFocusableElements(modalRef.current);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  // Lock body scroll and manage focus
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus the modal
      const focusableElements = modalRef.current
        ? getFocusableElements(modalRef.current)
        : [];
      const firstFocusable = focusableElements[0];

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          modalRef.current?.focus();
        }
      });

      return () => {
        // Restore body scroll
        document.body.style.overflow = originalOverflow;

        // Restore focus to the previously focused element
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Create portal content
  const modalContent = (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={clsx(styles.modal, styles[size], className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {(title || showCloseButton) && (
          <header className={styles.header}>
            {title && (
              <h2 id="modal-title" className={styles.title}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close modal"
              >
                <Icon name="close" size={20} />
              </button>
            )}
          </header>
        )}
        <div
          className={clsx(styles.content, {
            [styles.contentNoHeader]: !title && !showCloseButton,
          })}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Render via portal
  return createPortal(modalContent, document.body);
});
