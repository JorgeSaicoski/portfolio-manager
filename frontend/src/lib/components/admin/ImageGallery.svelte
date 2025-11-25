<script lang="ts">
  import { imageStore } from "$lib/stores/image";
  import { toastStore } from "$lib/stores/toast";
  import type { Image } from "$lib/types/api";

  export let images: Image[] = [];
  export let onUpdate: (() => void) | undefined = undefined;

  let editingAlt: { [key: number]: boolean } = {};
  let altValues: { [key: number]: string } = {};

  $: {
    // Initialize alt values when images change
    images.forEach((img) => {
      if (!(img.ID in altValues)) {
        altValues[img.ID] = img.alt;
      }
    });
  }

  async function handleSetMain(imageId: number) {
    try {
      await imageStore.setMain(imageId);
      toastStore.success("Main image updated");
      if (onUpdate) onUpdate();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to set main image";
      toastStore.error(errorMessage);
    }
  }

  async function handleDelete(imageId: number, fileName: string) {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
      return;
    }

    try {
      await imageStore.delete(imageId);
      toastStore.success("Image deleted successfully");
      if (onUpdate) onUpdate();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete image";
      toastStore.error(errorMessage);
    }
  }

  function startEditingAlt(imageId: number) {
    editingAlt[imageId] = true;
  }

  async function saveAlt(imageId: number) {
    const newAlt = altValues[imageId];
    if (!newAlt || newAlt.trim() === "") {
      toastStore.error("Alt text cannot be empty");
      return;
    }

    try {
      await imageStore.updateAlt(imageId, newAlt);
      editingAlt[imageId] = false;
      toastStore.success("Alt text updated");
      if (onUpdate) onUpdate();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update alt text";
      toastStore.error(errorMessage);
    }
  }

  function cancelEditingAlt(imageId: number, originalAlt: string) {
    editingAlt[imageId] = false;
    altValues[imageId] = originalAlt;
  }
</script>

<div class="image-gallery">
  {#if images.length === 0}
    <div class="empty-state">
      <svg
        class="empty-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p class="empty-text">No images uploaded yet</p>
    </div>
  {:else}
    <div class="gallery-grid">
      {#each images as image (image.ID)}
        <div class="gallery-item" class:main-image={image.is_main}>
          <div class="image-container">
            <img
              src={image.thumbnail_url}
              alt={image.alt}
              class="gallery-image"
            />
            {#if image.is_main}
              <div class="main-badge">Main Image</div>
            {/if}
          </div>

          <div class="image-info">
            <div class="alt-section">
              {#if editingAlt[image.ID]}
                <div class="alt-edit">
                  <input
                    type="text"
                    bind:value={altValues[image.ID]}
                    class="alt-input"
                    placeholder="Image description"
                  />
                  <div class="alt-actions">
                    <button
                      type="button"
                      on:click={() => saveAlt(image.ID)}
                      class="save-button"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      on:click={() => cancelEditingAlt(image.ID, image.alt)}
                      class="cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              {:else}
                <div class="alt-display">
                  <p class="alt-text" title={image.alt}>
                    {image.alt || "No description"}
                  </p>
                  <button
                    type="button"
                    on:click={() => startEditingAlt(image.ID)}
                    class="edit-alt-button"
                    title="Edit alt text"
                  >
                    <svg
                      class="edit-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                </div>
              {/if}
            </div>

            <div class="image-meta">
              <span class="file-name" title={image.file_name}>
                {image.file_name}
              </span>
              <span class="file-size">
                {(image.file_size / 1024).toFixed(1)} KB
              </span>
            </div>

            <div class="image-actions">
              {#if !image.is_main}
                <button
                  type="button"
                  on:click={() => handleSetMain(image.ID)}
                  class="action-button main-button"
                >
                  Set as Main
                </button>
              {/if}
              <button
                type="button"
                on:click={() => handleDelete(image.ID, image.file_name)}
                class="action-button delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .image-gallery {
    width: 100%;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background-color: #f7fafc;
    border-radius: 8px;
    border: 2px dashed #cbd5e0;
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    color: #cbd5e0;
  }

  .empty-text {
    font-size: 1rem;
    color: #718096;
    margin: 0;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .gallery-item {
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    background-color: white;
    transition: border-color 0.2s;
  }

  .gallery-item.main-image {
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  .image-container {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
    background-color: #f7fafc;
  }

  .gallery-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .main-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background-color: #4299e1;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .image-info {
    padding: 1rem;
  }

  .alt-section {
    margin-bottom: 0.75rem;
  }

  .alt-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .alt-text {
    flex: 1;
    font-size: 0.875rem;
    color: #2d3748;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .edit-alt-button {
    flex-shrink: 0;
    padding: 0.25rem;
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    transition: color 0.2s;
  }

  .edit-alt-button:hover {
    color: #4299e1;
  }

  .edit-icon {
    width: 16px;
    height: 16px;
  }

  .alt-edit {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .alt-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .alt-input:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  .alt-actions {
    display: flex;
    gap: 0.5rem;
  }

  .save-button,
  .cancel-button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .save-button {
    background-color: #48bb78;
    color: white;
  }

  .save-button:hover {
    background-color: #38a169;
  }

  .cancel-button {
    background-color: #e2e8f0;
    color: #2d3748;
  }

  .cancel-button:hover {
    background-color: #cbd5e0;
  }

  .image-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
    font-size: 0.75rem;
    color: #718096;
  }

  .file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .image-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .main-button {
    background-color: #4299e1;
    color: white;
  }

  .main-button:hover {
    background-color: #3182ce;
  }

  .delete-button {
    background-color: #fc8181;
    color: white;
  }

  .delete-button:hover {
    background-color: #f56565;
  }
</style>
