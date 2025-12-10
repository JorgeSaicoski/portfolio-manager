<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { categoryStore } from "$lib/stores/category";
  import type { Category, Project } from "$lib/types/api";
  import ProjectModal from "$lib/components/admin/ProjectModal.svelte";
  import LoadingSpinner from "$lib/components/ui/LoadingSpinner.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import ProjectCard from "$lib/components/project/ProjectCard.svelte";
  import PageNavbar from "$lib/components/layout/PageNavbar.svelte";
  import CardHeader from "$lib/components/ui/CardHeader.svelte";

  // Get data from load function
  let { data }: { data: { id: number } } = $props();

  // Page parameters
  const categoryId = $derived(data.id);

  // Component state
  let category: Category | null = $state(null);
  let projects: Project[] = $state([]);
  let loading = $state(true);
  let loadingProjects = $state(false);
  let error = $state<string | null>(null);
  let showProjectModal = $state(false);


  // Load category on mount
  onMount(async () => {
    await loadCategory();
    await loadProjects();
  });

  async function loadCategory() {
    loading = true;
    error = null;

    try {
      category = await categoryStore.getById(categoryId);
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load category";
      category = null;
    } finally {
      loading = false;
    }
  }

  async function loadProjects() {
    if (!category) return;

    loadingProjects = true;
    try {
      projects = await categoryStore.getProjects(categoryId);
    } catch (err) {
      console.error("Failed to load projects:", err);
      projects = [];
    } finally {
      loadingProjects = false;
    }
  }

  // Navigation functions
  function goBack() {
    if (category?.portfolio_id) {
      goto(`/portfolios/${category.portfolio_id}`);
    } else {
      goto("/portfolios");
    }
  }

  function goToDashboard() {
    goto("/dashboard");
  }

  function goToPortfolio() {
    if (category?.portfolio_id) {
      goto(`/portfolios/${category.portfolio_id}`);
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
  <title>{category?.title || "Category"} - Portfolio Manager</title>
  <meta name="description" content="Category details and projects" />
</svelte:head>

<div class="section bg-gray-50">
  <!-- Header with navigation -->
  <PageNavbar
    breadcrumbs={[
      { label: 'Dashboard', onClick: goToDashboard },
      ...(category?.portfolio_id ? [{ label: 'Portfolio', onClick: goToPortfolio }] : []),
      { label: category?.title || 'Loading...', active: true }
    ]}
    actions={category ? [
      { label: 'Back to Portfolio', icon: 'arrow-left', onClick: goBack, variant: 'outline' }
    ] : []}
  />

  <!-- Main content -->
  <main class="main-content">
    <div class="container">
      <!-- Loading state -->
      {#if loading}
        <LoadingSpinner size="lg" text="Loading category..." />
      {/if}

      <!-- Error state -->
      {#if error && !loading}
        <div class="card">
          <div class="card-body">
            <div class="text-center">
              <svg
                width="48"
                height="48"
                class="icon-fill"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
              <h3 class="text-error">Error</h3>
              <p class="text-muted">{error}</p>
              <div class="form-row">
                <button class="btn btn-primary" onclick={loadCategory}>
                  Try Again
                </button>
                <button class="btn btn-outline" onclick={goBack}>
                  Back to Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Category details -->
      {#if category && !loading}
        <div class="container" style="max-width: 1000px;">
          <!-- Category Info Card -->
          <div class="card">
            <div class="card-header">
              <h2>{category.title}</h2>
              <p class="text-muted">Category Details</p>
            </div>

            <div class="card-body">
              <!-- Description -->
              <div class="form-group">
                <span class="form-label">Description</span>
                <p class="text-base">
                  {category.description || "No description provided"}
                </p>
              </div>

              <!-- Position -->
              <div class="form-group">
                <span class="form-label">Position</span>
                <p class="text-base">
                  <Badge variant="info">{category.position}</Badge>
                </p>
              </div>

              <!-- Portfolio -->
              {#if category.portfolio_id}
                <div class="form-group">
                  <span class="form-label">Portfolio</span>
                  <p class="text-base">
                    <button
                      class="btn btn-sm btn-outline"
                      onclick={goToPortfolio}
                    >
                      View Portfolio #{category.portfolio_id}
                    </button>
                  </p>
                </div>
              {/if}

              <!-- Metadata -->
              <div class="form-group">
                <span class="form-label">Metadata</span>
                <div class="metadata-grid">
                  <div>
                    <span class="text-muted">Created:</span>
                    <span class="text-base">{formatDate(category.CreatedAt)}</span>
                  </div>
                  <div>
                    <span class="text-muted">Updated:</span>
                    <span class="text-base">{formatDate(category.UpdatedAt)}</span>
                  </div>
                  <div>
                    <span class="text-muted">ID:</span>
                    <span class="text-base">{category.ID}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Projects in Category -->
          <div class="card" style="margin-top: var(--space-6);">
            <CardHeader
              title="Projects in this Category"
              subtitle="{projects.length} project{projects.length !== 1 ? 's' : ''}"
              actionLabel="New Project"
              actionIcon="plus"
              onAction={() => showProjectModal = true}
            />

            <div class="card-body">
              {#if loadingProjects}
                <div class="text-center" style="padding: var(--space-8);">
                  <p class="text-muted">Loading projects...</p>
                </div>
              {:else if projects.length === 0}
                <EmptyState
                  icon="📋"
                  title="No projects yet"
                  message="Projects in this category will appear here"
                  size="md"
                />
              {:else}
                <div class="projects-grid">
                  {#each projects as project (project.ID)}
                    <ProjectCard {project} />
                  {/each}
                </div>
              {/if}
             </div>
          </div>
        </div>
      {/if}
    </div>
  </main>
</div>

{#if showProjectModal}
  <ProjectModal
    project={null}
    category_id={categoryId}
    onClose={() => showProjectModal = false}
    onSuccess={loadProjects}
  />
{/if}

