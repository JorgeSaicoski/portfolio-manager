<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { portfolioStore, type Portfolio } from '$lib/stores/portfolio';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
  import AdminTopBar from '$lib/components/admin/AdminTopBar.svelte';
  import PortfolioTable from '$lib/components/admin/PortfolioTable.svelte';
  import PortfolioModal from '$lib/components/admin/PortfolioModal.svelte';

  // Auth state
  let user = $derived($auth.user);

  // UI state
  let sidebarOpen = false;
  let showModal = false;
  let selectedPortfolio: Portfolio | null = null;

  // Handlers
  function handleCreate() {
    selectedPortfolio = null;
    showModal = true;
  }

  function handleEdit(portfolio: Portfolio) {
    selectedPortfolio = portfolio.ID;
    showModal = true;
  }

  async function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      try {
        await portfolioStore.delete(id);
      } catch (error) {
        console.error('Error deleting portfolio:', error);
      }
    }
  }

  function closeModal() {
    showModal = false;
    selectedPortfolio = null;
  }

  function handleSuccess() {
    portfolioStore.getOwn(1, 100);
  }
</script>

<svelte:head>
  <title>Portfolios - Portfolio Manager</title>
  <meta name="description" content="Manage your portfolios" />
</svelte:head>

{#if user}
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
        pageTitle="Portfolios"
        onMenuToggle={() => sidebarOpen = !sidebarOpen}
      />

      <!-- Content -->
      <main class="admin-content">
        <div class="section-header">
          <div class="header-title">
            <h2>Manage Portfolios</h2>
            <p>Create and manage your professional portfolios</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" on:click={handleCreate}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Portfolio
            </button>
          </div>
        </div>

        <!-- Portfolio Table -->
        <PortfolioTable
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  </div>

  <!-- Modal -->
  {#if showModal}
    <PortfolioModal
      portfolio={selectedPortfolio}
      onClose={closeModal}
      onSuccess={handleSuccess}
    />
  {/if}
{/if}
