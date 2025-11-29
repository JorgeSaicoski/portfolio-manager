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
      onchange={handleTypeChange}
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
      oninput={handleOrderChange}
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
        oninput={handleContentChange}
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
        oninput={handleContentChange}
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
        onblur={validateMetadata}
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
