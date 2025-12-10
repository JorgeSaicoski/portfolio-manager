<script lang="ts">
  import type { SectionContent } from "$lib/types/api";
  import { sectionContentStore } from "$lib/stores";

  export let sectionId: number;
  export let contents: SectionContent[] = [];
  export let onEdit: (content: SectionContent) => void;
  export let onDelete: (id: number) => void;
  export let onReorder: (reorderedContents: SectionContent[]) => void;
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

    // Reorder array optimistically
    const reorderedContents = [...contents];
    const [removed] = reorderedContents.splice(draggedIndex, 1);
    reorderedContents.splice(dropIndex, 0, removed);

    // Update local contents immediately for instant UI feedback
    contents = reorderedContents;

    // Notify parent to handle debounced save
    onReorder(reorderedContents);

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
                class="btn-icon"
                onclick={() => onEdit(content)}
                title="Edit content"
                aria-label="Edit content"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                class="btn-icon delete"
                onclick={() => confirmDelete(content)}
                title="Delete content"
                aria-label="Delete content"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
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

