<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { portfolioStore, type Portfolio } from "$lib/stores/portfolio";
  import { auth } from "$lib/stores/auth";

  // Component state
  let portfolios: Portfolio[] = [];
  let loading = false;
  let error: string | null = null;

  // Reactive statements
  $: ({
    portfolios: storePortfolios,
    loading: storeLoading,
    error: storeError,
  } = $portfolioStore);
  $: portfolios = storePortfolios;
  $: loading = storeLoading;
  $: error = storeError;
  $: user = $auth.user;

  // Load portfolios on mount
  onMount(async () => {
    try {
      await portfolioStore.getOwn();
    } catch (err) {
      console.error("Error loading portfolios:", err);
    }
  });

  // Navigation functions
  function goToCreatePortfolio() {
    goto("/portfolios/create");
  }

  function goToPortfolio(id: number) {
    goto(`/portfolios/${id}`);
  }

  function goToDashboard() {
    goto("/dashboard");
  }

  // Format date helper
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
</script>

<svelte:head>
  <title>Portfolios - Portfolio Manager</title>
  <meta name="description" content="Manage your portfolios" />
</svelte:head>

<div class="section bg-gray-50">
  <!-- Header with navigation -->
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <h1 class="navbar-title">Portfolio Manager</h1>
        <div class="breadcrumb">
          <div class="breadcrumb-item">
            <button on:click={goToDashboard} class="btn btn-ghost btn-sm"
              >Dashboard</button
            >
          </div>
          <div class="breadcrumb-item active">Portfolios</div>
        </div>
      </div>

      <div class="navbar-actions">
        <button
          class="btn btn-primary"
          on:click={goToCreatePortfolio}
          disabled={loading}
        >
          Create Portfolio
        </button>
      </div>
    </div>
  </nav>

  <!-- Main content -->
  <main class="main-content">
    <div class="container">
      <!-- Page header -->
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">My Portfolios</h1>
          <p class="page-subtitle">
            Manage and organize your professional portfolios
          </p>
        </div>
      </div>

      <!-- Loading state -->
      {#if loading}
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p class="text-muted">Loading your portfolios...</p>
        </div>
      {/if}

      <!-- Error state (only for actual API errors) -->
      {#if error && !loading}
        <div class="card">
          <div class="card-body">
            <div class="error-state">
              <svg
                width="48"
                height="48"
                fill="currentColor"
                viewBox="0 0 24 24"
                class="error-icon"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
              <h3>Something went wrong</h3>
              <p class="text-muted">
                Failed to load portfolios. Please try again.
              </p>
              <button
                class="btn btn-primary"
                on:click={() => portfolioStore.getOwn()}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Empty state (when no portfolios exist) -->
      {#if !loading && !error && portfolios.length === 0}
        <div class="card">
          <div class="card-body">
            <div class="empty-state">
              <svg
                width="64"
                height="64"
                fill="currentColor"
                viewBox="0 0 24 24"
                class="empty-icon"
              >
                <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
                />
              </svg>
              <h3>No portfolios yet</h3>
              <p class="text-muted">
                Create your first portfolio to showcase your work and projects.
              </p>
              <button
                class="btn btn-primary btn-lg"
                on:click={goToCreatePortfolio}
              >
                <svg
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2v20m10-10H2" />
                </svg>
                Create Your First Portfolio
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Portfolios grid -->
      {#if !loading && !error && portfolios.length > 0}
        <div class="card-grid cols-3 animate-stagger">
          {#each portfolios as portfolio (portfolio.id)}
            <div class="card card-feature" class:protected={true}>
              <div class="card-header">
                <div class="portfolio-meta">
                  <div class="feature-icon">
                    <svg
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      />
                    </svg>
                  </div>
                  <div class="portfolio-dates">
                    <span class="text-muted text-sm">
                      Created {formatDate(portfolio.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div class="card-body">
                <h3 class="portfolio-title">{portfolio.title}</h3>
                <p class="portfolio-description text-muted">
                  {portfolio.description || "No description provided"}
                </p>

                <div class="portfolio-stats">
                  <div class="stat">
                    <span class="stat-label">Status</span>
                    <span class="stat-value text-success">Active</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Last Updated</span>
                    <span class="stat-value"
                      >{formatDate(portfolio.updated_at)}</span
                    >
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <div class="card-actions">
                  <button
                    class="btn btn-primary"
                    on:click={() => goToPortfolio(portfolio.id)}
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View Portfolio
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Pagination or load more (placeholder for future implementation) -->
        <div class="pagination-container">
          <p class="text-muted text-center">
            Showing {portfolios.length} portfolio{portfolios.length !== 1
              ? "s"
              : ""}
          </p>
        </div>
      {/if}
    </div>
  </main>
</div>
