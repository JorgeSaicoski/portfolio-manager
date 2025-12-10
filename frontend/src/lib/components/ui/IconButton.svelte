<script lang="ts">
  /**
   * IconButton Component
   * Reusable icon button with predefined icon types
   * Used for common actions: edit, delete, view
   */

  type ButtonType = 'edit' | 'delete' | 'view';
  type ButtonSize = 'sm' | 'md' | 'lg';

  interface Props {
    type: ButtonType;
    onclick: () => void;
    label: string;
    size?: ButtonSize;
    disabled?: boolean;
    title?: string;
  }

  let {
    type,
    onclick,
    label,
    size = 'md',
    disabled = false,
    title = label
  }: Props = $props();

  // Build CSS classes
  const buttonClass = $derived(
    [
      'btn-icon',
      type === 'edit' ? 'edit' : type === 'delete' ? 'delete' : type === 'view' ? 'view' : '',
      size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
    ].filter(Boolean).join(' ')
  );
</script>

<button
  class={buttonClass}
  {onclick}
  aria-label={label}
  {title}
  {disabled}
>
  {#if type === 'edit'}
    <!-- Edit/Pencil Icon -->
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  {:else if type === 'delete'}
    <!-- Trash/Delete Icon -->
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  {:else if type === 'view'}
    <!-- Eye/View Icon -->
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  {/if}
</button>

<!-- All styles are in /src/lib/styles/components/_buttons.scss -->

