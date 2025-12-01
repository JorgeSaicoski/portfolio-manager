<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { categoryStore } from "$lib/stores/category";
  import type { Category, Project } from "$lib/types/api";

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
              <h3>Projects in this Category</h3>
              <p class="text-muted">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
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
                       {#if project.Images && project.Images.length > 0}
                         {@const mainImage = project.Images.find(img => img.is_main) || project.Images[0]}
                         <div class="project-image">
                           <img src={mainImage.thumbnail_url || mainImage.url} alt={mainImage.alt || project.title} />
                         </div>
                       {:else}
                         <div class="project-image-placeholder">
                           <svg class="icon-stroke" width="48" height="48" viewBox="0 0 24 24">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                         </div>
                       {/if}
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

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-4);
  }

  .project-card {
    background: var(--color-gray-50);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    display: block;
  }

  .project-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .project-image {
    width: 100%;
    height: 180px;
    overflow: hidden;
  }

  .project-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .project-image-placeholder {
    width: 100%;
    height: 180px;
    background: var(--color-gray-200);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-gray-400);
  }

  .project-info {
    padding: var(--space-4);
  }

  .project-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .project-description {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-3) 0;
    /* Modern multiline clamp (vendor prefixed) with a standard hint and good fallbacks */
    line-clamp: 2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    /* Fallbacks for non-WebKit browsers */
    overflow: hidden;
    text-overflow: ellipsis;
    display: block; /* ensure block layout when -webkit-box isn't supported */
    max-height: calc(2 * 1.2em); /* approximate two lines as a graceful fallback */
  }

  .project-skills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .skill-tag {
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-2);
    background: white;
    color: var(--color-gray-700);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-gray-300);
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

  .card-header h3 {
    margin: 0 0 var(--space-1) 0;
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
  }

  .card-body {
    padding: var(--space-6);
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

    .projects-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
