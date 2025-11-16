<script lang="ts">
  import Toast from './Toast.svelte';
  import { toastStore } from '$lib/stores/toast';

  $: toasts = $toastStore;
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <Toast
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      onClose={() => toastStore.remove(toast.id)}
    />
  {/each}
</div>

<style lang="scss">
  .toast-container {
    position: fixed;
    top: var(--space-4);
    right: var(--space-4);
    z-index: 1100;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    pointer-events: none;

    :global(.toast) {
      pointer-events: auto;
    }
  }

  @media (max-width: 640px) {
    .toast-container {
      top: var(--space-2);
      right: var(--space-2);
      left: var(--space-2);
    }
  }
</style>
