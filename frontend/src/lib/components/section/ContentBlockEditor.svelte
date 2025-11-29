<script lang="ts">
  import type { SectionContent } from "$lib/types/api";
  // import ImageUpload from "$lib/components/admin/ImageUpload.svelte"; // no longer used
  import { imageStore } from "$lib/stores/image";

  export let content: Partial<SectionContent> = {
    type: 'text',
    content: '',
    order: 0,
    metadata: null
  };
  export let onSave: (content: Partial<SectionContent>) => void;
  export let onCancel: () => void;
  export let isEditing = false;
  export let sectionId: number; // Required for image uploads

  let localContent = { ...content };
  let metadataString = content.metadata || '';
  let metadataError = '';
  let showMetadataEditor = false;

  // Image mode state (normal Svelte state)
  let imageInputMode: 'upload' | 'url' = 'upload';
  let uploadedImageUrl: string | null = null;
  let uploadedImageId: number | null = null;
  let uploading = false;

  // Keep localContent in sync when the parent `content` prop changes (edit mode)
  $: if (content) {
    // shallow copy to avoid mutating the prop directly
    localContent = { ...content };
    metadataString = content.metadata || '';
  }

  // Reactive replacement for the previous $effect: initialize image inputs when editing
  $: if (isEditing && localContent?.metadata) {
    try {
      const meta = JSON.parse(localContent.metadata as string);
      if (meta.source === 'uploaded' && meta.image_id) {
        imageInputMode = 'upload';
        uploadedImageUrl = localContent.content || null;
        uploadedImageId = meta.image_id;
      } else {
        imageInputMode = 'url';
      }
    } catch (e) {
      imageInputMode = 'url';
    }
  }

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

  // Handle image upload - accept either a CustomEvent (previous integration) or a DOM Event from input[type=file]
  async function handleImageUpload(event: CustomEvent<File[]> | Event) {
    let files: File[] = [];

    if ((event as CustomEvent).detail && Array.isArray((event as CustomEvent).detail)) {
      files = (event as CustomEvent).detail as File[];
    } else {
      const input = (event.target as HTMLInputElement) || null;
      const fileList = input?.files || null;
      if (!fileList || fileList.length === 0) return;
      files = Array.from(fileList);
    }

    if (files.length === 0) return;

    uploading = true;
    try {
      const uploadedImage = await imageStore.upload(
        files[0],
        'section',
        sectionId,
        '',
        'image'
      );

      uploadedImageUrl = uploadedImage.url;
      uploadedImageId = uploadedImage.ID;
      localContent.content = uploadedImage.url;

      const metadata = {
        image_id: uploadedImage.ID,
        source: 'uploaded',
        thumbnail_url: uploadedImage.thumbnail_url
      };
      localContent.metadata = JSON.stringify(metadata);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      uploading = false;
    }
  }

  // Handle image deletion (when replacing/removing)
  async function handleRemoveImage() {
    if (uploadedImageId) {
      try {
        await imageStore.delete(uploadedImageId);
        uploadedImageUrl = null;
        uploadedImageId = null;
        localContent.content = '';
        localContent.metadata = null;
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
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
      {localContent.type === 'image' ? 'Image' : 'Content'}
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
      ></textarea>
    {:else if localContent.type === 'image'}
      <!-- Image Mode Toggle -->
      <div class="image-mode-toggle">
        <button
          type="button"
          class="toggle-btn"
          class:active={imageInputMode === 'upload'}
          onclick={() => imageInputMode = 'upload'}
        >
          📤 Upload Image
        </button>
        <button
          type="button"
          class="toggle-btn"
          class:active={imageInputMode === 'url'}
          onclick={() => imageInputMode = 'url'}
        >
          🔗 Use External URL
        </button>
      </div>

      {#if imageInputMode === 'upload'}
        <!-- File Upload Mode: simple input that uses the local handler -->
        {#if uploadedImageUrl}
          <div class="uploaded-image-preview">
            <img src={uploadedImageUrl} alt="Uploaded content" />
            <div class="image-actions">
              <button type="button" class="btn-sm btn-outline" onclick={handleRemoveImage}>
                🗑️ Remove & Re-upload
              </button>
            </div>
          </div>
        {:else}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            on:change={handleImageUpload}
            disabled={uploading}
          />

          {#if uploading}
            <div class="upload-progress">
              <div class="spinner"></div>
              <p>Uploading image...</p>
            </div>
          {/if}
        {/if}
      {:else}
        <!-- URL Input Mode -->
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

<style>
  /* ...existing styles... */
</style>
