/**
 * UI Store - Zustand v5
 * Manages UI state including sidebar, modals, and toast notifications
 */

import { create } from 'zustand';
import type { ModalType, Toast, ToastType } from '../types';

// =============================================================================
// Types
// =============================================================================

interface UIStoreState {
  // Sidebar
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;

  // Modals
  activeModal: ModalType | null;
  modalData: unknown;

  // Toast notifications
  toasts: Toast[];

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Default toast durations by type (in milliseconds)
 */
const TOAST_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  info: 4000,
  warning: 4000,
};

/**
 * Maximum number of toasts to display at once
 */
const MAX_TOASTS = 5;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique ID for toasts
 */
function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// =============================================================================
// Store Definition
// =============================================================================

export const useUIStore = create<UIStoreState>()((set, get) => ({
  // Initial State
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  activeModal: null,
  modalData: undefined,
  toasts: [],

  // Sidebar Actions
  toggleSidebar: () => {
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ isSidebarOpen: open });
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ isSidebarCollapsed: collapsed });
  },

  // Modal Actions
  openModal: (type: ModalType, data?: unknown) => {
    set({
      activeModal: type,
      modalData: data,
    });
  },

  closeModal: () => {
    set({
      activeModal: null,
      modalData: undefined,
    });
  },

  // Toast Actions
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => {
    const id = generateToastId();
    const createdAt = new Date();

    // Get default duration based on toast type if not specified
    const duration = toast.duration ?? TOAST_DURATIONS[toast.type];

    const newToast: Toast = {
      ...toast,
      id,
      createdAt,
      duration,
      dismissible: toast.dismissible ?? true,
    };

    set((state) => {
      // Add new toast, limiting total count
      const updatedToasts = [newToast, ...state.toasts].slice(0, MAX_TOASTS);
      return { toasts: updatedToasts };
    });

    // Set up auto-dismiss if duration is specified and not 0
    if (duration && duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// =============================================================================
// Selectors (for optimized re-renders)
// =============================================================================

/**
 * Select sidebar open state
 */
export const selectIsSidebarOpen = (state: UIStoreState) => state.isSidebarOpen;

/**
 * Select sidebar collapsed state
 */
export const selectIsSidebarCollapsed = (state: UIStoreState) =>
  state.isSidebarCollapsed;

/**
 * Select sidebar state combined
 */
export const selectSidebarState = (state: UIStoreState) => ({
  isOpen: state.isSidebarOpen,
  isCollapsed: state.isSidebarCollapsed,
});

/**
 * Select active modal type
 */
export const selectActiveModal = (state: UIStoreState) => state.activeModal;

/**
 * Select modal data
 */
export const selectModalData = (state: UIStoreState) => state.modalData;

/**
 * Select modal state combined
 */
export const selectModalState = (state: UIStoreState) => ({
  activeModal: state.activeModal,
  modalData: state.modalData,
  isOpen: state.activeModal !== null,
});

/**
 * Select all toasts
 */
export const selectToasts = (state: UIStoreState) => state.toasts;

/**
 * Select toast count
 */
export const selectToastCount = (state: UIStoreState) => state.toasts.length;

/**
 * Select whether there are any toasts
 */
export const selectHasToasts = (state: UIStoreState) => state.toasts.length > 0;

/**
 * Check if a specific modal is open
 */
export const createModalSelector = (modalType: ModalType) => (state: UIStoreState) =>
  state.activeModal === modalType;

// =============================================================================
// Convenience Toast Helpers (can be used outside of React components)
// =============================================================================

/**
 * Show a success toast
 */
export const showSuccessToast = (message: string, title?: string) => {
  useUIStore.getState().addToast({
    type: 'success',
    message,
    title,
  });
};

/**
 * Show an error toast
 */
export const showErrorToast = (message: string, title?: string) => {
  useUIStore.getState().addToast({
    type: 'error',
    message,
    title,
  });
};

/**
 * Show an info toast
 */
export const showInfoToast = (message: string, title?: string) => {
  useUIStore.getState().addToast({
    type: 'info',
    message,
    title,
  });
};

/**
 * Show a warning toast
 */
export const showWarningToast = (message: string, title?: string) => {
  useUIStore.getState().addToast({
    type: 'warning',
    message,
    title,
  });
};
