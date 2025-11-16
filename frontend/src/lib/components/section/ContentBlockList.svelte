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

<style lang="scss">
  .content-block-list {
    width: 100%;
  }

  .empty-state {
    padding: var(--space-8);
    text-align: center;
    color: var(--color-text-secondary);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);

    p {
      margin: 0;
      font-size: var(--font-size-base);
    }

    .hint {
      margin-top: var(--space-2);
      font-size: var(--font-size-sm);
      color: var(--color-text-tertiary);
    }
  }

  .content-items {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .content-item {
    position: relative;
    padding: var(--space-4);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: all var(--transition-base);

    &:hover {
      box-shadow: var(--shadow-sm);
      border-color: var(--color-primary-alpha);
    }

    &.dragging {
      opacity: 0.5;
      transform: scale(0.98);
    }

    &.drag-over {
      border-color: var(--color-primary);
      background: var(--color-primary-alpha);
      transform: translateY(-2px);
    }
  }

  .content-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .content-type-badge {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: 600;

    &.text {
      background: var(--color-info-alpha);
      color: var(--color-info);
    }

    &.image {
      background: var(--color-success-alpha);
      color: var(--color-success);
    }
  }

  .content-order {
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .drag-handle {
    margin-left: auto;
    cursor: grab;
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    user-select: none;
    padding: 0 var(--space-2);

    &:active {
      cursor: grabbing;
    }
  }

  .content-preview {
    margin-bottom: var(--space-3);

    .text-content {
      margin: 0;
      padding: var(--space-3);
      background: var(--color-bg-primary);
      border-radius: var(--radius-sm);
      color: var(--color-text-primary);
      white-space: pre-wrap;
      word-break: break-word;
    }

    .image-container {
      position: relative;
      max-height: 200px;
      overflow: hidden;
      border-radius: var(--radius-sm);
      background: var(--color-bg-tertiary);

      img {
        width: 100%;
        height: auto;
        display: block;
      }

      .image-error {
        padding: var(--space-4);
        text-align: center;
        color: var(--color-error);
        font-size: var(--font-size-sm);
      }
    }
  }

  .metadata-indicator {
    display: inline-block;
    padding: var(--space-1) var(--space-2);
    margin-bottom: var(--space-2);
    background: var(--color-warning-alpha);
    color: var(--color-warning);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    cursor: help;
  }

  .content-actions {
    display: flex;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  .btn-sm {
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
  }

  .content-meta {
    display: flex;
    gap: var(--space-3);
    padding-top: var(--space-2);
    border-top: 1px solid var(--color-border);

    small {
      color: var(--color-text-tertiary);
      font-size: var(--font-size-xs);
    }
  }
</style>
