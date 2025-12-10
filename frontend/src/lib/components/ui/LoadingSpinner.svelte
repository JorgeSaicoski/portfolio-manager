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

<style>
  .loading-spinner-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-4);
  }

  .loading-spinner-wrapper.inline {
    display: inline-flex;
    flex-direction: row;
    padding: 0;
    gap: var(--space-2);
  }

  .loading-spinner {
    border: 3px solid var(--color-gray-200);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .loading-spinner.sm {
    border-width: 2px;
  }

  .loading-spinner.lg {
    border-width: 4px;
  }

  .loading-text {
    margin: 0;
    color: var(--color-gray-600);
    font-size: var(--text-sm);
  }

  .inline .loading-text {
    font-size: var(--text-xs);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>

