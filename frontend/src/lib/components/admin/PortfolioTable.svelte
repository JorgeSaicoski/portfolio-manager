<script lang="ts">
  import { onMount } from 'svelte';
  import { portfolioStore, type Portfolio } from '$lib/stores/portfolio';
  import { goto } from '$app/navigation';
  import IconButton from '$lib/components/ui/IconButton.svelte';

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
    } catch (error) {
      console.error('[PortfolioTable.svelte] Error loading portfolios:', error);
    } finally {
      loading = false;
    }
  });

  // View helper
  function viewPortfolio(p: Portfolio) {
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
                <IconButton
                  type="view"
                  onclick={() => viewPortfolio(portfolio)}
                  label="View portfolio"
                />
                <IconButton
                  type="edit"
                  onclick={() => onEdit(portfolio)}
                  label="Edit portfolio"
                />
                <IconButton
                  type="delete"
                  onclick={() => onDelete(portfolio.ID)}
                  label="Delete portfolio"
                />
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
