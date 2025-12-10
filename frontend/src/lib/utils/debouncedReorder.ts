import type { SectionContent } from "$lib/types/api";

/**
 * Store interface for reordering - matches the sectionContentStore API
 */
interface ReorderStore {
  reorderContents: (updates: Array<{ id: number; order: number }>) => Promise<void>;
}

/**
 * Configuration options for debounced reordering
 */
export interface DebouncedReorderOptions {
  /**
   * Debounce delay in milliseconds (default: 2500ms)
   */
  debounceDelay?: number;
  /**
   * Callback invoked when saving state changes
   */
  onSavingChange?: (saving: boolean) => void;
  /**
   * Callback invoked when reordering succeeds
   */
  onSuccess?: () => void;
  /**
   * Callback invoked when reordering fails
   */
  onError?: (error: unknown) => void;
}

/**
 * Creates a debounced reordering handler for section contents.
 * This utility manages the debouncing logic for bulk content reordering,
 * providing instant UI feedback while batching server updates.
 * 
 * @param store - The section content store instance
 * @param loadContents - Function to reload contents after reordering
 * @param options - Configuration options
 * @returns Handler function and cleanup function
 */
export function createDebouncedReorder(
  store: ReorderStore,
  loadContents: () => Promise<void>,
  options: DebouncedReorderOptions = {}
) {
  const {
    debounceDelay = 2500,
    onSavingChange,
    onError,
    onSuccess
  } = options;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Handle content reordering with debouncing
   */
  async function handleReorder(reorderedList: SectionContent[]) {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set saving state
    onSavingChange?.(true);

    // Start new debounce timer
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
        await store.reorderContents(updates);

        // Reload to sync with server
        await loadContents();

        onSavingChange?.(false);
        onSuccess?.();
      } catch (err) {
        console.error('Failed to reorder contents:', err);
        
        // Revert on error
        await loadContents();
        
        onSavingChange?.(false);
        onError?.(err);
      }
    }, debounceDelay);
  }

  /**
   * Cleanup function to clear any pending timers
   */
  function cleanup() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  return {
    handleReorder,
    cleanup
  };
}
