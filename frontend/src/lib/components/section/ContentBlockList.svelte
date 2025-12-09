<script lang="ts">
  import type { SectionContent } from "$lib/types/api";
  import { sectionContentStore } from "$lib/stores";

  export let sectionId: number;
  export let contents: SectionContent[] = [];
  export let onEdit: (content: SectionContent) => void;
  export let onDelete: (id: number) => void;
  export let editable = true;

  let draggedItem: SectionContent | null = null;
  let draggedOverIndex: number | null = null;

  // Helper to get ID (handles both 'id' and 'ID')
  function getItemId(content: SectionContent): number {
    return content.id || content.ID || 0;
  }

  function handleDragStart(e: DragEvent, content: SectionContent) {
    if (!editable) return;
    draggedItem = content;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(e: DragEvent, index: number) {
    if (!editable || !draggedItem) return;
    e.preventDefault();
    draggedOverIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDragLeave() {
    draggedOverIndex = null;
  }

  function handleDrop(e: DragEvent, dropIndex: number) {
    if (!editable || !draggedItem) return;
    e.preventDefault();

    const draggedIndex = contents.findIndex(c => getItemId(c) === getItemId(draggedItem!));
    if (draggedIndex === dropIndex) {
      draggedItem = null;
      draggedOverIndex = null;
      return;
    }

    // Reorder array
    const reorderedContents = [...contents];
    const [removed] = reorderedContents.splice(draggedIndex, 1);
    reorderedContents.splice(dropIndex, 0, removed);

    // Calculate new orders
    const updates = reorderedContents.map((content, index) => ({
      id: getItemId(content),
      order: index
    }));

    // Update via store
    sectionContentStore.reorderContents(updates).catch((err: unknown) => {
      console.error('Failed to reorder contents:', err);
      alert('Failed to reorder content blocks. Please try again.');
    });

    draggedItem = null;
    draggedOverIndex = null;
  }

  function handleDragEnd() {
    draggedItem = null;
    draggedOverIndex = null;
  }

  function confirmDelete(content: SectionContent) {
    if (confirm(`Are you sure you want to delete this ${content.type} content block?`)) {
      onDelete(getItemId(content));
    }
  }

  function truncate(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
</script>

<div class="content-block-list">
  {#if contents.length === 0}
    <div class="empty-state">
      <p>No content blocks yet.</p>
      {#if editable}
        <p class="hint">Add content blocks to build your section.</p>
      {/if}
    </div>
  {:else}
    <div class="content-items">
      {#each contents as content, index (getItemId(content))}
        <div
          class="content-item"
          class:dragging={draggedItem && getItemId(draggedItem) === getItemId(content)}
          class:drag-over={draggedOverIndex === index}
          draggable={editable}
          ondragstart={(e) => handleDragStart(e, content)}
          ondragover={(e) => handleDragOver(e, index)}
          ondragleave={handleDragLeave}
          ondrop={(e) => handleDrop(e, index)}
          ondragend={handleDragEnd}
        >
          <div class="content-header">
            <div class="content-type-badge" class:text={content.type === 'text'}>
              📝 {content.type}
            </div>
            <div class="content-order">#{content.order}</div>
            {#if editable}
              <div class="drag-handle" title="Drag to reorder">
                ⋮⋮
              </div>
            {/if}
          </div>

          <div class="content-preview">
            {#if content.type === 'text'}
              <p class="text-content">{truncate(content.content)}</p>
            {/if}
          </div>

          {#if content.metadata && content.type === 'text'}
            <div class="metadata-indicator" title={content.metadata}>
              📋 Has metadata
            </div>
          {/if}

          {#if editable}
            <div class="content-actions">
              <button
                type="button"
                class="btn-sm btn-outline"
                onclick={() => onEdit(content)}
                title="Edit content"
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                class="btn-sm btn-destructive"
                onclick={() => confirmDelete(content)}
                title="Delete content"
              >
                🗑️ Delete
              </button>
            </div>
          {/if}

          <div class="content-meta">
            <small>Created: {new Date(content.created_at || content.CreatedAt || '').toLocaleDateString()}</small>
            {#if (content.updated_at || content.UpdatedAt) !== (content.created_at || content.CreatedAt)}
              <small>Updated: {new Date(content.updated_at || content.UpdatedAt || '').toLocaleDateString()}</small>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .content-block-list {
    width: 100%;
  }

  .empty-state {
    text-align: center;
    padding: var(--space-12);
    color: var(--color-gray-600);
  }

  .hint {
    font-size: var(--text-sm);
    margin-top: var(--space-2);
  }

  .content-items {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .content-item {
    background: white;
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    transition: all 0.2s;
  }

  .content-item.dragging {
    opacity: 0.5;
  }

  .content-item.drag-over {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }

  .content-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .content-type-badge {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 500;
    background: var(--color-primary-100);
    color: var(--color-primary-700);
  }

  .content-order {
    font-size: var(--text-sm);
    color: var(--color-gray-500);
    font-weight: 600;
  }

  .drag-handle {
    margin-left: auto;
    cursor: grab;
    color: var(--color-gray-400);
    font-size: 20px;
    user-select: none;
  }

  .content-preview {
    margin-bottom: var(--space-3);
  }

  .text-content {
    color: var(--color-gray-700);
    margin: 0;
    white-space: pre-wrap;
  }

  .metadata-indicator {
    display: inline-block;
    padding: var(--space-1) var(--space-2);
    background: var(--color-info-100);
    color: var(--color-info-700);
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    margin-bottom: var(--space-3);
  }

  .content-actions {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .content-meta {
    display: flex;
    gap: var(--space-4);
    font-size: var(--text-xs);
    color: var(--color-gray-500);
  }
</style>

