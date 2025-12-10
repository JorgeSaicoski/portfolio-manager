<script lang="ts">
  import { onMount } from 'svelte';
  import { portfolioStore, type Portfolio } from '$lib/stores/portfolio';
  import { projectStore, type Project } from '$lib/stores/project';
  import IconButton from '$lib/components/ui/IconButton.svelte';

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
                <IconButton
                  type="edit"
                  onclick={() => onEditPortfolio(portfolio.ID)}
                  label="Edit portfolio"
                />
                <IconButton
                  type="delete"
                  onclick={() => onDeletePortfolio(portfolio.ID)}
                  label="Delete portfolio"
                />
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
                <IconButton
                  type="edit"
                  onclick={() => onEditProject(project.ID)}
                  label="Edit project"
                />
                <IconButton
                  type="delete"
                  onclick={() => onDeleteProject(project.ID)}
                  label="Delete project"
                />
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
