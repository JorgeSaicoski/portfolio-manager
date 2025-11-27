<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { sectionStore } from "$lib/stores/section";
  import type { Section } from "$lib/types/api";

  // Get data from load function
  let { data }: { data: { id: number } } = $props();

  // Page parameters
  const sectionId = $derived(data.id);

  // Component state
  let section: Section | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Load section on mount
  onMount(async () => {
    await loadSection();
  });

  async function loadSection() {
    loading = true;
    error = null;

    try {
      section = await sectionStore.getById(sectionId);
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load section";
      section = null;
    } finally {
      loading = false;
    }
  }

  // Navigation functions
  function goBack() {
    goto("/sections");
  }

  function goToDashboard() {
    goto("/dashboard");
  }

  function goToPortfolio() {
    if (section?.portfolio_id) {
      goto(`/portfolios/${section.portfolio_id}`);
    }
  }

  // Format date helper
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<svelte:head>
  <title>{section?.title || "Section"} - Portfolio Manager</title>
  <meta name="description" content="Section details and management" />
</svelte:head>

<div class="section bg-gray-50">
  <!-- Header with navigation -->
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <h1 class="navbar-title">Portfolio Manager</h1>
        <div class="breadcrumb">
          <div class="breadcrumb-item">
            <button onclick={goToDashboard} class="btn btn-ghost btn-sm">
              Dashboard
            </button>
          </div>
          <div class="breadcrumb-item">
            <button onclick={goBack} class="btn btn-ghost btn-sm">
              Sections
            </button>
          </div>
          <div class="breadcrumb-item active">
            {section?.title || "Loading..."}
          </div>
        </div>
      </div>

      <div class="navbar-actions">
        {#if section}
          <button class="btn btn-outline" onclick={goBack}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Back to Sections
          </button>
          {#if section.portfolio_id}
            <button class="btn btn-primary" onclick={goToPortfolio}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l-5.5 9h11z M12 22l5.5-9h-11z M5.5 11L12 2 18.5 11z" />
              </svg>
              View Portfolio
            </button>
          {/if}
        {/if}
      </div>
    </div>
  </nav>

  <!-- Main content -->
  <main class="main-content">
    <div class="container">
      <!-- Loading state -->
      {#if loading}
        <div class="text-center">
          <div class="loading-spinner"></div>
          <p class="text-muted">Loading section...</p>
        </div>
      {/if}

      <!-- Error state -->
      {#if error && !loading}
        <div class="card">
          <div class="card-body">
            <div class="text-center">
              <svg
                width="48"
                height="48"
                fill="currentColor"
                viewBox="0 0 24 24"
                class="text-error"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
              <h3 class="text-error">Error</h3>
              <p class="text-muted">{error}</p>
              <div class="form-row">
                <button class="btn btn-primary" onclick={loadSection}>
                  Try Again
                </button>
                <button class="btn btn-outline" onclick={goBack}>
                  Back to Sections
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Section details -->
      {#if section && !loading}
        <div class="container" style="max-width: 800px;">
          <div class="card">
            <div class="card-header">
              <h2>{section.title}</h2>
              <p class="text-muted">Section Details</p>
            </div>

            <div class="card-body">
              <!-- Description -->
              <div class="form-group">
                <label class="form-label">Description</label>
                <p class="text-base">
                  {section.description || "No description provided"}
                </p>
              </div>

              <!-- Type -->
              <div class="form-group">
                <label class="form-label">Type</label>
                <p class="text-base">
                  <span class="badge">{section.type || "text"}</span>
                </p>
              </div>

              <!-- Position -->
              <div class="form-group">
                <label class="form-label">Position</label>
                <p class="text-base">{section.position}</p>
              </div>

              <!-- Portfolio -->
              <div class="form-group">
                <label class="form-label">Portfolio</label>
                <p class="text-base">
                  <button
                    class="btn btn-sm btn-outline"
                    onclick={goToPortfolio}
                  >
                    View Portfolio #{section.portfolio_id}
                  </button>
                </p>
              </div>

              <!-- Metadata -->
              <div class="form-group">
                <label class="form-label">Metadata</label>
                <div class="metadata-grid">
                  <div>
                    <span class="text-muted">Created:</span>
                    <span class="text-base">{formatDate(section.CreatedAt)}</span>
                  </div>
                  <div>
                    <span class="text-muted">Updated:</span>
                    <span class="text-base">{formatDate(section.UpdatedAt)}</span>
                  </div>
                  <div>
                    <span class="text-muted">ID:</span>
                    <span class="text-base">{section.ID}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button class="btn btn-outline" onclick={goBack}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Back to Sections
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </main>
</div>

<style>
  .metadata-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }

  .metadata-grid > div {
    display: flex;
    gap: var(--space-2);
  }

  .badge {
    display: inline-block;
    padding: var(--space-1) var(--space-3);
    background: var(--color-primary-100);
    color: var(--color-primary-700);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 500;
  }

  .navbar {
    background: white;
    border-bottom: 1px solid var(--color-gray-200);
    padding: var(--space-4) 0;
  }

  .navbar-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-4);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
  }

  .navbar-brand {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .navbar-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
  }

  .breadcrumb-item:not(:last-child)::after {
    content: "/";
    margin-left: var(--space-2);
    color: var(--color-gray-400);
  }

  .breadcrumb-item.active {
    color: var(--color-gray-900);
    font-weight: 500;
  }

  .navbar-actions {
    display: flex;
    gap: var(--space-2);
  }

  .main-content {
    padding: var(--space-8) 0;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-4);
  }

  .text-center {
    text-align: center;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    margin: var(--space-4) auto;
    border: 4px solid var(--color-gray-200);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .text-muted {
    color: var(--color-gray-600);
  }

  .text-base {
    color: var(--color-gray-900);
  }

  .text-error {
    color: var(--color-error);
  }

  .card {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: var(--space-6);
  }

  .card-header {
    padding: var(--space-6);
    border-bottom: 1px solid var(--color-gray-200);
  }

  .card-header h2 {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-2xl);
    font-weight: 600;
    color: var(--color-gray-900);
  }

  .card-body {
    padding: var(--space-6);
  }

  .card-footer {
    padding: var(--space-6);
    border-top: 1px solid var(--color-gray-200);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
  }

  .form-group {
    margin-bottom: var(--space-6);
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  .form-label {
    display: block;
    margin-bottom: var(--space-2);
    font-weight: 500;
    color: var(--color-gray-700);
  }

  .form-row {
    display: flex;
    gap: var(--space-2);
    justify-content: center;
    margin-top: var(--space-4);
  }

  @media (max-width: 768px) {
    .navbar-container {
      flex-direction: column;
      align-items: flex-start;
    }

    .navbar-actions {
      width: 100%;
      flex-wrap: wrap;
    }

    .breadcrumb {
      flex-wrap: wrap;
    }
  }
</style>
