<script lang="ts">
  import { onMount } from 'svelte';
  import type { Section, SectionContent } from "$lib/types/api";
  import { sectionContentStore } from "$lib/stores";
  import ContentBlockEditor from "./ContentBlockEditor.svelte";
  import ContentBlockList from "./ContentBlockList.svelte";

  export let section: Section;
  export let isOpen = false;
  export let onClose: () => void;

  let showEditor = false;
  let editingContent: SectionContent | null = null;
  let contents: SectionContent[] = [];
  let loading = false;
  let error: string | null = null;

  // Debouncing state for reordering
  let contentDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let savingContents = false;

  // Subscribe to store
  $: storeState = $sectionContentStore;
  $: contents = storeState.contents;
  $: loading = storeState.loading;
  $: error = storeState.error;

  onMount(() => {
    if (isOpen && section) {
      loadContents();
    }
  });

  $: if (isOpen && section) {
    loadContents();
  }

  async function loadContents() {
    try {
      await sectionContentStore.getBySectionId(section.ID);
    } catch (err) {
      console.error('Failed to load section contents:', err);
    }
  }

  function handleAddNew() {
    editingContent = null;
    showEditor = true;
  }

  function handleEdit(content: SectionContent) {
    editingContent = content;
    showEditor = true;
  }

  async function handleSave(contentData: Partial<SectionContent>) {
    try {
      if (editingContent) {
        // Update existing content
        await sectionContentStore.update(editingContent.ID, contentData);
      } else {
        // Create new content
        await sectionContentStore.create({
          type: contentData.type!,
          content: contentData.content!,
          order: contentData.order || contents.length,
          metadata: contentData.metadata,
          section_id: section.ID
        });
      }

      showEditor = false;
      editingContent = null;
    } catch (err) {
      console.error('Failed to save content:', err);
      alert('Failed to save content. Please try again.');
    }
  }

  async function handleDelete(id: number) {
    try {
      await sectionContentStore.delete(id);
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

  function handleCancel() {
    showEditor = false;
    editingContent = null;
  }

  function handleModalClose() {
    sectionContentStore.clearAll();
    onClose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleModalClose();
    }
  }

  function handleBackdropKeydown(e: KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
      handleModalClose();
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" role="button" tabindex="0" onclick={handleBackdropClick} onkeydown={handleBackdropKeydown}>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Manage Section Content: {section.title}</h2>
        <button type="button" class="close-button" onclick={handleModalClose} title="Close">
          ×
        </button>
      </div>

      <div class="modal-body">
        {#if error}
          <div class="error-banner">
            <strong>Error:</strong> {error}
            <button type="button" onclick={() => sectionContentStore.clearError()}>×</button>
          </div>
        {/if}

        {#if !showEditor}
          <div class="content-list-section">
            <div class="section-header">
              <h3>Content Blocks ({contents.length})</h3>
              <button type="button" class="btn-primary" onclick={handleAddNew}>
                ➕ Add Content Block
              </button>
            </div>

            {#if loading && contents.length === 0}
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading content blocks...</p>
              </div>
            {:else}
              <ContentBlockList
                sectionId={section.ID}
                {contents}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReorder={handleReorderContents}
                editable={true}
              />
            {/if}
          </div>
        {:else}
          <ContentBlockEditor
            content={editingContent || { type: 'text', content: '', order: contents.length }}
            onSave={handleSave}
            onCancel={handleCancel}
            isEditing={!!editingContent}
          />
        {/if}
      </div>

      {#if !showEditor}
        <div class="modal-footer">
          <button type="button" class="btn-outline" onclick={handleModalClose}>
            Close
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: var(--color-gray-600);
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .close-button:hover {
    background: var(--color-gray-100);
    color: var(--color-gray-900);
  }
</style>
