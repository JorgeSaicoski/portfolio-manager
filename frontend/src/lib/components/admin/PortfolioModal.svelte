<script lang="ts">
  import { portfolioStore, type Portfolio } from '$lib/stores/portfolio';
  import { toastStore as toast } from '$lib/stores/toast';

  // Props
  export let portfolio: Portfolio | null = null; // null for create, object for edit
  export let onClose: () => void;
  export let onSuccess: () => void;

  // Log when modal is created / receives props
  console.log('[PortfolioModal.svelte] open - incoming portfolio prop:', portfolio);

  // Form state
  let title = portfolio?.title || '';
  let description = portfolio?.description || '';
  let loading = false;

  // Handle form submit
  async function handleSubmit(event: Event) {
    event.preventDefault();
    console.log('[PortfolioModal.svelte] submit pressed - portfolio:', portfolio, 'title:', title, 'description length:', description?.length);
    loading = true;

    try {
      if (portfolio) {
        // Update existing portfolio
        console.log('[PortfolioModal.svelte] calling portfolioStore.update id:', portfolio.ID);
        await portfolioStore.update(portfolio.ID, { title, description });
        toast.success('Portfolio updated successfully!');
        console.log('[PortfolioModal.svelte] update succeeded for id:', portfolio.ID);
      } else {
        // Create new portfolio
        console.log('[PortfolioModal.svelte] calling portfolioStore.create with payload:', { title, description });
        await portfolioStore.create({ title, description });
        toast.success('Portfolio created successfully!');
        console.log('[PortfolioModal.svelte] create succeeded');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('[PortfolioModal.svelte] submit ERROR:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      loading = false;
    }
  }
</script>

<style>
  .modal {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 1050 !important;
  }
</style>

<div class="modal show" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="button" tabindex="0">
  <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
    <div class="modal-header">
      <h3>{portfolio ? 'Edit Portfolio' : 'Create New Portfolio'}</h3>
      <button class="modal-close" onclick={onClose} aria-label="Close modal">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <form onsubmit={handleSubmit}>
      <div class="modal-body">
        <div class="form-group">
          <label for="title" class="form-label">Portfolio Name</label>
          <input
            id="title"
            type="text"
            class="form-input"
            placeholder="Portfolio Name"
            bind:value={title}
            required
            disabled={loading}
          />
        </div>

        <div class="form-group">
          <label for="description" class="form-label">Description</label>
          <textarea
            id="description"
            class="form-input"
            placeholder="Description"
            rows="3"
            bind:value={description}
            disabled={loading}
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" onclick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" disabled={loading}>
          {#if loading}
            <span class="loading-spinner"></span>
          {/if}
          {portfolio ? 'Update' : 'Create'} Portfolio
        </button>
      </div>
    </form>
  </div>
</div>
