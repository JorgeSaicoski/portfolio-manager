import { writable } from "svelte/store";
import { authenticatedFetch } from "./auth";
import { browser } from "$app/environment";
import type {
  SectionContent,
  CreateSectionContentRequest,
  UpdateSectionContentRequest,
  UpdateSectionContentOrderRequest,
  ApiResponse,
} from "$lib/types/api";

const API_BASE_URL = browser
  ? import.meta.env.VITE_API_URL || "http://localhost:8000/api"
  : "http://localhost:8000/api";
const SECTION_CONTENT_API_URL = `${API_BASE_URL}/section-contents`;

export interface SectionContentState {
  contents: SectionContent[];
  loading: boolean;
  error: string | null;
  currentContent: SectionContent | null;
}

function createSectionContentStore() {
  const { subscribe, set, update } = writable<SectionContentState>({
    contents: [],
    loading: false,
    error: null,
    currentContent: null,
  });

  return {
    subscribe,

    // Get content block by ID (public)
    async getById(id: number): Promise<SectionContent> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${SECTION_CONTENT_API_URL}/${id}`);
        const data: ApiResponse<SectionContent> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            currentContent: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch content");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
          currentContent: null,
        }));
        throw error;
      }
    },

    // Get all content blocks for a section (public)
    async getBySectionId(sectionId: number): Promise<SectionContent[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(
          `${API_BASE_URL}/sections/${sectionId}/contents`
        );
        const data: ApiResponse<SectionContent[]> = await response.json();

        if (response.ok && data.data) {
          // Sort by order field
          const sortedContents = data.data.sort((a, b) => a.order - b.order);
          update((state) => ({
            ...state,
            contents: sortedContents,
            loading: false,
          }));
          return sortedContents;
        } else {
          throw new Error(
            data.error || "Failed to fetch section contents"
          );
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    // Create new content block (protected)
    async create(
      contentData: CreateSectionContentRequest
    ): Promise<SectionContent> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${SECTION_CONTENT_API_URL}/own`,
          {
            method: "POST",
            body: JSON.stringify(contentData),
          }
        );
        const data: ApiResponse<SectionContent> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            contents: [...state.contents, data.data!].sort(
              (a, b) => a.order - b.order
            ),
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to create content");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    // Update content block (protected)
    async update(
      id: number,
      contentData: UpdateSectionContentRequest
    ): Promise<SectionContent> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${SECTION_CONTENT_API_URL}/own/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(contentData),
          }
        );
        const data: ApiResponse<SectionContent> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            contents: state.contents
              .map((c) => (c.ID === id ? data.data! : c))
              .sort((a, b) => a.order - b.order),
            currentContent:
              state.currentContent?.ID === id
                ? data.data!
                : state.currentContent,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to update content");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    // Update content block order only (protected)
    async updateOrder(
      id: number,
      orderData: UpdateSectionContentOrderRequest
    ): Promise<void> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${SECTION_CONTENT_API_URL}/own/${id}/order`,
          {
            method: "PATCH",
            body: JSON.stringify(orderData),
          }
        );

        if (response.ok) {
          // Optimistically update the order in the store
          update((state) => ({
            ...state,
            contents: state.contents
              .map((c) => (c.ID === id ? { ...c, order: orderData.order } : c))
              .sort((a, b) => a.order - b.order),
            loading: false,
          }));
        } else {
          const data = await response.json();
          throw new Error(data.error || "Failed to update content order");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    // Batch update orders for drag-and-drop (protected)
    async reorderContents(
      updates: Array<{ id: number; order: number }>
    ): Promise<void> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        // Optimistically update local state immediately
        update((state) => {
          const contentsMap = new Map(state.contents.map((c) => [c.ID, c]));
          updates.forEach(({ id, order }) => {
            const content = contentsMap.get(id);
            if (content) {
              content.order = order;
            }
          });
          return {
            ...state,
            contents: Array.from(contentsMap.values()).sort(
              (a, b) => a.order - b.order
            ),
          };
        });

        // Send updates to backend
        const promises = updates.map(({ id, order }) =>
          this.updateOrder(id, { order })
        );
        await Promise.all(promises);

        update((state) => ({ ...state, loading: false }));
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    // Delete content block (protected)
    async delete(id: number): Promise<void> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${SECTION_CONTENT_API_URL}/own/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          update((state) => ({
            ...state,
            contents: state.contents.filter((c) => c.ID !== id),
            currentContent:
              state.currentContent?.ID === id ? null : state.currentContent,
            loading: false,
          }));
        } else {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete content");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    // Clear current content
    clearCurrent(): void {
      update((state) => ({
        ...state,
        currentContent: null,
      }));
    },

    // Clear error
    clearError(): void {
      update((state) => ({
        ...state,
        error: null,
      }));
    },

    // Clear all contents (useful when switching sections)
    clearAll(): void {
      set({
        contents: [],
        loading: false,
        error: null,
        currentContent: null,
      });
    },
  };
}

export const sectionContentStore = createSectionContentStore();
