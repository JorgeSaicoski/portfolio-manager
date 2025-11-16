<script lang="ts">
  import { fly, fade } from 'svelte/transition';
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
      on:click={close}
      aria-label="Close notification"
    >
      ×
    </button>
  </div>
{/if}

<style lang="scss">
  .toast {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-primary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    border-left: 4px solid;
    min-width: 300px;
    max-width: 500px;

    &.toast-success {
      border-color: var(--color-success);
      background: var(--color-success-alpha);

      .toast-icon {
        color: var(--color-success);
        background: var(--color-success);
        color: white;
      }
    }

    &.toast-error {
      border-color: var(--color-error);
      background: var(--color-error-alpha);

      .toast-icon {
        color: var(--color-error);
        background: var(--color-error);
        color: white;
      }
    }

    &.toast-warning {
      border-color: var(--color-warning);
      background: var(--color-warning-alpha);

      .toast-icon {
        color: var(--color-warning);
        background: var(--color-warning);
        color: white;
      }
    }

    &.toast-info {
      border-color: var(--color-info);
      background: var(--color-info-alpha);

      .toast-icon {
        color: var(--color-info);
        background: var(--color-info);
        color: white;
      }
    }
  }

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
  }

  .toast-message {
    flex: 1;
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
    line-height: 1.5;
  }

  .toast-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
    flex-shrink: 0;

    &:hover {
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }

    &:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }
</style>
