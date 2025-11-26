<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { categoryStore } from '$lib/stores/category';
  import { browser } from '$app/environment';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
  import AdminTopBar from '$lib/components/admin/AdminTopBar.svelte';
  import CategoryModal from '$lib/components/admin/CategoryModal.svelte';
  import type { Category } from '$lib/types/api';

  // Auth state
  let user = $derived($auth.user);

  // UI state
  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);
  let categories = $state<Category[]>([]);
  let loading = $state(true);
  let showModal = $state(false);
  let editingCategory = $state<Category | null>(null);

  // Drag and drop state
  let draggedCategory: Category | null = $state(null);
  let draggedOverCategoryIndex: number | null = $state(null);

  // Load categories
  async function loadCategories() {
    loading = true;
    try {
      const data = await categoryStore.getOwn(1, 100);
      categories = (data || []).sort((a, b) => (a.position || 0) - (b.position || 0));
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    if (browser) {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        sidebarCollapsed = saved === 'true';
      }
    }
    await loadCategories();
  });

  function toggleSidebarCollapse() {
    sidebarCollapsed = !sidebarCollapsed;
    if (browser) {
      localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
    }
  }

  function openCreateModal() {
    editingCategory = null;
    showModal = true;
  }

  function openEditModal(category: Category) {
    editingCategory = category;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingCategory = null;
  }

  async function handleModalSuccess() {
    await loadCategories();
  }

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

  // Drag and drop handlers
  function handleCategoryDragStart(e: DragEvent, category: Category) {
    draggedCategory = category;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleCategoryDragOver(e: DragEvent, index: number) {
    if (!draggedCategory) return;
    e.preventDefault();
    draggedOverCategoryIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleCategoryDragLeave() {
    draggedOverCategoryIndex = null;
  }

  async function handleCategoryDrop(e: DragEvent, dropIndex: number) {
    if (!draggedCategory) return;
    e.preventDefault();

    const draggedIndex = categories.findIndex(c => c.ID === draggedCategory!.ID);
    if (draggedIndex === dropIndex) {
      draggedCategory = null;
      draggedOverCategoryIndex = null;
      return;
    }

    // Reorder array optimistically
    const reorderedCategories = [...categories];
    const [removed] = reorderedCategories.splice(draggedIndex, 1);
    reorderedCategories.splice(dropIndex, 0, removed);
    categories = reorderedCategories;

    // Update positions in backend
    try {
      // Update the position of the dragged category to match its new position
      // Note: Position is 1-based, dropIndex is 0-based
      const newPosition = dropIndex + 1;
      await categoryStore.updatePosition(draggedCategory.ID, newPosition);
      await loadCategories(); // Reload to get correct positions from server
    } catch (err) {
      console.error('Failed to reorder categories:', err);
      alert('Failed to reorder categories. Please try again.');
      await loadCategories(); // Reload on error to revert
    }

    draggedCategory = null;
    draggedOverCategoryIndex = null;
  }

  function handleCategoryDragEnd() {
    draggedCategory = null;
    draggedOverCategoryIndex = null;
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
      isCollapsed={sidebarCollapsed}
      onClose={() => sidebarOpen = false}
      onToggleCollapse={toggleSidebarCollapse}
    />

    <!-- Main Content -->
    <div class="admin-main" class:sidebar-collapsed={sidebarCollapsed}>
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
            <p>Organize your projects into categories - Drag to reorder</p>
          </div>
          <button class="btn btn-primary" onclick={openCreateModal}>
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Category
          </button>
        </div>

        <!-- Categories List -->
        <div class="card">
          <div class="card-header">
            <h3>Your Categories</h3>
          </div>

          <div class="card-body">
            {#if loading}
              <p class="text-muted">Loading categories...</p>
            {:else if categories.length === 0}
              <div class="empty-state">
                <div class="empty-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h4>No categories yet</h4>
                <p>Create your first category to organize your projects</p>
                <button class="btn btn-primary" onclick={openCreateModal}>
                  Create Category
                </button>
              </div>
            {:else}
              <div class="categories-list">
                {#each categories as category, index (category.ID)}
                  <div
                    class="category-item"
                    class:dragging={draggedCategory?.ID === category.ID}
                    class:drag-over={draggedOverCategoryIndex === index}
                    draggable={true}
                    ondragstart={(e) => handleCategoryDragStart(e, category)}
                    ondragover={(e) => handleCategoryDragOver(e, index)}
                    ondragleave={handleCategoryDragLeave}
                    ondrop={(e) => handleCategoryDrop(e, index)}
                    ondragend={handleCategoryDragEnd}
                  >
                    <div class="category-header-row">
                      <div class="drag-handle" title="Drag to reorder">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="9" cy="6" r="1.5"/>
                          <circle cx="15" cy="6" r="1.5"/>
                          <circle cx="9" cy="12" r="1.5"/>
                          <circle cx="15" cy="12" r="1.5"/>
                          <circle cx="9" cy="18" r="1.5"/>
                          <circle cx="15" cy="18" r="1.5"/>
                        </svg>
                      </div>
                      <div class="category-info">
                        <h4>{category.title}</h4>
                        <p class="text-muted">{category.description || 'No description'}</p>
                      </div>
                      <span class="position-badge">#{category.position}</span>
                      <div class="category-actions">
                        <button class="btn-icon edit" onclick={() => openEditModal(category)} title="Edit category">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button class="btn-icon delete" onclick={() => handleDelete(category.ID)} title="Delete category">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </main>
    </div>
  </div>

  <!-- Category Modal -->
  {#if showModal}
    <CategoryModal
      category={editingCategory}
      onClose={closeModal}
      onSuccess={handleModalSuccess}
    />
  {/if}
{/if}
