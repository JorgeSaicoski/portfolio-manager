<script lang="ts">
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';

  export let message: string;
  export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  export let duration = 5000; // Auto-close after 5 seconds
  export let onClose: () => void;

  let visible = true;
  let timeoutId: number | null = null;

  onMount(() => {
    if (duration > 0) {
      timeoutId = window.setTimeout(() => {
        close();
      }, duration);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  });

  function close() {
    visible = false;
    setTimeout(() => {
      onClose();
    }, 300); // Match transition duration
  }

  function getIcon() {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }
</script>

{#if visible}
  <div
    class="toast toast-{type}"
    transition:fly={{ y: -50, duration: 300 }}
    role="alert"
    aria-live="polite"
  >
    <div class="toast-icon">{getIcon()}</div>
    <div class="toast-message">{message}</div>
    <button
      type="button"
      class="toast-close"
      onclick={close}
      aria-label="Close notification"
    >
      ×
    </button>
  </div>
{/if}

<style lang="scss">
  /* Base icon styles first so per-type rules that follow can override them */
  .toast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-weight: bold;
    font-size: var(--font-size-sm);
    flex-shrink: 0;
    /* Ensure a neutral fallback if no type-specific background is set */
    background: var(--toast-icon-bg, transparent);
    color: var(--toast-icon-color, #ffffff);
  }

  .toast {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-primary, #ffffff);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg, 0 4px 12px rgba(0,0,0,0.08));
    border-left: 4px solid;
    min-width: 300px;
    max-width: 500px;
  }

  /* Success */
  .toast.toast-success {
    border-color: var(--color-success, #16a34a);
    background: var(--color-success-alpha, rgba(16,163,127,0.08));
  }
  .toast.toast-success .toast-icon {
    background: var(--color-success, #16a34a);
    color: white;
  }

  /* Error */
  .toast.toast-error {
    border-color: var(--color-error, #e53e3e);
    background: var(--color-error-alpha, rgba(229,62,62,0.08));
  }
  .toast.toast-error .toast-icon {
    background: var(--color-error, #e53e3e);
    color: white;
  }

  /* Warning */
  .toast.toast-warning {
    border-color: var(--color-warning, #d97706);
    background: var(--color-warning-alpha, rgba(217,119,6,0.08));
  }
  .toast.toast-warning .toast-icon {
    background: var(--color-warning, #d97706);
    color: white;
  }

  /* Info */
  .toast.toast-info {
    border-color: var(--color-info, #3b82f6);
    background: var(--color-info-alpha, rgba(59,130,246,0.08));
  }
  .toast.toast-info .toast-icon {
    background: var(--color-info, #3b82f6);
    color: white;
  }

  .toast-message {
    flex: 1;
    color: var(--color-text-primary, #111827);
    font-size: var(--font-size-base);
    line-height: 1.5;
  }

  .toast-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-text-secondary, #6b7280);
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast, 0.12s ease);
    flex-shrink: 0;

    &:hover {
      background: var(--color-bg-secondary, #f3f4f6);
      color: var(--color-text-primary, #111827);
    }

    &:focus {
      outline: 2px solid var(--color-primary, #3b82f6);
      outline-offset: 2px;
    }
  }
</style>
