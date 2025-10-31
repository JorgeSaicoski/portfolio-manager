<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { projectStore, type Project } from '$lib/stores/project';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
  import AdminTopBar from '$lib/components/admin/AdminTopBar.svelte';
  import ProjectTable from '$lib/components/admin/ProjectTable.svelte';

  // Auth state
  let user = $derived($auth.user);

  // UI state
  let sidebarOpen = false;

  // Handlers
  function handleEdit(project: Project) {
    // For now, just log - you can implement edit modal later
    console.log('Edit project:', project);
  }

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
      onClose={() => sidebarOpen = false}
    />

    <!-- Main Content -->
    <div class="admin-main">
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
        </div>

        <!-- Project Table -->
        <ProjectTable
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  </div>
{/if}
