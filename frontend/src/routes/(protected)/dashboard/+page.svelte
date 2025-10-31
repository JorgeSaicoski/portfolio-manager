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

  // Auth state
  let user = $derived($auth.user);
  let isAuthenticated = $derived($auth.isAuthenticated);

  // UI state
  let sidebarOpen = false;
  let showPortfolioModal = false;
  let selectedPortfolio: any = null;

  // Modal handlers
  function handlePortfolioClick() {
    selectedPortfolio = null;
    showPortfolioModal = true;
  }

  function handleProjectClick() {
    goto('/projects');
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

  function handlePortfolioSuccess() {
    // Reload portfolio data
    portfolioStore.getOwn(1, 10);
  }

  function handleEditPortfolio(id: number) {
    // For simplicity, redirect to portfolios page
    goto(`/portfolios/${id}`);
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
    goto(`/projects/${id}`);
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
      onClose={() => sidebarOpen = false}
    />

    <!-- Main Content -->
    <div class="admin-main">
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