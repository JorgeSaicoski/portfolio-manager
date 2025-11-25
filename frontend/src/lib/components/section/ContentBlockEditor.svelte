<script lang="ts">
  import type { SectionContent } from "$lib/types/api";

  export let content: Partial<SectionContent> = {
    type: 'text',
    content: '',
    order: 0,
    metadata: null
  };
  export let onSave: (content: Partial<SectionContent>) => void;
  export let onCancel: () => void;
  export let isEditing = false;

  let localContent = { ...content };
  let metadataString = content.metadata || '';
  let metadataError = '';
  let showMetadataEditor = false;

  // Validate JSON metadata
  function validateMetadata() {
    if (!metadataString.trim()) {
      metadataError = '';
      localContent.metadata = null;
      return true;
    }

    try {
      JSON.parse(metadataString);
      metadataError = '';
      localContent.metadata = metadataString;
      return true;
    } catch (e) {
      metadataError = 'Invalid JSON format';
      return false;
    }
  }

  function handleSave() {
    if (localContent.type === 'image' && !isValidUrl(localContent.content || '')) {
      alert('Please enter a valid image URL');
      return;
    }

    if (!validateMetadata()) {
      return;
    }

    onSave(localContent);
  }

  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function handleContentChange(e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    localContent.content = target.value;
  }

  function handleTypeChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    localContent.type = target.value as 'text' | 'image';
  }

  function handleOrderChange(e: Event) {
    const target = e.target as HTMLInputElement;
    localContent.order = parseInt(target.value) || 0;
  }
</script>

<div class="content-block-editor">
  <h3>{isEditing ? 'Edit' : 'Add'} Content Block</h3>

  <div class="form-group">
    <label for="type">Content Type</label>
    <select
      id="type"
      bind:value={localContent.type}
      on:change={handleTypeChange}
      class="form-select"
    >
      <option value="text">Text</option>
      <option value="image">Image</option>
    </select>
  </div>

  <div class="form-group">
    <label for="order">Order</label>
    <input
      id="order"
      type="number"
      bind:value={localContent.order}
      on:input={handleOrderChange}
      min="0"
      class="form-input"
      placeholder="Display order (0 = first)"
    />
  </div>

  <div class="form-group">
    <label for="content">
      {localContent.type === 'image' ? 'Image URL' : 'Content'}
    </label>
    {#if localContent.type === 'text'}
      <textarea
        id="content"
        bind:value={localContent.content}
        on:input={handleContentChange}
        class="form-textarea"
        rows="6"
        placeholder="Enter your text content here..."
        required
      />
    {:else}
      <input
        id="content"
        type="url"
        bind:value={localContent.content}
        on:input={handleContentChange}
        class="form-input"
        placeholder="https://example.com/image.jpg"
        required
      />
      {#if localContent.content && isValidUrl(localContent.content)}
        <div class="image-preview">
          <img src={localContent.content} alt="Preview" />
        </div>
      {/if}
    {/if}
  </div>

  <div class="form-group">
    <button
      type="button"
      class="btn-secondary btn-sm"
      onclick={() => showMetadataEditor = !showMetadataEditor}
    >
      {showMetadataEditor ? 'Hide' : 'Show'} Metadata Editor
    </button>
  </div>

  {#if showMetadataEditor}
    <div class="form-group">
      <label for="metadata">
        Metadata (JSON)
        <span class="help-text">Optional - Store additional properties in JSON format</span>
      </label>
      <textarea
        id="metadata"
        bind:value={metadataString}
        on:blur={validateMetadata}
        class="form-textarea"
        class:error={metadataError}
        rows="4"
        placeholder={'{"key": "value", "another": "property"}'}
      ></textarea>
      {#if metadataError}
        <span class="error-message">{metadataError}</span>
      {/if}
    </div>
  {/if}

  <div class="action-buttons">
    <button type="button" class="btn-primary" onclick={handleSave}>
      {isEditing ? 'Update' : 'Create'} Content
    </button>
    <button type="button" class="btn-outline" onclick={onCancel}>
      Cancel
    </button>
  </div>
</div>

<style lang="scss">
  .content-block-editor {
    padding: var(--space-4);
    background: var(--color-bg-primary);
    border-radius: var(--radius-md);

    h3 {
      margin-bottom: var(--space-4);
      color: var(--color-text-primary);
      font-size: var(--font-size-xl);
    }
  }

  .form-group {
    margin-bottom: var(--space-4);

    label {
      display: block;
      margin-bottom: var(--space-2);
      font-weight: 600;
      color: var(--color-text-primary);

      .help-text {
        display: block;
        font-size: var(--font-size-sm);
        font-weight: 400;
        color: var(--color-text-secondary);
        margin-top: var(--space-1);
      }
    }

    .form-input,
    .form-textarea,
    .form-select {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-base);
      transition: border-color var(--transition-base);

      &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px var(--color-primary-alpha);
      }

      &.error {
        border-color: var(--color-error);
      }
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .error-message {
      display: block;
      margin-top: var(--space-2);
      color: var(--color-error);
      font-size: var(--font-size-sm);
    }
  }

  .image-preview {
    margin-top: var(--space-3);
    padding: var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg-secondary);

    img {
      max-width: 100%;
      height: auto;
      max-height: 300px;
      border-radius: var(--radius-sm);
      display: block;
      margin: 0 auto;
    }
  }

  .action-buttons {
    display: flex;
    gap: var(--space-3);
    margin-top: var(--space-6);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }

  .btn-sm {
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-sm);
  }
</style>
