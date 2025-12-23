/**
 * SearchInput Component
 * Debounced search input with clear button and neon styling
 */

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  memo,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react';
import clsx from 'clsx';
import { Icon } from '../Icon';
import styles from './SearchInput.module.css';

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Current search value */
  value: string;
  /** Callback when value changes (debounced if debounceMs > 0) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Show loading indicator */
  isLoading?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * SearchInput component with debounced onChange
 * Features search icon, clear button, and neon focus effects
 */
export const SearchInput = memo(
  forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
    {
      value,
      onChange,
      placeholder = 'Search...',
      debounceMs = 300,
      autoFocus = false,
      onClear,
      isLoading = false,
      className,
      ...props
    },
    ref
  ) {
    const [internalValue, setInternalValue] = useState(value);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Sync internal value with external value
    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    // Handle input change with debounce
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setInternalValue(newValue);

        // Clear existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Debounce the onChange callback
        if (debounceMs > 0) {
          debounceTimerRef.current = setTimeout(() => {
            onChange(newValue);
          }, debounceMs);
        } else {
          onChange(newValue);
        }
      },
      [onChange, debounceMs]
    );

    // Handle clear button click
    const handleClear = useCallback(() => {
      setInternalValue('');
      onChange('');
      onClear?.();

      // Focus the input after clearing
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, [onChange, onClear]);

    // Cleanup debounce timer on unmount
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    // Handle ref forwarding
    const setRefs = useCallback(
      (element: HTMLInputElement | null) => {
        inputRef.current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

    const hasValue = internalValue.length > 0;

    return (
      <div
        className={clsx(styles.container, className, {
          [styles.loading]: isLoading,
        })}
      >
        <input
          ref={setRefs}
          type="search"
          className={styles.input}
          value={internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          aria-label={placeholder}
          {...props}
        />
        {isLoading ? (
          <span className={styles.loadingIndicator} aria-hidden="true">
            <span className={styles.loadingSpinner} />
          </span>
        ) : (
          <span className={styles.searchIcon} aria-hidden="true">
            <Icon name="search" size={20} />
          </span>
        )}
        <button
          type="button"
          className={clsx(styles.clearButton, {
            [styles.visible]: hasValue,
          })}
          onClick={handleClear}
          aria-label="Clear search"
          tabIndex={hasValue ? 0 : -1}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    );
  })
);
