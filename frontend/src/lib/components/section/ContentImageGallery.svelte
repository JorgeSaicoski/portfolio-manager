<script lang="ts">
  import type { SectionContent } from "$lib/types/api";

  export let contents: SectionContent[] = [];

  // Filter to only image contents
  $: imageContents = contents.filter(c => c.type === 'image');

  let selectedImage: SectionContent | null = null;
  let currentIndex = 0;

  function openGallery(content: SectionContent, index: number) {
    selectedImage = content;
    currentIndex = index;
  }

  function closeGallery() {
    selectedImage = null;
  }

  function nextImage() {
    if (currentIndex < imageContents.length - 1) {
      currentIndex++;
      selectedImage = imageContents[currentIndex];
    }
  }

  function prevImage() {
    if (currentIndex > 0) {
      currentIndex--;
      selectedImage = imageContents[currentIndex];
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!selectedImage) return;

    if (e.key === 'Escape') {
      closeGallery();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    }
  }

  // Allow overlay activation via keyboard (Enter/Space)
  function handleOverlayKeydown(e: KeyboardEvent) {
    const key = e.key;
    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      closeGallery();
    }
  }

  // Prevent key events inside the content pane from bubbling to the overlay
  function handleContentKeydown(e: KeyboardEvent) {
    e.stopPropagation();
  }

  // Parse metadata to get image info
  function getImageMetadata(content: SectionContent | null): { source: string; thumbnailUrl?: string; imageId?: number } | null {
    if (!content?.metadata) return null;
    try {
      const meta = JSON.parse(content.metadata);
      return {
        source: meta.source || 'external',
        thumbnailUrl: meta.thumbnail_url,
        imageId: meta.image_id
      };
    } catch {
      return null;
    }
  }

  // helper to get metadata inline in template
  const metaFor = (c: SectionContent | null) => getImageMetadata(c);
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="image-gallery">
  {#if imageContents.length === 0}
    <div class="empty-state">
      <p>No images in this section yet.</p>
    </div>
  {:else}
    <div class="gallery-grid">
      {#each imageContents as content, index (content.ID)}
        {@const imageMeta = metaFor(content)}
        <button
          type="button"
          class="gallery-item"
          onclick={() => openGallery(content, index)}
        >
          <span class="gallery-image-container">
            {#if imageMeta?.thumbnailUrl}
              <img src={imageMeta.thumbnailUrl} alt={`Gallery thumbnail ${index + 1}`} />
            {:else}
              <img src={content.content} alt={`Gallery image ${index + 1}`} />
            {/if}
            {#if imageMeta}
              <span class="source-badge" class:uploaded={imageMeta.source === 'uploaded'} class:external={imageMeta.source === 'external'}>
                {imageMeta.source === 'uploaded' ? '📤' : '🔗'}
              </span>
            {/if}
          </span>
          <span class="gallery-item-info">
            <small>#{content.order}</small>
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Lightbox Modal -->
{#if selectedImage}
  {@const imageMeta = metaFor(selectedImage)}
  <div class="lightbox-overlay" onclick={closeGallery} role="button" tabindex="0" onkeydown={handleOverlayKeydown}>
    <div class="lightbox-content" onclick={(e) => e.stopPropagation()} onkeydown={handleContentKeydown} role="dialog" aria-modal="true" tabindex="0">
      <button class="lightbox-close" onclick={closeGallery} title="Close (Esc)">
        ✕
      </button>

      <div class="lightbox-image">
        <img src={selectedImage.content} alt={`Image ${currentIndex + 1} of ${imageContents.length}`} />
      </div>

      <div class="lightbox-info">
        <div class="lightbox-meta">
          <span>Image {currentIndex + 1} of {imageContents.length}</span>
          {#if imageMeta}
            <span class="source-badge" class:uploaded={imageMeta.source === 'uploaded'} class:external={imageMeta.source === 'external'}>
              {imageMeta.source === 'uploaded' ? '📤 Uploaded' : '🔗 External'}
            </span>
          {/if}
        </div>
        <div class="lightbox-details">
          <small>Order: #{selectedImage.order}</small>
          {#if imageMeta?.imageId}
            <small>Image ID: {imageMeta.imageId}</small>
          {/if}
        </div>
      </div>

      <div class="lightbox-nav">
        <button
          class="nav-btn prev"
          onclick={prevImage}
          disabled={currentIndex === 0}
          title="Previous (←)"
        >
          ‹
        </button>
        <button
          class="nav-btn next"
          onclick={nextImage}
          disabled={currentIndex === imageContents.length - 1}
          title="Next (→)"
        >
          ›
        </button>
      </div>
    </div>
  </div>
{/if}
