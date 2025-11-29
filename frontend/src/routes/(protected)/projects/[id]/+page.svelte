<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import { projectStore } from '$lib/stores/project';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
  import AdminTopBar from '$lib/components/admin/AdminTopBar.svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import type { Project } from '$lib/types/api';

  // Get data from load function
  let { data }: { data: { id: number } } = $props();

  // Auth state
  let user = $derived($auth.user);
  let isAuthenticated = $derived($auth.isAuthenticated);

  // UI state
  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);
  let project: Project | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Get project ID from data
  const projectId = $derived(data.id);

  // Load sidebar state and project data
  onMount(async () => {
    if (browser) {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        sidebarCollapsed = saved === 'true';
      }
    }

    // Load project data
    await loadProject();
  });

  async function loadProject() {
    try {
      loading = true;
      error = null;
      project = await projectStore.getOwnById(projectId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load project';
      console.error('Failed to load project:', err);
    } finally {
      loading = false;
    }
  }

  // Toggle sidebar collapsed state and persist
  function toggleSidebarCollapse() {
    sidebarCollapsed = !sidebarCollapsed;
    if (browser) {
      localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
    }
  }

  function handleEdit() {
    goto(`/projects/${projectId}/edit`);
  }

  function handleBack() {
    goto('/projects');
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
  <title>{project?.title || "Project"} - Portfolio Manager</title>
  <meta name="description" content="Project details" />
</svelte:head>

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
        pageTitle="Project Details"
        onMenuToggle={() => sidebarOpen = !sidebarOpen}
      />

      <!-- Content -->
      <main class="admin-content">
        {#if loading}
          <div class="loading-state">
            <div class="loading-spinner-large"></div>
            <p>Loading project...</p>
          </div>
        {:else if error}
          <div class="error-state">
            <svg class="icon-stroke" viewBox="0 0 24 24" width="48" height="48">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Error Loading Project</h3>
            <p>{error}</p>
            <div class="error-actions">
              <button class="btn btn-primary" onclick={loadProject}>
                Try Again
              </button>
              <button class="btn btn-outline" onclick={handleBack}>
                Back to Projects
              </button>
            </div>
          </div>
        {:else if project}
          <div class="project-detail-container">
            <!-- Header Actions -->
            <div class="detail-header">
              <h1>{project.title}</h1>
              <div class="header-actions">
                <button class="btn btn-outline" onclick={handleBack}>
                  <svg class="icon-fill" width="16" height="16" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                  Back
                </button>
                <button class="btn btn-primary" onclick={handleEdit}>
                  <svg class="icon-fill" width="16" height="16" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Edit Project
                </button>
              </div>
            </div>

            <!-- Images Section -->
            {#if project.Images && project.Images.length > 0}
              <div class="images-section">
                <h3>Images</h3>
                <div class="images-container">
                  <!-- Main Image -->
                  {#each project.Images as image}
                    {#if image.is_main}
                      <div class="main-image-container">
                        <img
                          src={image.url}
                          alt={image.alt || project.title}
                          class="main-image"
                          loading="lazy"
                        />
                        <p class="image-caption">{image.alt || "Main image"}</p>
                      </div>
                    {/if}
                  {/each}

                  <!-- Thumbnails -->
                  {#if project.Images.filter(img => !img.is_main).length > 0}
                    <div class="thumbnails-section">
                      <h4>Additional Images</h4>
                      <div class="thumbnails-grid">
                        {#each project.Images.filter(img => !img.is_main) as image}
                          <div class="thumbnail-item">
                            <img
                              src={image.thumbnail_url || image.url}
                              alt={image.alt || project.title}
                              class="thumbnail-image"
                              loading="lazy"
                            />
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {:else}
              <div class="no-images">
                <svg class="icon-stroke" width="48" height="48" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No images available</p>
              </div>
            {/if}

            <!-- Project Details Card -->
            <div class="detail-card">
              <h3>Project Information</h3>

              <div class="detail-grid">
                <!-- Description -->
                <div class="detail-item full-width">
                  <span class="form-label">Description</span>
                  <p class="detail-value">{project.description}</p>
                </div>

                <!-- Skills -->
                <div class="detail-item full-width">
                  <span class="form-label">Skills</span>
                  {#if project.skills && project.skills.length > 0}
                    <div class="skills-container">
                      {#each project.skills as skill}
                        <span class="skill-badge">{skill}</span>
                      {/each}
                    </div>
                  {:else}
                    <p class="detail-value text-muted">No skills listed</p>
                  {/if}
                </div>

                <!-- Client -->
                <div class="detail-item">
                  <span class="form-label">Client</span>
                  <p class="detail-value">{project.client || "-"}</p>
                </div>

                <!-- Link -->
                <div class="detail-item">
                  <span class="form-label">Project Link</span>
                  {#if project.link}
                    <a href={project.link} target="_blank" rel="noopener noreferrer" class="external-link">
                      {project.link}
                      <svg class="icon-fill" width="16" height="16" viewBox="0 0 24 24">
                        <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                      </svg>
                    </a>
                  {:else}
                    <p class="detail-value text-muted">-</p>
                  {/if}
                </div>

                <!-- Position -->
                <div class="detail-item">
                  <span class="form-label">Display Position</span>
                  <p class="detail-value">{project.position}</p>
                </div>

                <!-- Category ID -->
                <div class="detail-item">
                  <span class="form-label">Category ID</span>
                  <p class="detail-value">{project.category_id}</p>
                </div>
              </div>
            </div>

            <!-- Metadata Card -->
            <div class="detail-card">
              <h3>Metadata</h3>
              <div class="metadata-grid">
                <div class="metadata-item">
                  <span class="form-label">Project ID</span>
                  <p class="detail-value">{project.ID}</p>
                </div>
                <div class="metadata-item">
                  <span class="form-label">Created</span>
                  <p class="detail-value">{formatDate(project.CreatedAt)}</p>
                </div>
                <div class="metadata-item">
                  <span class="form-label">Last Updated</span>
                  <p class="detail-value">{formatDate(project.UpdatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </main>
    </div>
  </div>
{:else}
  <div class="auth-required">
    <h2>Authentication Required</h2>
    <p>Please log in to view this project.</p>
  </div>
{/if}

<style>
  .project-detail-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  .detail-header h1 {
    margin: 0;
    font-size: var(--text-3xl);
    font-weight: 600;
    color: var(--color-gray-900);
  }

  .header-actions {
    display: flex;
    gap: var(--space-2);
  }

  .images-section {
    background: white;
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .images-section h3 {
    margin: 0 0 var(--space-4) 0;
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
  }

  .main-image-container {
    margin-bottom: var(--space-6);
  }

  .main-image {
    width: 100%;
    height: auto;
    max-height: 500px;
    object-fit: cover;
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .image-caption {
    margin-top: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    text-align: center;
  }

  .thumbnails-section h4 {
    margin: 0 0 var(--space-3) 0;
    font-size: var(--text-base);
    font-weight: 500;
    color: var(--color-gray-700);
  }

  .thumbnails-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space-3);
  }

  .thumbnail-image {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: var(--radius-md);
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s;
  }

  .thumbnail-image:hover {
    border-color: var(--color-primary);
  }

  .no-images {
    background: white;
    border-radius: var(--radius-lg);
    padding: var(--space-8);
    margin-bottom: var(--space-6);
    text-align: center;
    color: var(--color-gray-500);
  }

  .no-images svg {
    margin: 0 auto var(--space-3) auto;
  }

  .detail-card {
    background: white;
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .detail-card h3 {
    margin: 0 0 var(--space-4) 0;
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .detail-item.full-width {
    grid-column: 1 / -1;
  }

  .detail-item label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-gray-700);
  }

  .detail-value {
    margin: 0;
    font-size: var(--text-base);
    color: var(--color-gray-900);
  }

  .detail-value.text-muted {
    color: var(--color-gray-500);
  }

  .skills-container {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .skill-badge {
    display: inline-block;
    padding: var(--space-1) var(--space-3);
    background: var(--color-primary-100);
    color: var(--color-primary-700);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 500;
  }

  .external-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-primary);
    text-decoration: none;
    font-size: var(--text-base);
  }

  .external-link:hover {
    text-decoration: underline;
  }

  .metadata-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
  }

  .metadata-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .metadata-item label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-gray-700);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: var(--space-4);
  }

  .loading-spinner-large {
    width: 48px;
    height: 48px;
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

  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: var(--space-4);
    text-align: center;
  }

  .error-state svg {
    color: var(--color-error);
  }

  .error-state h3 {
    margin: 0;
    font-size: var(--text-xl);
    color: var(--color-gray-900);
  }

  .error-state p {
    margin: 0;
    color: var(--color-gray-600);
  }

  .error-actions {
    display: flex;
    gap: var(--space-2);
  }

  .auth-required {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    padding: var(--space-4);
  }

  @media (max-width: 768px) {
    .detail-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .header-actions {
      width: 100%;
      justify-content: flex-start;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }

    .thumbnails-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }

    .thumbnail-image {
      height: 100px;
    }
  }
</style>
