<script lang="ts">
  import { imageStore } from "$lib/stores/image";
  import { toastStore } from "$lib/stores/toast";

  export let entityType: "project" | "portfolio" | "section";
  export let entityId: number;
  export let onUploadComplete: ((imageId: number) => void) | undefined = undefined;

  let fileInput: HTMLInputElement;
  let isDragging = false;
  let selectedFiles: File[] = [];
  let previews: { file: File; url: string; alt: string }[] = [];
  let uploading = false;

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

  function validateFile(file: File): string | null {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} exceeds maximum size of 10MB`;
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File ${file.name} is not a valid image type. Allowed: JPEG, PNG, WebP`;
    }

    return null;
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toastStore.error(errors.join("\n"));
    }

    if (validFiles.length > 0) {
      selectedFiles = [...selectedFiles, ...validFiles];
      createPreviews(validFiles);
    }
  }

  function createPreviews(files: File[]) {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews = [
          ...previews,
          {
            file,
            url: e.target?.result as string,
            alt: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          },
        ];
      };
      reader.readAsDataURL(file);
    });
  }

  function removePreview(index: number) {
    previews = previews.filter((_, i) => i !== index);
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
  }

  function updateAlt(index: number, alt: string) {
    previews = previews.map((preview, i) =>
      i === index ? { ...preview, alt } : preview
    );
  }

  async function uploadImages() {
    if (previews.length === 0) return;

    uploading = true;

    try {
      for (const preview of previews) {
        await imageStore.upload(
          preview.file,
          entityType,
          entityId,
          preview.alt
        );
      }

      toastStore.success(
        `Successfully uploaded ${previews.length} image${previews.length > 1 ? "s" : ""}`
      );

      // Clear previews and selected files
      previews = [];
      selectedFiles = [];

      // Call callback if provided
      if (onUploadComplete) {
        onUploadComplete(entityId);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload images";
      toastStore.error(errorMessage);
    } finally {
      uploading = false;
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
    handleFiles(event.dataTransfer?.files || null);
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    handleFiles(target.files);
  }

  function openFileDialog() {
    fileInput.click();
  }
</script>

<div class="image-upload">
  <input
    type="file"
    bind:this={fileInput}
    onchange={handleFileSelect}
    accept={ALLOWED_EXTENSIONS.join(",")}
    multiple
    class="hidden"
  />

  <div
    class="dropzone"
    class:dragging={isDragging}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="button"
    tabindex="0"
    onclick={openFileDialog}
    onkeydown={(e) => e.key === "Enter" && openFileDialog()}
  >
    <svg
      class="upload-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
    <p class="upload-text">
      {#if isDragging}
        Drop images here
      {:else}
        Drag & drop images here, or click to select
      {/if}
    </p>
    <p class="upload-hint">JPEG, PNG, or WebP (max 10MB each)</p>
  </div>

  {#if previews.length > 0}
    <div class="previews">
      <h3 class="previews-title">Images to Upload ({previews.length})</h3>
      <div class="preview-grid">
        {#each previews as preview, index}
          <div class="preview-item">
            <img src={preview.url} alt="Preview" class="preview-image" />
            <div class="preview-details">
              <input
                type="text"
                value={preview.alt}
                oninput={(e) =>
                  updateAlt(index, (e.target as HTMLInputElement).value)}
                placeholder="Image description (alt text)"
                class="alt-input"
                disabled={uploading}
              />
              <button
                type="button"
                onclick={() => removePreview(index)}
                class="remove-button"
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          </div>
        {/each}
      </div>
      <button
        type="button"
        onclick={uploadImages}
        disabled={uploading}
        class="upload-button"
      >
        {uploading ? "Uploading..." : `Upload ${previews.length} Image${previews.length > 1 ? "s" : ""}`}
      </button>
    </div>
  {/if}
</div>

<style>
  .image-upload {
    width: 100%;
  }

  .hidden {
    display: none;
  }

  .dropzone {
    border: 2px dashed #cbd5e0;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #f7fafc;
  }

  .dropzone:hover,
  .dropzone.dragging {
    border-color: #4299e1;
    background-color: #ebf8ff;
  }

  .upload-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 1rem;
    color: #718096;
  }

  .upload-text {
    font-size: 1rem;
    font-weight: 500;
    color: #2d3748;
    margin: 0 0 0.5rem;
  }

  .upload-hint {
    font-size: 0.875rem;
    color: #718096;
    margin: 0;
  }

  .previews {
    margin-top: 1.5rem;
  }

  .previews-title {
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0 0 1rem;
  }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .preview-item {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    background-color: white;
  }

  .preview-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
    display: block;
  }

  .preview-details {
    padding: 0.75rem;
  }

  .alt-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  .alt-input:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  .alt-input:disabled {
    background-color: #f7fafc;
    cursor: not-allowed;
  }

  .remove-button {
    width: 100%;
    padding: 0.5rem;
    background-color: #fc8181;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .remove-button:hover:not(:disabled) {
    background-color: #f56565;
  }

  .remove-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .upload-button {
    width: 100%;
    padding: 0.75rem 1.5rem;
    background-color: #4299e1;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .upload-button:hover:not(:disabled) {
    background-color: #3182ce;
  }

  .upload-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
