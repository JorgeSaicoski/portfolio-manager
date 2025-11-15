<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
  import AdminTopBar from '$lib/components/admin/AdminTopBar.svelte';
  import ProjectForm from '$lib/components/admin/ProjectForm.svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  // Auth state
  let user = $derived($auth.user);
  let isAuthenticated = $derived($auth.isAuthenticated);

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

  function handleSuccess() {
    // Navigate to projects list after successful creation
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
        pageTitle="Create New Project"
        onMenuToggle={() => sidebarOpen = !sidebarOpen}
      />

      <!-- Content -->
      <main class="admin-content">
        <ProjectForm
          project={null}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </main>
    </div>
  </div>
{:else}
  <div>Loading...</div>
{/if}
