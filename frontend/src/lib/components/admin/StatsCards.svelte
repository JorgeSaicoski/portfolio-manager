<script lang="ts">
  import { onMount } from 'svelte';
  import { portfolioStore } from '$lib/stores/portfolio';
  import { categoryStore } from '$lib/stores/category';
  import { projectStore } from '$lib/stores/project';
  import { sectionStore } from '$lib/stores/section';

  // Stats state
  let portfolioCount = 0;
  let categoryCount = 0;
  let projectCount = 0;
  let sectionCount = 0;
  let loading = true;

  // Load stats on mount
  onMount(async () => {
    try {
      // Fetch all data in parallel
      const [portfolios, categories, projects, sections] = await Promise.all([
        portfolioStore.getOwn(1, 100).catch(() => []),
        categoryStore.getOwn(1, 100).catch(() => []),
        projectStore.getOwn(1, 100).catch(() => []),
        sectionStore.getOwn(1, 100).catch(() => [])
      ]);

      portfolioCount = portfolios?.length || 0;
      categoryCount = categories?.length || 0;
      projectCount = projects?.length || 0;
      sectionCount = sections?.length || 0;
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      loading = false;
    }
  });
</script>

<div class="stats-grid">
  <!-- Total Portfolios -->
  <div class="stat-card">
    <div class="stat-content">
      <div class="stat-icon blue">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <div class="stat-details">
        <p class="stat-label">Total Portfolios</p>
        <p class="stat-value">{loading ? '...' : portfolioCount}</p>
      </div>
    </div>
  </div>

  <!-- Active Projects -->
  <div class="stat-card">
    <div class="stat-content">
      <div class="stat-icon green">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div class="stat-details">
        <p class="stat-label">Active Projects</p>
        <p class="stat-value">{loading ? '...' : projectCount}</p>
      </div>
    </div>
  </div>

  <!-- Categories -->
  <div class="stat-card">
    <div class="stat-content">
      <div class="stat-icon yellow">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </div>
      <div class="stat-details">
        <p class="stat-label">Categories</p>
        <p class="stat-value">{loading ? '...' : categoryCount}</p>
      </div>
    </div>
  </div>

  <!-- Sections -->
  <div class="stat-card">
    <div class="stat-content">
      <div class="stat-icon purple">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </div>
      <div class="stat-details">
        <p class="stat-label">Sections</p>
        <p class="stat-value">{loading ? '...' : sectionCount}</p>
      </div>
    </div>
  </div>
</div>
