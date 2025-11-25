<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import { projectStore } from '$lib/stores/project';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
  import AdminTopBar from '$lib/components/admin/AdminTopBar.svelte';
  import ProjectForm from '$lib/components/admin/ProjectForm.svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import type { Project } from '$lib/types/api';

  // Auth state
  let user = $derived($auth.user);
  let isAuthenticated = $derived($auth.isAuthenticated);

  // UI state
  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);
  let project: Project | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Get project ID from URL
  const projectId = $derived(parseInt($page.params.id));

  // Load sidebar state and project data
  onMount(async () => {
    if (browser) {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        sidebarCollapsed = saved === 'true';
      }
    }

    // Load project data
    try {
      loading = true;
      project = await projectStore.getById(projectId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load project';
      console.error('Failed to load project:', err);
    } finally {
      loading = false;
    }
  });

  // Toggle sidebar collapsed state and persist
  function toggleSidebarCollapse() {
    sidebarCollapsed = !sidebarCollapsed;
    if (browser) {
      localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
    }
  }

  function handleSuccess() {
    // Navigate to projects list after successful update
    goto('/projects');
  }

  function handleCancel() {
    // Navigate back to projects list
    goto('/projects');
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
        pageTitle="Edit Project"
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
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Error Loading Project</h3>
            <p>{error}</p>
            <button class="btn btn-primary" onclick={() => goto('/projects')}>
              Back to Projects
            </button>
          </div>
        {:else if project}
          <ProjectForm
            {project}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        {/if}
      </main>
    </div>
  </div>
{:else}
  <div>Loading...</div>
{/if}

<style>
  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    padding: var(--space-8);
  }

  .loading-spinner-large {
    width: 48px;
    height: 48px;
    border: 4px solid var(--color-gray-200);
    border-radius: 50%;
    border-top-color: var(--color-primary);
    animation: spin 0.8s linear infinite;
    margin-bottom: var(--space-4);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-state svg {
    color: var(--color-error);
    margin-bottom: var(--space-4);
  }

  .error-state h3 {
    font-size: var(--text-2xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .error-state p {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-6) 0;
    max-width: 400px;
  }
</style>
