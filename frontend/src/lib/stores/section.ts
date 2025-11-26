import { writable, type Writable } from "svelte/store";
import { authenticatedFetch } from "./auth";
import { browser } from "$app/environment";
import type {
  Section,
  CreateSectionRequest,
  UpdateSectionRequest,
  PaginatedResponse,
  ApiResponse,
} from "$lib/types/api";

const API_BASE_URL = browser
  ? import.meta.env.VITE_API_URL || "http://localhost:8000/api"
  : "http://localhost:8000/api";
const SECTION_API_URL = `${API_BASE_URL}/sections`;

export interface SectionState {
  sections: Section[];
  loading: boolean;
  error: string | null;
  currentSection: Section | null;
}

function createSectionStore() {
  const { subscribe, set, update } = writable<SectionState>({
    sections: [],
    loading: false,
    error: null,
    currentSection: null,
  });

  return {
    subscribe,

    // Get user's own sections (paginated, protected)
    async getOwn(page = 1, limit = 10): Promise<Section[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${SECTION_API_URL}/own?page=${page}&limit=${limit}`
        );
        const data: PaginatedResponse<Section> = await response.json();

        if (response.ok) {
          update((state) => ({
            ...state,
            sections: data.data,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error((data as any).error || "Failed to fetch sections");
        }
      } catch (error) {
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

    // Get specific section by ID (public)
    async getById(id: number): Promise<Section> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${SECTION_API_URL}/public/${id}`);
        const data: ApiResponse<Section> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            currentSection: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch section");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
          currentSection: null,
        }));
        throw error;
      }
    },

    // Get sections by portfolio ID (public)
    async getByPortfolio(portfolioId: number): Promise<Section[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${SECTION_API_URL}/portfolio/${portfolioId}`);
        const data: ApiResponse<Section[]> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            sections: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch sections by portfolio");
        }
      } catch (error) {
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

    // Get sections by type (public)
    async getByType(type: string): Promise<Section[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(
          `${SECTION_API_URL}/type?type=${encodeURIComponent(type)}`
        );
        const data: ApiResponse<Section[]> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            sections: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch sections by type");
        }
      } catch (error) {
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

    // Create new section (protected)
    async create(sectionData: CreateSectionRequest): Promise<Section> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(`${SECTION_API_URL}/own`, {
          method: "POST",
          body: JSON.stringify(sectionData),
        });
        const data: ApiResponse<Section> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            sections: [...state.sections, data.data!],
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to create section");
        }
      } catch (error) {
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

    // Update section (protected)
    async update(id: number, sectionData: UpdateSectionRequest): Promise<Section> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${SECTION_API_URL}/own/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(sectionData),
          }
        );
        const data: ApiResponse<Section> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            sections: state.sections.map((s) =>
              s.ID === id ? data.data! : s
            ),
            currentSection:
              state.currentSection?.ID === id
                ? data.data!
                : state.currentSection,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to update section");
        }
      } catch (error) {
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

    // Update section position (protected)
    async updatePosition(id: number, newPosition: number): Promise<Section> {
      try {
        const response = await authenticatedFetch(
          `${SECTION_API_URL}/own/${id}`,
          {
            method: "PUT",
            body: JSON.stringify({ position: newPosition }),
          }
        );
        const data: ApiResponse<Section> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            sections: state.sections.map((s) =>
              s.ID === id ? data.data! : s
            ),
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to update position");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(errorMessage);
      }
    },

    // Delete section (protected)
    async delete(id: number): Promise<void> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${SECTION_API_URL}/own/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          update((state) => ({
            ...state,
            sections: state.sections.filter((s) => s.ID !== id),
            currentSection:
              state.currentSection?.ID === id ? null : state.currentSection,
            loading: false,
          }));
        } else {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete section");
        }
      } catch (error) {
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

    // Clear current section
    clearCurrent(): void {
      update((state) => ({
        ...state,
        currentSection: null,
      }));
    },

    // Clear error
    clearError(): void {
      update((state) => ({
        ...state,
        error: null,
      }));
    },
  };
}

export const sectionStore = createSectionStore();
