import { writable, type Writable } from "svelte/store";
import { authenticatedFetch } from "./auth";
import { browser } from "$app/environment";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  PaginatedResponse,
  ApiResponse,
  Project,
} from "$lib/types/api";

const API_BASE_URL = browser
  ? import.meta.env.VITE_API_URL || "http://localhost:8000/api"
  : "http://localhost:8000/api";
const CATEGORY_API_URL = `${API_BASE_URL}/categories`;

export interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  currentCategory: Category | null;
  projects: Project[];
}

function createCategoryStore() {
  const { subscribe, set, update } = writable<CategoryState>({
    categories: [],
    loading: false,
    error: null,
    currentCategory: null,
    projects: [],
  });

  return {
    subscribe,

    // Get user's own categories (paginated, protected)
    async getOwn(page = 1, limit = 10): Promise<Category[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${CATEGORY_API_URL}/own?page=${page}&limit=${limit}`
        );
        const data: PaginatedResponse<Category> = await response.json();

        if (response.ok) {
          update((state) => ({
            ...state,
            categories: data.data,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error((data as any).error || "Failed to fetch categories");
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

    // Get specific category by ID (public)
    async getById(id: number): Promise<Category> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${CATEGORY_API_URL}/id/${id}`);
        const data: ApiResponse<Category> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            currentCategory: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch category");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
          currentCategory: null,
        }));
        throw error;
      }
    },

    // Get category by ID (public alternative endpoint)
    async getPublicById(id: number): Promise<Category> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${CATEGORY_API_URL}/public/${id}`);
        const data: ApiResponse<Category> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            currentCategory: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch category");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
          currentCategory: null,
        }));
        throw error;
      }
    },

    // Get categories by portfolio ID (public)
    async getByPortfolio(portfolioId: number): Promise<Category[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/portfolios/public/${portfolioId}/categories`);
        const data: ApiResponse<Category[]> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            categories: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch portfolio categories");
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

    // Get category's projects (public)
    async getProjects(id: number): Promise<Project[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${CATEGORY_API_URL}/public/${id}/projects`);
        const data: ApiResponse<Project[]> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            projects: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch category projects");
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

    // Create new category (protected)
    async create(categoryData: CreateCategoryRequest): Promise<Category> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(`${CATEGORY_API_URL}/own`, {
          method: "POST",
          body: JSON.stringify(categoryData),
        });
        const data: ApiResponse<Category> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            categories: [...state.categories, data.data!],
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to create category");
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

    // Update category (protected)
    async update(id: number, categoryData: UpdateCategoryRequest): Promise<Category> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${CATEGORY_API_URL}/own/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(categoryData),
          }
        );
        const data: ApiResponse<Category> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            categories: state.categories.map((c) =>
              c.ID === id ? data.data! : c
            ),
            currentCategory:
              state.currentCategory?.ID === id
                ? data.data!
                : state.currentCategory,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to update category");
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

    // Delete category (protected)
    async delete(id: number): Promise<void> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${CATEGORY_API_URL}/own/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          update((state) => ({
            ...state,
            categories: state.categories.filter((c) => c.ID !== id),
            currentCategory:
              state.currentCategory?.ID === id ? null : state.currentCategory,
            loading: false,
          }));
        } else {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete category");
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

    // Update category position (protected)
    async updatePosition(id: number, newPosition: number): Promise<Category> {
      try {
        const response = await authenticatedFetch(
          `${CATEGORY_API_URL}/own/${id}`,
          {
            method: "PUT",
            body: JSON.stringify({ position: newPosition }),
          }
        );
        const data: ApiResponse<Category> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            categories: state.categories.map((c) =>
              c.ID === id ? data.data! : c
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

    // Clear current category
    clearCurrent(): void {
      update((state) => ({
        ...state,
        currentCategory: null,
        projects: [],
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

export const categoryStore = createCategoryStore();
