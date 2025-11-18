import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,

    success(message: string, duration = 5000) {
      this.add({
        id: crypto.randomUUID(),
        message,
        type: 'success',
        duration,
      });
    },

    error(message: string, duration = 7000) {
      this.add({
        id: crypto.randomUUID(),
        message,
        type: 'error',
        duration,
      });
    },

    warning(message: string, duration = 6000) {
      this.add({
        id: crypto.randomUUID(),
        message,
        type: 'warning',
        duration,
      });
    },

    info(message: string, duration = 5000) {
      this.add({
        id: crypto.randomUUID(),
        message,
        type: 'info',
        duration,
      });
    },

    add(toast: Toast) {
      update((toasts) => [...toasts, toast]);
    },

    remove(id: string) {
      update((toasts) => toasts.filter((t) => t.id !== id));
    },

    clear() {
      update(() => []);
    },
  };
}

export const toastStore = createToastStore();
