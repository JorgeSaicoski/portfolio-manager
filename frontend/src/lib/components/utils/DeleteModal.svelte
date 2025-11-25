<script lang="ts">
  // Props
  export let isOpen = false;
  export let itemName: string = "";
  export let itemType: string = "item";
  export let onClose: () => void = () => {};
  export let onConfirm: () => Promise<void> | void = () => {};
  export let loading = false;
  export let confirmText: string = "";

  // Internal state
  let confirmInput = "";
  let error = "";

  // Handle backdrop click
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  // Handle close
  function handleClose() {
    if (loading) return;
    
    confirmInput = "";
    error = "";
    onClose();
  }

  // Handle confirm delete
  async function handleDelete() {
    if (confirmText && confirmInput !== confirmText) {
      error = `Please type "${confirmText}" to confirm`;
      return;
    }

    error = "";
    
    try {
      await onConfirm();
      handleClose();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to delete item";
    }
  }

  // Reset state when modal opens/closes
  $: if (!isOpen) {
    confirmInput = "";
    error = "";
  }

  // Check if delete button should be enabled
  $: deleteEnabled = confirmText ? confirmInput === confirmText : true;
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Modal Backdrop -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div 
    class="modal-backdrop show" 
    onclick={handleBackdropClick}
  ></div>

  <!-- Modal -->
  <div class="modal modal-confirm show">
    <div class="modal-content">
      <div class="modal-body">
        <!-- Warning Icon -->
        <div class="confirm-icon error">
          <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>

        <!-- Title -->
        <h3>Delete {itemType}</h3>

        <!-- Description -->
        <p>
          {#if itemName}
            Are you sure you want to delete <strong>"{itemName}"</strong>?
          {:else}
            Are you sure you want to delete this {itemType}?
          {/if}
          This action cannot be undone.
        </p>

        <!-- Confirmation Input (if required) -->
        {#if confirmText}
          <div class="form-group" style="text-align: left; margin: var(--space-6) 0;">
            <label class="form-label" for="delete-confirm">
              Type <strong style="font-family: var(--font-mono); background: var(--color-gray-100); padding: 2px 6px; border-radius: 4px;">{confirmText}</strong> to confirm:
            </label>
            <input
              id="delete-confirm"
              type="text"
              bind:value={confirmInput}
              placeholder="Type here to confirm"
              class="form-input"
              disabled={loading}
              autocomplete="off"
            />
          </div>
        {/if}

        <!-- Error Message -->
        {#if error}
          <div class="form-error" style="margin-top: var(--space-4);">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {error}
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer center">
        <button
          class="btn btn-ghost"
          onclick={handleClose}
          disabled={loading}
        >
          Cancel
        </button>

        <button
          class="btn"
          style="background-color: var(--color-error); color: var(--color-white); border-color: var(--color-error);"
          onclick={handleDelete}
          disabled={loading || !deleteEnabled}
        >
          {#if loading}
            <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
            Deleting...
          {:else}
            Delete {itemType}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

