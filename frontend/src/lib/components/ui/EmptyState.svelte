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

