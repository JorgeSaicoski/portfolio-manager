<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { sectionStore } from "$lib/stores/section";
  import { sectionContentStore } from "$lib/stores/sectionContent";
  import ContentBlockList from "$lib/components/section/ContentBlockList.svelte";
  import ContentBlockEditor from "$lib/components/section/ContentBlockEditor.svelte";
  import LoadingSpinner from "$lib/components/ui/LoadingSpinner.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import PageNavbar from "$lib/components/layout/PageNavbar.svelte";
  import CardHeader from "$lib/components/ui/CardHeader.svelte";
  // ContentImageGallery will be lazy-loaded dynamically in the template to avoid a static import type error
  import type { Section, SectionContent } from "$lib/types/api";

  // Get data from load function
  let { data }: { data: { id: number } } = $props();

  // Page parameters
  const sectionId = $derived(data.id);

  // Component state
  let section: Section | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Content block state
  let contents: SectionContent[] = $state([]);
  let showContentEditor = $state(false);
  let editingContent: SectionContent | null = $state(null);
  let contentLoading = $state(false);
  let viewMode: 'list' | 'gallery' = $state('list');

  // Debouncing state for reordering
  let contentDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let savingContents = $state(false);


  // Load section on mount
  onMount(async () => {
    await loadSection();
    await loadContents();
  });

  async function loadSection() {
    loading = true;
    error = null;

    try {
      section = await sectionStore.getById(sectionId);
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load section";
      section = null;
    } finally {
      loading = false;
    }
  }

  // Load section contents
  async function loadContents() {
    if (!sectionId) return;
    contentLoading = true;
    try {
      contents = await sectionContentStore.getBySectionId(sectionId);
    } catch (err) {
      console.error('Failed to load contents:', err);
    } finally {
      contentLoading = false;
    }
  }

  // Content management functions
  function handleAddContent() {
    editingContent = null;
    showContentEditor = true;
  }

  function handleEditContent(content: SectionContent) {
    editingContent = content;
    showContentEditor = true;
  }

  async function handleSaveContent(contentData: Partial<SectionContent>) {
    try {
      if (editingContent) {
        await sectionContentStore.update(editingContent.ID, contentData);
      } else {
        await sectionContentStore.create({
          ...contentData,
          section_id: sectionId,
          type: contentData.type!,
          content: contentData.content!,
          order: contentData.order ?? contents.length
        });
      }
      await loadContents();
      showContentEditor = false;
      editingContent = null;
    } catch (err) {
      console.error('Failed to save content:', err);
      alert('Failed to save content. Please try again.');
    }
  }

  async function handleDeleteContent(id: number) {
    try {
      await sectionContentStore.delete(id);
      await loadContents();
    } catch (err) {
      console.error('Failed to delete content:', err);
      alert('Failed to delete content. Please try again.');
    }
  }

  // Handle content reordering with debouncing
  function handleReorderContents(reorderedContents: SectionContent[]) {
    // Update local state immediately for instant UI feedback
    contents = reorderedContents;

    // Trigger debounced save
    debouncedReorderContents(reorderedContents);
  }

  async function debouncedReorderContents(reorderedList: SectionContent[]) {
    // Clear existing timer
    if (contentDebounceTimer) {
      clearTimeout(contentDebounceTimer);
    }

    // Set saving state
    savingContents = true;

    // Start new 2.5 second timer
    contentDebounceTimer = setTimeout(async () => {
      try {
        // Prepare bulk update payload
        const updates = reorderedList.map((content, index) => {
          const id = content.id || content.ID || 0;
          return {
            id: id,
            order: index
          };
        });

        // Call reorder endpoint
        await sectionContentStore.reorderContents(updates);

        // Reload to sync with server
        await loadContents();

        savingContents = false;
      } catch (err) {
        console.error('Failed to reorder contents:', err);
        alert('Failed to save content order. Please try again.');
        await loadContents(); // Revert on error
        savingContents = false;
      }
    }, 2500); // 2.5 seconds
  }

  function handleCancelEdit() {
    showContentEditor = false;
    editingContent = null;
  }

  // Navigation functions
  function goBack() {
    if (section?.portfolio_id) {
      goto(`/portfolios/${section.portfolio_id}`);
    } else {
      goto("/portfolios");
    }
  }

  function goToDashboard() {
    goto("/dashboard");
  }

  function goToPortfolio() {
    if (section?.portfolio_id) {
      goto(`/portfolios/${section.portfolio_id}`);
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
  <title>{section?.title || "Section"} - Portfolio Manager</title>
  <meta name="description" content="Section details and management" />
</svelte:head>

<div class="section bg-gray-50">
  <!-- Header with navigation -->
  <PageNavbar
    breadcrumbs={[
      { label: 'Dashboard', onClick: goToDashboard },
      { label: 'Sections', onClick: goBack },
      { label: section?.title || 'Loading...', active: true }
    ]}
    actions={section ? [
      { label: 'Back to Portfolio', icon: 'arrow-left', onClick: goBack, variant: 'outline' },
      ...(section.portfolio_id ? [{ label: 'View Portfolio', onClick: goToPortfolio, variant: 'outline' }] : [])
    ] : []}
  />

  <!-- Main content -->
  <main class="main-content">
    <div class="container">
      <!-- Loading state -->
      {#if loading}
        <LoadingSpinner size="lg" text="Loading section..." />
      {/if}

      <!-- Error state -->
      {#if error && !loading}
        <div class="card">
          <div class="card-body">
            <div class="text-center">
              <svg
                class="icon-fill text-error"
                width="48"
                height="48"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
              <h3 class="text-error">Error</h3>
              <p class="text-muted">{error}</p>
              <div class="form-row">
                <button class="btn btn-primary" onclick={loadSection}>
                  Try Again
                </button>
                <button class="btn btn-outline" onclick={goBack}>
                  Back to Sections
                </button>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Section details -->
      {#if section && !loading}
        <div class="container" style="max-width: 800px;">
          <div class="card">
            <div class="card-header">
              <h2>{section.title}</h2>
              <p class="text-muted">Section Details</p>
            </div>

            <div class="card-body">
              <!-- Description -->
              <div class="form-group">
                <span class="form-label">Description</span>
                <p class="text-base">
                  {section.description || "No description provided"}
                </p>
              </div>

              <!-- Type -->
              <div class="form-group">
                <span class="form-label">Type</span>
                <p class="text-base">
                  <Badge variant="primary">{section.type || "text"}</Badge>
                </p>
              </div>

              <!-- Position -->
              <div class="form-group">
                <span class="form-label">Position</span>
                <p class="text-base">{section.position}</p>
              </div>

              <!-- Portfolio -->
              <div class="form-group">
                <span class="form-label">Portfolio</span>
                <p class="text-base">
                  <button
                    class="btn btn-sm btn-outline"
                    onclick={goToPortfolio}
                  >
                    View Portfolio #{section.portfolio_id}
                  </button>
                </p>
              </div>

              <!-- Metadata -->
              <div class="form-group">
                <span class="form-label">Metadata</span>
                <div class="metadata-grid">
                  <div>
                    <span class="text-muted">Created:</span>
                    <span class="text-base">{formatDate(section.CreatedAt)}</span>
                  </div>
                  <div>
                    <span class="text-muted">Updated:</span>
                    <span class="text-base">{formatDate(section.UpdatedAt)}</span>
                  </div>
                  <div>
                    <span class="text-muted">ID:</span>
                    <span class="text-base">{section.ID}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button class="btn btn-outline" onclick={goBack}>
                <svg class="icon-fill" width="16" height="16" viewBox="0 0 24 24">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Back to Sections
              </button>
            </div>
          </div>

          <!-- Section Content Blocks -->
          <div class="card content-section" style="margin-top: var(--space-6);">
            <div class="card-header">
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div>
                  <h3 style="margin: 0;">Section Content</h3>
                  <p class="text-muted" style="margin: var(--space-2) 0 0 0;">
                    Manage content blocks for this section
                  </p>
                </div>
                {#if !showContentEditor}
                  <div style="display: flex; gap: var(--space-2); align-items: center;">
                    <!-- Saving indicator -->
                    {#if savingContents}
                      <span class="text-muted" style="font-size: 0.875rem; display: flex; align-items: center; gap: var(--space-1);">
                        <LoadingSpinner size="sm" inline={true} />
                        Saving order...
                      </span>
                    {/if}

                    <!-- View Mode Toggle -->
                    <div style="display: flex; gap: var(--space-1); background: var(--color-gray-100); border-radius: var(--radius-md); padding: var(--space-1);">
                      <button
                        class="btn btn-sm"
                        class:btn-primary={viewMode === 'list'}
                        class:btn-ghost={viewMode !== 'list'}
                        onclick={() => viewMode = 'list'}
                        title="List view"
                      >
                        <svg class="icon-fill" width="16" height="16" viewBox="0 0 24 24">
                          <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                        </svg>
                        List
                      </button>
                      <button
                        class="btn btn-sm"
                        class:btn-primary={viewMode === 'gallery'}
                        class:btn-ghost={viewMode !== 'gallery'}
                        onclick={() => viewMode = 'gallery'}
                        title="Gallery view (images only)"
                      >
                        <svg class="icon-fill" width="16" height="16" viewBox="0 0 24 24">
                          <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
                        </svg>
                        Gallery
                      </button>
                    </div>
                    <button class="btn btn-primary" onclick={handleAddContent}>
                      <svg class="icon-fill" width="16" height="16" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                      Add Content Block
                    </button>
                  </div>
                {/if}
              </div>
            </div>

            <div class="card-body">
              {#if showContentEditor}
                <ContentBlockEditor
                  content={editingContent || { type: 'text', content: '', order: contents.length }}
                  onSave={handleSaveContent}
                  onCancel={handleCancelEdit}
                  isEditing={!!editingContent}
                  sectionId={sectionId}
                />
              {:else if contentLoading}
                <div class="loading-state">
                  <div class="spinner"></div>
                  <p class="text-muted">Loading content blocks...</p>
                </div>
              {:else if viewMode === 'list'}

                <ContentBlockList
                  sectionId={sectionId}
                  {contents}
                  onEdit={handleEditContent}
                  onDelete={handleDeleteContent}
                  onReorder={handleReorderContents}
                  editable={true}
                />
              {:else}
                {#await import('$lib/components/section/ContentImageGallery.svelte') then Module}
                  <svelte:component this={Module.default} contents={contents} />
                {:catch err}
                  <div class="text-error">Failed to load gallery</div>
                {/await}
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

  .card-body {
    padding: var(--space-6);
  }

  .card-footer {
    padding: var(--space-6);
    border-top: 1px solid var(--color-gray-200);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
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
  }
</style>

