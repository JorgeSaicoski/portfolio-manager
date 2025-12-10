<script lang="ts">
  import type { SectionContent } from "$lib/types/api";
  import { sectionContentStore } from "$lib/stores";
  import IconButton from "$lib/components/ui/IconButton.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";

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
    <EmptyState
      icon="📝"
      title="No content blocks yet"
      message={editable ? "Add content blocks to build your section" : ""}
      size="sm"
    />
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
            <Badge variant="primary" rounded>
              📝 {content.type}
            </Badge>
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
              <IconButton
                type="edit"
                onclick={() => onEdit(content)}
                label="Edit content"
              />
              <IconButton
                type="delete"
                onclick={() => confirmDelete(content)}
                label="Delete content"
              />
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

