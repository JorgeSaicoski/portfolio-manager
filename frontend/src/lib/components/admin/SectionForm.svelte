<script lang="ts">
  import { sectionStore } from '$lib/stores/section';
  import { portfolioStore } from '$lib/stores/portfolio';
  import { toastStore as toast } from '$lib/stores/toast';
  import type { Section, CreateSectionRequest } from '$lib/types/api';
  import { onMount } from 'svelte';

  // Props
  export let section: Section | null = null; // null for create, object for edit
  export let portfolio_id: number;
  export let onSuccess: () => void;
  export let onCancel: () => void;

  // Form state
  let title = section?.title || '';
  let description = section?.description || '';
  let type = section?.type || '';
  let loading = false;
  let portfolioError = false;
  let portfolioName = ''; // will hold the portfolio name

  // Load portfolio name on mount
  onMount(async () => {
    try {
      // Use the store's getById method if available
      if (typeof (portfolioStore as any).getById === 'function') {
        const res = await (portfolioStore as any).getById(portfolio_id);
        // The store method may return { data: portfolio } or the portfolio directly
        const p = res?.data ?? res;
        portfolioName = p?.title ?? `Portfolio ${portfolio_id}`;
      } else if (typeof (portfolioStore as any).subscribe === 'function') {
        // Fallback: subscribe and look for currentPortfolio or an array entry
        const unsubscribe = (portfolioStore as any).subscribe((state: any) => {
          const p = state?.currentPortfolio ?? (Array.isArray(state) ? state.find((x: any) => x.ID === portfolio_id || x.id === portfolio_id) : null);
          if (p) {
            portfolioName = p.title ?? `Portfolio ${portfolio_id}`;
            unsubscribe();
          }
        });
      } else {
        portfolioName = `Portfolio ${portfolio_id}`;
      }
    } catch (err) {
      console.error('Error fetching portfolio name', err);
      portfolioName = `Portfolio ${portfolio_id}`;
    }
  });

  // Handle form submit
  async function handleSubmit(event: Event) {
    event.preventDefault();

    portfolioError = false;

    if (!type.trim()) {
      toast.error('Please enter a section type');
      return;
    }

    loading = true;

    try {
      if (section) {
        // Update existing section (portfolio cannot be changed)
        await sectionStore.update(section.ID, { title, description, type });
        toast.success('Section updated successfully!');
      } else {
        // Create new section
        const requestData: CreateSectionRequest = {
          title,
          description: description || undefined,
          type,
          portfolio_id,
        };
        await sectionStore.create(requestData);
        toast.success('Section created successfully!');
      }
      onSuccess();
    } catch (error) {
      console.error('SectionForm: Error during section operation', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        isEdit: !!section
      });
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      loading = false;
    }
  }
</script>

<div class="section-form-container">
  <div class="form-header">
    <h2>{section ? 'Edit Section' : 'Create New Section'}</h2>
    <p class="form-description">
      {section ? 'Update your section details below' : 'Fill in the details to create a new section'}
    </p>
  </div>

  <form onsubmit={handleSubmit} class="section-form">
    <div class="form-grid">
      <!-- Title -->
      <div class="form-group">
        <label for="title" class="form-label">
          Section Title <span class="required">*</span>
        </label>
        <input
          id="title"
          type="text"
          class="form-input"
          placeholder="Enter section title"
          bind:value={title}
          required
          disabled={loading}
        />
      </div>

      <!-- Portfolio -->
      <div class="form-group">
        <label for="portfolio" class="form-label">
          Portfolio <span class="required">*</span>
        </label>

        <p>Portfolio: {portfolioName || `Portfolio ${portfolio_id}`}</p>
        <input type="hidden" id="portfolio" value={portfolio_id} />

        {#if portfolioError}
          <p class="form-error">Please select a portfolio</p>
        {/if}
        <p class="form-help">Portfolio cannot be changed after creation</p>
      </div>

      <!-- Type -->
      <div class="form-group">
        <label for="type" class="form-label">
          Type <span class="required">*</span>
        </label>
        <input
          id="type"
          type="text"
          class="form-input"
          placeholder="e.g., text, image, video, list, code"
          bind:value={type}
          required
          disabled={loading}
        />
        <p class="form-help">Section type (e.g., text, image, video, list, code)</p>
      </div>

      <!-- Description -->
      <div class="form-group form-group-full">
        <label for="description" class="form-label">Description</label>
        <textarea
          id="description"
          class="form-input"
          placeholder="Describe your section (optional)..."
          rows="4"
          bind:value={description}
          disabled={loading}
        ></textarea>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-ghost" onclick={onCancel} disabled={loading}>
        Cancel
      </button>
      <button type="submit" class="btn btn-primary" disabled={loading}>
        {#if loading}
          <span class="loading-spinner"></span>
        {/if}
        {section ? 'Update' : 'Create'} Section
      </button>
    </div>
  </form>
</div>

<style>
  .section-form-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .form-header {
    margin-bottom: var(--space-8);
  }

  .form-header h2 {
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .form-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0;
  }

  .section-form {
    background-color: var(--color-white);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    padding: var(--space-8);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
    margin-bottom: var(--space-8);
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group-full {
    grid-column: 1 / -1;
  }

  .form-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-gray-700);
    margin-bottom: var(--space-2);
  }

  .required {
    color: var(--color-error);
  }

  .form-help {
    font-size: var(--text-xs);
    color: var(--color-gray-500);
    margin: var(--space-1) 0 0 0;
  }

  .form-error {
    color: var(--color-error, #ef4444);
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    padding-top: var(--space-6);
    border-top: 1px solid var(--color-gray-200);
  }

  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.6s linear infinite;
    margin-right: var(--space-2);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .section-form {
      padding: var(--space-6);
    }

    .form-header h2 {
      font-size: var(--text-2xl);
    }
  }
</style>
