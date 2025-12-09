<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { portfolioStore } from '$lib/stores/portfolio';
  import { projectStore } from '$lib/stores/project';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
  import AdminTopBar from '$lib/components/admin/AdminTopBar.svelte';
  import StatsCards from '$lib/components/admin/StatsCards.svelte';
  import QuickActions from '$lib/components/admin/QuickActions.svelte';
  import RecentItems from '$lib/components/admin/RecentItems.svelte';
  import PortfolioModal from '$lib/components/admin/PortfolioModal.svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  // Auth state
  let user = $derived($auth.user);
  let isAuthenticated = $derived($auth.isAuthenticated);

  // UI state
  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);
  let showPortfolioModal = $state(false);
  let selectedPortfolio: any = $state(null);

  // Load sidebar state from localStorage
  onMount(() => {
    if (browser) {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        sidebarCollapsed = saved === 'true';
      }
    }
  });

  // Toggle sidebar collapsed state and persist
  function toggleSidebarCollapse() {
    sidebarCollapsed = !sidebarCollapsed;
    if (browser) {
      localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
    }
  }

  // Modal handlers
  function handlePortfolioClick() {
    selectedPortfolio = null;
    showPortfolioModal = true;
  }

  function handleProjectClick() {
    goto('/projects/new');
  }

  function handleCategoryClick() {
    goto('/categories');
  }

  function handleSectionClick() {
    goto('/sections');
  }

  function closePortfolioModal() {
    showPortfolioModal = false;
    selectedPortfolio = null;
  }

  async function handlePortfolioSuccess() {
    // Reload portfolio data
    await portfolioStore.getOwn(1, 10);
  }

  async function handleEditPortfolio(id: number) {
    // Load the portfolio and open modal for editing
    try {
      const portfolios = await portfolioStore.getOwn(1, 100);
      const portfolio = portfolios.find((p: any) => p.ID === id);
      if (portfolio) {
        selectedPortfolio = portfolio;
        showPortfolioModal = true;
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  }

  async function handleDeletePortfolio(id: number) {
    if (confirm('Are you sure you want to delete this portfolio?')) {
      try {
        await portfolioStore.delete(id);
      } catch (error) {
        console.error('Error deleting portfolio:', error);
      }
    }
  }

  function handleEditProject(id: number) {
    goto(`/projects/${id}/edit`);
  }

  async function handleDeleteProject(id: number) {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await projectStore.delete(id);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  }
</script>

{#if isAuthenticated && user}
  <div class="admin-layout">
    <!-- Sidebar -->
    <AdminSidebar
      {user}
      isOpen={sidebarOpen}
      isCollapsed={sidebarCollapsed}
      onClose={() => sidebarOpen = false}
      onToggleCollapse={toggleSidebarCollapse}
    />

    <!-- Main Content -->
    <div class="admin-main" class:sidebar-collapsed={sidebarCollapsed}>
      <!-- Top Bar -->
      <AdminTopBar
        {user}
        pageTitle="Welcome back, {user.preferred_username}!"
        onMenuToggle={() => sidebarOpen = !sidebarOpen}
      />

      <!-- Content -->
      <main class="admin-content">
        <!-- Stats Cards -->
        <StatsCards />

        <!-- Quick Actions -->
        <QuickActions
          onPortfolioClick={handlePortfolioClick}
          onProjectClick={handleProjectClick}
          onCategoryClick={handleCategoryClick}
          onSectionClick={handleSectionClick}
        />

        <!-- Recent Items -->
        <RecentItems
          onEditPortfolio={handleEditPortfolio}
          onDeletePortfolio={handleDeletePortfolio}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
        />
      </main>
    </div>
  </div>

  <!-- Modals -->
  {#if showPortfolioModal}
    <PortfolioModal
      portfolio={selectedPortfolio}
      onClose={closePortfolioModal}
      onSuccess={handlePortfolioSuccess}
    />
  {/if}
{:else}
  <div>Dashboard loading user... Auth: {isAuthenticated}, User: {user}</div>
{/if}
