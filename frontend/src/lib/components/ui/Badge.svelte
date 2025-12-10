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
    children?: any;
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

