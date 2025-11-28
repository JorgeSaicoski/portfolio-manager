<script lang="ts">
    import { sectionStore } from '$lib/stores/section';
    import { portfolioStore } from '$lib/stores/portfolio';
    import { toastStore as toast } from '$lib/stores/toast';
    import { onMount } from 'svelte';
    import type { Section } from '$lib/types/api';

    // Props
    let { section = null, portfolio_id, onClose, onSuccess }: {
        section?: Section | null;
        portfolio_id: number;
        onClose: () => void;
        onSuccess: () => void;
    } = $props();

    // Form state
    let title = $state(section?.title || '');
    let description = $state(section?.description || '');
    let type = $state(section?.type || '');
    let loading = $state(false);
    let portfolioError = $state(false);
    let portfolioName = $state(''); // will hold the portfolio name

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
            if (section) {
                // Update existing section (portfolio cannot be changed)
                console.log('SectionModal: Updating section', {
                    sectionID: section.ID,
                    data: { title, description, type }
                });
                const result = await sectionStore.update(section.ID, { title, description, type });
                console.log('SectionModal: Section updated successfully', result);
                toast.success('Section updated successfully!');
            } else {
                // Create new section
                const requestData = { title, description, type, portfolio_id };
                console.log('SectionModal: Creating section with data:', requestData);
                const result = await sectionStore.create(requestData);
                console.log('SectionModal: Section created successfully', result);
                toast.success('Section created successfully!');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('SectionModal: Error during section operation', {
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
            <h3>{section ? 'Edit Section' : 'Create New Section'}</h3>
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
                    <label for="title" class="form-label">Section Name *</label>
                    <input
                            id="title"
                            type="text"
                            class="form-input"
                            placeholder="Section Name"
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

                <div class="form-group">
                    <label for="type" class="form-label">Type</label>
                    <input
                            id="type"
                            type="text"
                            class="form-input"
                            placeholder="Section Type (optional)"
                            bind:value={type}
                            disabled={loading}
                    />
                    <p class="form-hint">e.g., hero, about, skills, projects, contact, etc.</p>
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
                    {section ? 'Update' : 'Create'} Section
                </button>
            </div>
        </form>
    </div>
</div>
