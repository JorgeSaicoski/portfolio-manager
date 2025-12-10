<script lang="ts">
  /**
   * EmptyState Component
   * Reusable empty state display with optional action button
   */

  type StateSize = 'sm' | 'md' | 'lg';

  interface Props {
    icon?: string;
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    size?: StateSize;
  }

  let {
    icon,
    title,
    message,
    actionLabel,
    onAction,
    size = 'md'
  }: Props = $props();
</script>

<div class="empty-state" class:sm={size === 'sm'} class:lg={size === 'lg'}>
  {#if icon}
    <div class="empty-icon">{icon}</div>
  {/if}

  <h3 class="empty-title">{title}</h3>

  {#if message}
    <p class="empty-message">{message}</p>
  {/if}

  {#if actionLabel && onAction}
    <button class="btn btn-primary" onclick={onAction}>
      {actionLabel}
    </button>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-12);
    color: var(--color-gray-600);
  }

  .empty-state.sm {
    padding: var(--space-6);
  }

  .empty-state.lg {
    padding: var(--space-16);
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: var(--space-4);
    opacity: 0.6;
  }

  .empty-state.sm .empty-icon {
    font-size: 2.5rem;
    margin-bottom: var(--space-3);
  }

  .empty-state.lg .empty-icon {
    font-size: 5rem;
    margin-bottom: var(--space-6);
  }

  .empty-title {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-700);
  }

  .empty-state.sm .empty-title {
    font-size: var(--text-lg);
    margin-bottom: var(--space-1);
  }

  .empty-state.lg .empty-title {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-3);
  }

  .empty-message {
    margin: 0 0 var(--space-4) 0;
    font-size: var(--text-base);
    color: var(--color-gray-500);
    max-width: 400px;
  }

  .empty-state.sm .empty-message {
    font-size: var(--text-sm);
    margin-bottom: var(--space-3);
    max-width: 300px;
  }

  .empty-state.lg .empty-message {
    font-size: var(--text-lg);
    margin-bottom: var(--space-6);
    max-width: 500px;
  }

  .empty-state button {
    margin-top: var(--space-2);
  }
</style>

