<script lang="ts">
  /**
   * Badge Component
   * Reusable badge/tag component with color variants
   */

  type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  type BadgeSize = 'sm' | 'md' | 'lg';

  interface Props {
    variant?: BadgeVariant;
    size?: BadgeSize;
    rounded?: boolean;
  }

  let {
    variant = 'default',
    size = 'md',
    rounded = false,
    children
  }: Props = $props();

  // Build CSS classes
  const badgeClass = $derived(`badge badge-${variant} badge-${size} ${rounded ? 'badge-rounded' : ''}`);
</script>

<span class={badgeClass}>
  {@render children?.()}
</span>

<style>
  :global(.badge) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
    transition: all var(--transition-base);
  }

  /* Size variants */
  :global(.badge-sm) {
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
  }

  :global(.badge-md) {
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
  }

  :global(.badge-lg) {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-base);
  }

  /* Rounded variant */
  :global(.badge-rounded) {
    border-radius: var(--radius-full);
  }

  /* Color variants */
  :global(.badge-default) {
    background: var(--color-gray-100);
    color: var(--color-gray-700);
    border: 1px solid var(--color-gray-200);
  }

  :global(.badge-primary) {
    background: rgba(45, 212, 191, 0.1);
    color: var(--color-primary-dark);
    border: 1px solid rgba(45, 212, 191, 0.2);
  }

  :global(.badge-success) {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  :global(.badge-warning) {
    background: rgba(245, 158, 11, 0.1);
    color: #D97706;
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  :global(.badge-error) {
    background: rgba(239, 68, 68, 0.1);
    color: #DC2626;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  :global(.badge-info) {
    background: rgba(59, 130, 246, 0.1);
    color: #2563EB;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
</style>

