import { writable, type Writable } from "svelte/store";
import { authenticatedFetch } from "./auth";
import { browser } from "$app/environment";
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  PaginatedResponse,
  ApiResponse,
} from "$lib/types/api";

const API_BASE_URL = browser
  ? import.meta.env.VITE_API_URL || "http://localhost:8000/api"
  : "http://localhost:8000/api";
const PROJECT_API_URL = `${API_BASE_URL}/projects`;

export interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  currentProject: Project | null;
}

function createProjectStore() {
  const { subscribe, set, update } = writable<ProjectState>({
    projects: [],
    loading: false,
    error: null,
    currentProject: null,
  });

  return {
    subscribe,

    // Get user's own projects (paginated, protected)
    async getOwn(page = 1, limit = 10): Promise<Project[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${PROJECT_API_URL}/own?page=${page}&limit=${limit}`
        );
        const data: PaginatedResponse<Project> = await response.json();

        if (response.ok) {
          update((state) => ({
            ...state,
            projects: data.data,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error((data as any).error || "Failed to fetch projects");
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

    // Get user's own project by ID (protected)
    async getOwnById(id: number): Promise<Project> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${PROJECT_API_URL}/own/${id}`
        );
        const data: ApiResponse<Project> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            currentProject: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch project");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
          currentProject: null,
        }));
        throw error;
      }
    },

    // Get specific project by ID (public)
    async getById(id: number): Promise<Project> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${PROJECT_API_URL}/public/${id}`);
        const data: ApiResponse<Project> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            currentProject: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch project");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
          currentProject: null,
        }));
        throw error;
      }
    },

    // Get projects by category ID (public)
    async getByCategory(categoryId: number): Promise<Project[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${PROJECT_API_URL}/category/${categoryId}`);
        const data: ApiResponse<Project[]> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            projects: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch projects by category");
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

    // Search projects by skills (public)
    async searchBySkills(skills: string[]): Promise<Project[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const queryParams = skills.map((skill) => `skills=${encodeURIComponent(skill)}`).join("&");
        const response = await fetch(`${PROJECT_API_URL}/search/skills?${queryParams}`);
        const data: ApiResponse<Project[]> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            projects: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to search projects by skills");
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

    // Search projects by client (public)
    async searchByClient(client: string): Promise<Project[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(
          `${PROJECT_API_URL}/search/client?client=${encodeURIComponent(client)}`
        );
        const data: ApiResponse<Project[]> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            projects: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to search projects by client");
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

    // Create new project (protected)
    async create(projectData: CreateProjectRequest): Promise<Project> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(`${PROJECT_API_URL}/own`, {
          method: "POST",
          body: JSON.stringify(projectData),
        });
        const data: ApiResponse<Project> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            projects: [...state.projects, data.data!],
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to create project");
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

    // Update project (protected)
    async update(id: number, projectData: UpdateProjectRequest): Promise<Project> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${PROJECT_API_URL}/own/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(projectData),
          }
        );
        const data: ApiResponse<Project> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            projects: state.projects.map((p) =>
              p.ID === id ? data.data! : p
            ),
            currentProject:
              state.currentProject?.ID === id
                ? data.data!
                : state.currentProject,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to update project");
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

    // Delete project (protected)
    async delete(id: number): Promise<void> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${PROJECT_API_URL}/own/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          update((state) => ({
            ...state,
            projects: state.projects.filter((p) => p.ID !== id),
            currentProject:
              state.currentProject?.ID === id ? null : state.currentProject,
            loading: false,
          }));
        } else {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete project");
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

    // Clear current project
    clearCurrent(): void {
      update((state) => ({
        ...state,
        currentProject: null,
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

export const projectStore = createProjectStore();
