import type { SectionContent } from '$lib/types/api';
import { sectionContentStore } from '$lib/stores';
import { toastStore } from '$lib/stores/toast';

export interface ContentReorderingCallbacks {
  onContentsUpdate: (contents: SectionContent[]) => void;
  onSavingUpdate: (saving: boolean) => void;
  onReloadContents: () => Promise<void>;
}

/**
 * Creates reordering handlers for section contents with debounced saving
 * @param callbacks Callback functions for state updates
 * @returns Object containing handleReorderContents and cleanup function
 */
export function createContentReorderingHandlers(callbacks: ContentReorderingCallbacks) {
  const {
    onContentsUpdate,
    onSavingUpdate,
    onReloadContents
  } = callbacks;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleReorderContents(reorderedContents: SectionContent[]) {
    // Update local state immediately for instant UI feedback
    onContentsUpdate(reorderedContents);

    // Trigger debounced save
    debouncedReorderContents(reorderedContents);
  }

  async function debouncedReorderContents(reorderedList: SectionContent[]) {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set saving state
    onSavingUpdate(true);

    // Start new 2.5 second timer
    debounceTimer = setTimeout(async () => {
      try {
        // Prepare bulk update payload
        const updates = reorderedList.map((content, index) => {
          const id = content.id || content.ID || 0;
          return {
            id: id,
            order: index
          };
        });

        // Call reorder endpoint
        await sectionContentStore.reorderContents(updates);

        // Reload to sync with server
        await onReloadContents();

        onSavingUpdate(false);
      } catch (err) {
        console.error('Failed to reorder contents:', err);
        toastStore.error('Failed to save content order. Please try again.');
        await onReloadContents(); // Revert on error
        onSavingUpdate(false);
      }
    }, 2500); // 2.5 seconds
  }

  function cleanup() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  }

  return {
    handleReorderContents,
    cleanup
  };
}
