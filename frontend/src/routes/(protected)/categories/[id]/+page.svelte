<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { categoryStore } from "$lib/stores/category";
  import type { Category, Project } from "$lib/types/api";
  import ProjectModal from "$lib/components/admin/ProjectModal.svelte";

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

  // Keyboard handler for project cards moved here to avoid inline casting issues
  function handleProjectKeydown(e: KeyboardEvent) {
    const key = e.key;
    if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      // e.currentTarget may be typed as EventTarget; cast to HTMLElement then click
      const target = e.currentTarget as unknown as HTMLAnchorElement | null;
      target?.click();
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
          {#if category?.portfolio_id}
            <div class="breadcrumb-item">
              <button onclick={goToPortfolio} class="btn btn-ghost btn-sm">
                Portfolio
              </button>
            </div>
          {/if}
          <div class="breadcrumb-item active">
            {category?.title || "Loading..."}
          </div>
        </div>
      </div>

      <div class="navbar-actions">
        {#if category}
          <button class="btn btn-outline" onclick={goBack}>
            <svg class="icon-fill" width="16" height="16" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Back to Portfolio
          </button>
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
          <p class="text-muted">Loading category...</p>
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
                  <span class="badge">{category.position}</span>
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
            <div class="card-header">
              <div>
                <h3>Projects in this Category</h3>
                <p class="text-muted">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
              </div>
              <button class="btn btn-primary btn-sm" onclick={() => showProjectModal = true}>
                <svg class="icon-stroke" width="16" height="16" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
            </div>

            <div class="card-body">
              {#if loadingProjects}
                <div class="text-center" style="padding: var(--space-8);">
                  <p class="text-muted">Loading projects...</p>
                </div>
              {:else if projects.length === 0}
                <div class="text-center" style="padding: var(--space-8);">
                  <svg class="empty-icon icon-stroke" width="48" height="48" viewBox="0 0 24 24" style="margin: 0 auto var(--space-3) auto; color: var(--color-gray-400);">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4>No projects yet</h4>
                  <p class="text-muted">Projects in this category will appear here</p>
                </div>
              {:else}
                <div class="projects-grid">
                  {#each projects as project (project.ID)}
                    <!--
                      Intentionally using a native <a> element for project cards.
                      Anchors are keyboard-accessible by default and are the
                      semantically-correct element for navigation. svelte-check
                      may conservatively flag interactive blocks in complex
                      templates; this is a benign false-positive in our case.
                    -->
                    <a
                      class="project-card"
                      href={`/projects/${project.ID}`}
                      aria-label={`Open project ${project.title}`}
                      onkeydown={handleProjectKeydown}
                    >
                       <div class="project-info">
                         <h4 class="project-title">{project.title}</h4>
                         <p class="project-description">{project.description}</p>
                         {#if project.skills && project.skills.length > 0}
                           <div class="project-skills">
                             {#each project.skills.slice(0, 3) as skill}
                               <span class="skill-tag">{skill}</span>
                             {/each}
                             {#if project.skills.length > 3}
                               <span class="skill-tag">+{project.skills.length - 3}</span>
                             {/if}
                           </div>
                         {/if}
                       </div>
                     </a>
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

