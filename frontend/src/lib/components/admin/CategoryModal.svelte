<script lang="ts">
  import { categoryStore } from '$lib/stores/category';
  import { portfolioStore } from '$lib/stores/portfolio';
  import { toastStore as toast } from '$lib/stores/toast';
  import { onMount } from 'svelte';
  import type { Category } from '$lib/types/api';

  // Props
  let { category = null, onClose, onSuccess }: {
    category?: Category | null;
    onClose: () => void;
    onSuccess: () => void;
  } = $props();

  // Form state
  let title = $state(category?.title || '');
  let description = $state(category?.description || '');
  let portfolio_id = $state<number | string>(category?.portfolio_id || 0);
  let loading = $state(false);
  let portfolios = $state<any[]>([]);
  let portfolioError = $state(false);

  // Load portfolios for selection
  onMount(async () => {
    try {
      const loadedPortfolios = await portfolioStore.getOwn(1, 100);
      portfolios = loadedPortfolios;
      console.log('CategoryModal: Portfolios loaded', {
        count: portfolios.length,
        portfolios: portfolios,
        fullPortfolioObjects: portfolios.map(p => {
          console.log('Portfolio object:', p);
          return p;
        })
      });
    } catch (error) {
      console.error('CategoryModal: Error loading portfolios', error);
      toast.error('Failed to load portfolios');
    }
  });

  // Track portfolio selection changes
  $effect(() => {
    console.log('CategoryModal: portfolio_id changed', {
      portfolio_id,
      type: typeof portfolio_id,
      isZero: portfolio_id === 0,
      isFalsy: !portfolio_id
    });
  });

  // Handle form submit
  async function handleSubmit(event: Event) {
    event.preventDefault();

    // Convert to number if it's a string
    const portfolioIdNum = typeof portfolio_id === 'string' ? parseInt(portfolio_id, 10) : portfolio_id;

    console.log('CategoryModal: Form submitted', {
      title,
      description,
      portfolio_id,
      portfolio_id_type: typeof portfolio_id,
      portfolioIdNum,
      portfolioIdNum_type: typeof portfolioIdNum,
      isEdit: !!category
    });

    if (!portfolioIdNum || portfolioIdNum === 0) {
      console.error('CategoryModal: No portfolio selected', {
        portfolio_id,
        portfolioIdNum,
        availablePortfolios: portfolios.map(p => p.id)
      });
      portfolioError = true;
      toast.error('Please select a portfolio');
      return;
    }

    portfolioError = false;
    loading = true;

    try {
      if (category) {
        // Update existing category (portfolio cannot be changed)
        console.log('CategoryModal: Updating category', {
          categoryID: category.ID,
          data: { title, description }
        });
        const result = await categoryStore.update(category.ID, { title, description });
        console.log('CategoryModal: Category updated successfully', result);
        toast.success('Category updated successfully!');
      } else {
        // Create new category
        const requestData = { title, description, portfolio_id: portfolioIdNum };
        console.log('CategoryModal: Creating category with data:', requestData);
        const result = await categoryStore.create(requestData);
        console.log('CategoryModal: Category created successfully', result);
        toast.success('Category created successfully!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('CategoryModal: Error during category operation', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        isEdit: !!category
      });
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

  .form-input.error {
    border-color: var(--color-error, #ef4444);
  }

  .form-error {
    color: var(--color-error, #ef4444);
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
</style>

<div class="modal show" onclick={onClose} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && onClose()}>
  <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
    <div class="modal-header">
      <h3>{category ? 'Edit Category' : 'Create New Category'}</h3>
      <button class="modal-close" onclick={onClose} aria-label="Close modal">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <form onsubmit={handleSubmit}>
      <div class="modal-body">
        <div class="form-group">
          <label for="portfolio" class="form-label">Portfolio *</label>
          <select
            id="portfolio"
            class="form-input"
            class:error={portfolioError}
            value={portfolio_id}
            onchange={(e) => {
              const target = e.target as HTMLSelectElement;
              portfolio_id = parseInt(target.value, 10);
              console.log('CategoryModal: Select changed', {
                rawValue: target.value,
                parsedValue: portfolio_id,
                type: typeof portfolio_id
              });
            }}
            required
            disabled={loading || !!category}
          >
            <option value="0">Select a portfolio</option>
            {#each portfolios as p}
              <option value={p.id}>{p.title}</option>
            {/each}
          </select>
          {#if portfolioError}
            <p class="form-error">Please select a portfolio</p>
          {/if}
          {#if category}
            <p class="form-hint">Portfolio cannot be changed after creation</p>
          {/if}
        </div>

        <div class="form-group">
          <label for="title" class="form-label">Category Name *</label>
          <input
            id="title"
            type="text"
            class="form-input"
            placeholder="Category Name"
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
            placeholder="Description (optional)"
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
          {category ? 'Update' : 'Create'} Category
        </button>
      </div>
    </form>
  </div>
</div>
