/**
 * Toast Components
 * Exports for toast notification system
 */

export { Toast, type ToastProps } from './Toast';

// Original ToastContainer (requires props)
export {
  ToastContainer as BaseToastContainer,
  type ToastContainerProps,
} from './ToastContainer';

// Connected ToastContainer (self-contained, connects to store)
export {
  ConnectedToastContainer as ToastContainer,
  type ConnectedToastContainerProps,
} from './ConnectedToastContainer';
