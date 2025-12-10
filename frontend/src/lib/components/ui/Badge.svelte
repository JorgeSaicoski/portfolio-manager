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
</script>

<span 
  class="badge"
  class:badge-default={variant === 'default'}
  class:badge-primary={variant === 'primary'}
  class:badge-success={variant === 'success'}
  class:badge-warning={variant === 'warning'}
  class:badge-error={variant === 'error'}
  class:badge-info={variant === 'info'}
  class:badge-sm={size === 'sm'}
  class:badge-md={size === 'md'}
  class:badge-lg={size === 'lg'}
  class:badge-rounded={rounded}
>
  {@render children?.()}
</span>

