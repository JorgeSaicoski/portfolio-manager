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

    const draggedIndex = contents.findIndex(c => c.ID === draggedItem!.ID);
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
      id: content.ID,
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
      onDelete(content.ID);
    }
  }

  function truncate(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Handle broken image previews without IDE type errors
  function handleImageError(e: Event) {
    const img = e.currentTarget as HTMLImageElement | null;
    if (!img) return;
    img.style.display = 'none';
    const fallback = img.parentElement?.querySelector<HTMLElement>('.image-error');
    if (fallback) fallback.style.display = 'block';
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
      {#each contents as content, index (content.ID)}
        <div
          class="content-item"
          class:dragging={draggedItem?.ID === content.ID}
          class:drag-over={draggedOverIndex === index}
          draggable={editable}
          ondragstart={(e) => handleDragStart(e, content)}
          ondragover={(e) => handleDragOver(e, index)}
          ondragleave={handleDragLeave}
          ondrop={(e) => handleDrop(e, index)}
          ondragend={handleDragEnd}
        >
          <div class="content-header">
            <div class="content-type-badge" class:text={content.type === 'text'} class:image={content.type === 'image'}>
              {content.type === 'text' ? '📝' : '🖼️'} {content.type}
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
            {:else}
              <div class="image-container">
                <img src={content.content} alt="Content preview" onerror={handleImageError} />
                <div class="image-error" style="display: none;">
                  ❌ Failed to load image
                  <br />
                  <small>{truncate(content.content, 50)}</small>
                </div>
              </div>
            {/if}
          </div>

          {#if content.metadata}
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
            <small>Created: {new Date(content.CreatedAt).toLocaleDateString()}</small>
            {#if content.UpdatedAt !== content.CreatedAt}
              <small>Updated: {new Date(content.UpdatedAt).toLocaleDateString()}</small>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
