<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { auth } from '$lib/stores/auth';
  import { sectionStore } from '$lib/stores/section';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
  import AdminTopBar from '$lib/components/admin/AdminTopBar.svelte';
  import SectionForm from '$lib/components/admin/SectionForm.svelte';
  import type { Section } from '$lib/types/api';

  // Auth state
  let user = $derived($auth.user);

  // UI state
  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);
  let sections: Section[] = $state([]);
  let loading = $state(true);
  let showModal = $state(false);
  let selectedSection: Section | null = $state(null);

  // Load sections
  onMount(async () => {
    if (browser) {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        sidebarCollapsed = saved === 'true';
      }
    }
    await loadSections();
  });

  async function loadSections() {
    loading = true;
    try {
      const data = await sectionStore.getOwn(1, 100);
      sections = data || [];
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      loading = false;
    }
  }

  function handleCreate() {
    selectedSection = null;
    showModal = true;
  }

  function toggleSidebarCollapse() {
    sidebarCollapsed = !sidebarCollapsed;
    if (browser) {
      localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
    }
  }

  function handleEdit(section: Section) {
    selectedSection = section;
    showModal = true;
  }

  async function handleFormSuccess() {
    showModal = false;
    selectedSection = null;
    await loadSections();
  }

  function handleFormCancel() {
    showModal = false;
    selectedSection = null;
  }

  async function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
      try {
        await sectionStore.delete(id);
        sections = sections.filter(s => s.ID !== id);
      } catch (error) {
        console.error('Error deleting section:', error);
      }
    }
  }
</script>

<svelte:head>
  <title>Sections - Portfolio Manager</title>
  <meta name="description" content="Manage your sections" />
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
        pageTitle="Sections"
        onMenuToggle={() => sidebarOpen = !sidebarOpen}
      />

      <!-- Content -->
      <main class="admin-content">
        <div class="section-header">
          <div class="header-title">
            <h2>Manage Sections</h2>
            <p>Create and manage portfolio sections</p>
          </div>
          <button class="btn btn-primary" onclick={handleCreate}>
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Section
          </button>
        </div>

        <!-- Sections Table -->
        <div class="data-table-wrapper">
          <div class="table-header">
            <h3>Your Sections</h3>
          </div>

          {#if loading}
            <div class="table-empty">
              <p>Loading sections...</p>
            </div>
          {:else if sections.length === 0}
            <div class="table-empty">
              <div class="empty-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h4>No sections yet</h4>
              <p>Create your first section for your portfolio</p>
            </div>
          {:else}
            <table class="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Position</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each sections as section}
                  <tr>
                    <td>{section.title}</td>
                    <td>{section.description || 'No description'}</td>
                    <td>{section.type || '-'}</td>
                    <td>{section.position || '-'}</td>
                    <td>
                      <div class="table-actions">
                        <button class="btn-icon edit" onclick={() => handleEdit(section)} aria-label="Edit section">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button class="btn-icon delete" onclick={() => handleDelete(section.ID)} aria-label="Delete section">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      </main>
    </div>
  </div>

  <!-- Modal for Create/Edit -->
  {#if showModal}
    <!-- Modal Backdrop -->
    <div class="modal-backdrop show"></div>

    <!-- Modal Container -->
    <div class="modal show">
      <div class="modal-content">
        <SectionForm
          section={selectedSection}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    </div>
  {/if}
{/if}

<style>
  /* Page-specific styles - modal styles are global */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
  }

  .header-title h2 {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-1) 0;
  }

  .header-title p {
    font-size: var(--text-sm);
    color: var(--color-gray-600);
    margin: 0;
  }

  /* Note: .btn-icon styles removed - using global styles from _tables.scss for proper colors */

  @media (max-width: 768px) {
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-3);
    }
  }
</style>
