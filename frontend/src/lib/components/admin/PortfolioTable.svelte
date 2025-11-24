<script lang="ts">
  import { onMount } from 'svelte';
  import { portfolioStore, type Portfolio } from '$lib/stores/portfolio';
  import { goto } from '$app/navigation';

  // Props
  export let onEdit: (portfolio: Portfolio) => void;
  export let onDelete: (id: number) => void;

  // State
  let portfolios: Portfolio[] = [];
  let loading = true;

  // Load portfolios
  onMount(async () => {
    try {
      const data = await portfolioStore.getOwn(1, 100);
      portfolios = data || [];
      console.log('[PortfolioTable.svelte] onMount - loaded portfolios:', portfolios);
    } catch (error) {
      console.error('[PortfolioTable.svelte] Error loading portfolios:', error);
    } finally {
      loading = false;
    }
  });

  // Reactive debug when portfolios change
  $: if (portfolios) {
    console.debug('[PortfolioTable.svelte] portfolios changed - count:', portfolios.length);
  }

  // View helper with debug
  function viewPortfolio(p: Portfolio) {
    console.log('[PortfolioTable.svelte] viewPortfolio - navigating to portfolio:', p);
    goto(`/portfolios/${p.ID}`);
  }

  // Format date
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<div class="data-table-wrapper">
  <div class="table-header">
    <h3>Your Portfolios</h3>
  </div>

  {#if loading}
    <div class="table-empty">
      <p>Loading portfolios...</p>
    </div>
  {:else if portfolios.length === 0}
    <div class="table-empty">
      <div class="empty-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h4>No portfolios yet</h4>
      <p>Create your first portfolio to get started</p>
    </div>
  {:else}
    <table class="data-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Description</th>
          <th>Created</th>
          <th>Updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each portfolios as portfolio}
          <tr>
            <td>{portfolio.title}</td>
            <td>{portfolio.description || 'No description'}</td>
            <td>{formatDate(portfolio.CreatedAt)}</td>
            <td>{formatDate(portfolio.UpdatedAt)}</td>
            <td>
              <div class="table-actions">
                <button class="btn-icon view" onclick={() => viewPortfolio(portfolio)} aria-label="View portfolio">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button class="btn-icon edit" onclick={() => { console.log('[PortfolioTable.svelte] edit clicked:', portfolio); onEdit(portfolio); }} aria-label="Edit portfolio">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="btn-icon delete" onclick={() => { console.log('[PortfolioTable.svelte] delete clicked id:', portfolio.ID); onDelete(portfolio.ID); }} aria-label="Delete portfolio">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
