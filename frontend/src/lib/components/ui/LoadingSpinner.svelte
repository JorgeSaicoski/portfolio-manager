<script lang="ts">
  /**
   * LoadingSpinner Component
   * Reusable loading spinner with size variants
   */

  type SpinnerSize = 'sm' | 'md' | 'lg';

  interface Props {
    size?: SpinnerSize;
    text?: string;
    color?: string;
    inline?: boolean;
  }

  let {
    size = 'md',
    text,
    color,
    inline = false
  }: Props = $props();

  // Size mapping
  const sizeMap = {
    sm: '20px',
    md: '40px',
    lg: '60px'
  };

  const spinnerSize = $derived(sizeMap[size]);
</script>

<div class="loading-spinner-wrapper" class:inline>
  <div
    class="loading-spinner"
    class:sm={size === 'sm'}
    class:md={size === 'md'}
    class:lg={size === 'lg'}
    style:width={spinnerSize}
    style:height={spinnerSize}
    style:border-top-color={color || 'var(--color-primary)'}
  ></div>
  {#if text}
    <p class="loading-text">{text}</p>
  {/if}
</div>

