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
  <div class="modal-backdrop" role="button" tabindex="0" onclick={handleBackdropClick} on:keydown={handleBackdropKeydown}>
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

<style lang="scss">
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--space-4);
    overflow-y: auto;
  }

  .modal-content {
    background: var(--color-bg-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--color-border);

    h2 {
      margin: 0;
      font-size: var(--font-size-2xl);
      color: var(--color-text-primary);
    }

    .close-button {
      background: none;
      border: none;
      font-size: 2rem;
      line-height: 1;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);

      &:hover {
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
      }
    }
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-6);
  }

  .error-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    margin-bottom: var(--space-4);
    background: var(--color-error-alpha);
    border: 1px solid var(--color-error);
    border-radius: var(--radius-md);
    color: var(--color-error);

    button {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--color-error);
      cursor: pointer;
      padding: 0 var(--space-2);
    }
  }

  .content-list-section {
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);

      h3 {
        margin: 0;
        font-size: var(--font-size-xl);
        color: var(--color-text-primary);
      }
    }
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8);
    color: var(--color-text-secondary);

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: var(--space-3);
    }

    p {
      margin: 0;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .modal-footer {
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
  }
</style>
