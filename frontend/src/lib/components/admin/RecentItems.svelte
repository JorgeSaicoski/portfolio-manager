<script lang="ts">
  import { onMount } from 'svelte';
  import { portfolioStore, type Portfolio } from '$lib/stores/portfolio';
  import { projectStore, type Project } from '$lib/stores/project';

  // Props
  export let onEditPortfolio: (id: number) => void;
  export let onDeletePortfolio: (id: number) => void;
  export let onEditProject: (id: number) => void;
  export let onDeleteProject: (id: number) => void;

  // State
  let recentPortfolios: Portfolio[] = [];
  let recentProjects: Project[] = [];
  let loading = true;

  // Load recent items
  onMount(async () => {
    try {
      const [portfolios, projects] = await Promise.all([
        portfolioStore.getOwn(1, 5).catch(() => []),
        projectStore.getOwn(1, 5).catch(() => [])
      ]);

      recentPortfolios = (portfolios || []).slice(0, 2);
      recentProjects = (projects || []).slice(0, 2);
    } catch (error) {
      console.error('Error loading recent items:', error);
    } finally {
      loading = false;
    }
  });

  // Format date helper
  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Less than an hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  }
</script>

<div class="recent-items">
  <!-- Recent Portfolios -->
  <div class="recent-list">
    <div class="list-header">
      <h3>Recent Portfolios</h3>
      <a href="/portfolios" class="view-all-link">View All</a>
    </div>
    <div class="list-content">
      {#if loading}
        <p class="text-muted">Loading...</p>
      {:else if recentPortfolios.length === 0}
        <p class="text-muted">No portfolios yet</p>
      {:else}
        <div class="list-items">
          {#each recentPortfolios as portfolio}
            <div class="recent-item">
              <div class="item-info">
                <h4 class="item-title">{portfolio.title}</h4>
                <p class="item-meta">Updated {formatTimeAgo(portfolio.UpdatedAt)}</p>
              </div>
              <div class="item-actions">
                <button class="btn-icon edit" onclick={() => onEditPortfolio(portfolio.ID)} aria-label="Edit portfolio">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="btn-icon delete" onclick={() => onDeletePortfolio(portfolio.ID)} aria-label="Delete portfolio">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Recent Projects -->
  <div class="recent-list">
    <div class="list-header">
      <h3>Recent Projects</h3>
      <a href="/projects" class="view-all-link">View All</a>
    </div>
    <div class="list-content">
      {#if loading}
        <p class="text-muted">Loading...</p>
      {:else if recentProjects.length === 0}
        <p class="text-muted">No projects yet</p>
      {:else}
        <div class="list-items">
          {#each recentProjects as project}
            <div class="recent-item">
              <div class="item-info">
                <h4 class="item-title">{project.title}</h4>
                <p class="item-meta">{project.description?.substring(0, 50) || 'No description'}{project.description && project.description.length > 50 ? '...' : ''}</p>
              </div>
              <div class="item-actions">
                <button class="btn-icon edit" onclick={() => onEditProject(project.ID)} aria-label="Edit project">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="btn-icon delete" onclick={() => onDeleteProject(project.ID)} aria-label="Delete project">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
