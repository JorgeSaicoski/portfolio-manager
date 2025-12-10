<script lang="ts">
    import { categoryStore } from '$lib/stores/category';
    import { portfolioStore } from '$lib/stores/portfolio';
    import { toastStore as toast } from '$lib/stores/toast';
    import { onMount } from 'svelte';
    import type { Category } from '$lib/types/api';
    import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

    // Props
    export let category: Category | null = null;
    export let portfolio_id: number;
    export let onClose: () => void;
    export let onSuccess: () => void;

    // Form state
    let title = category?.title || '';
    let description = category?.description || '';
    let loading = false;
    let portfolioError = false;
    let portfolioName = ''; // will hold the portfolio name

    // Keep local form values in sync if `category` prop changes
    $: if (category) {
        title = category.title ?? title;
        description = category.description ?? description;
    }

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
        loading = true;

        try {
            if (category) {
                // Update existing category (portfolio cannot be changed)
                const result = await categoryStore.update(category.ID, { title, description });
                toast.success('Category updated successfully!');
            } else {
                // Create new category
                const requestData = { title, description, portfolio_id };
                const result = await categoryStore.create(requestData);
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

                    <p>Portfolio: {portfolioName || `Portfolio ${portfolio_id}`}</p>
                    <input type="hidden" id="portfolio" value={portfolio_id} />

                    {#if portfolioError}
                        <p class="form-error">Please select a portfolio</p>
                    {/if}
                    <p class="form-hint">Portfolio cannot be changed after creation</p>
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
                        <LoadingSpinner size="sm" inline />
                    {/if}
                    {category ? 'Update' : 'Create'} Category
                </button>
            </div>
        </form>
    </div>
</div>
