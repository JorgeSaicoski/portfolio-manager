<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import { projectStore } from '$lib/stores/project';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
  import AdminTopBar from '$lib/components/admin/AdminTopBar.svelte';
  import ProjectTable from '$lib/components/admin/ProjectTable.svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  // Auth state
  let user = $derived($auth.user);

  // UI state
  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);

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

  // Handlers
  async function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectStore.delete(id);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  }
</script>

<svelte:head>
  <title>Projects - Portfolio Manager</title>
  <meta name="description" content="Manage your projects" />
</svelte:head>

{#if user}
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
        pageTitle="Projects"
        onMenuToggle={() => sidebarOpen = !sidebarOpen}
      />

      <!-- Content -->
      <main class="admin-content">
        <div class="section-header">
          <div class="header-title">
            <h2>Manage Projects</h2>
            <p>Create and manage your portfolio projects</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" onclick={() => goto('/projects/new')}>
              <svg class="icon-stroke" viewBox="0 0 24 24" width="20" height="20">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h8m-8 4h6" />
              </svg>
              New Project
            </button>
          </div>
        </div>

        <!-- Project Table -->
        <ProjectTable
          onDelete={handleDelete}
        />
      </main>
    </div>
  </div>
{/if}
