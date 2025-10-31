<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { categoryStore } from '$lib/stores/category';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
  import AdminTopBar from '$lib/components/admin/AdminTopBar.svelte';

  // Auth state
  let user = $derived($auth.user);

  // UI state
  let sidebarOpen = false;
  let categories: any[] = [];
  let loading = true;

  // Load categories
  onMount(async () => {
    try {
      const data = await categoryStore.getOwn(1, 100);
      categories = data || [];
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      loading = false;
    }
  });

  async function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await categoryStore.delete(id);
        categories = categories.filter(c => c.ID !== id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  }
</script>

<svelte:head>
  <title>Categories - Portfolio Manager</title>
  <meta name="description" content="Manage your categories" />
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
        pageTitle="Categories"
        onMenuToggle={() => sidebarOpen = !sidebarOpen}
      />

      <!-- Content -->
      <main class="admin-content">
        <div class="section-header">
          <div class="header-title">
            <h2>Manage Categories</h2>
            <p>Organize your projects into categories</p>
          </div>
        </div>

        <!-- Categories Table -->
        <div class="data-table-wrapper">
          <div class="table-header">
            <h3>Your Categories</h3>
          </div>

          {#if loading}
            <div class="table-empty">
              <p>Loading categories...</p>
            </div>
          {:else if categories.length === 0}
            <div class="table-empty">
              <div class="empty-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h4>No categories yet</h4>
              <p>Create your first category to organize your projects</p>
            </div>
          {:else}
            <table class="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Position</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each categories as category}
                  <tr>
                    <td>{category.title}</td>
                    <td>{category.description || 'No description'}</td>
                    <td>{category.position}</td>
                    <td>
                      <div class="table-actions">
                        <button class="btn-icon delete" on:click={() => handleDelete(category.ID)} aria-label="Delete category">
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
{/if}
