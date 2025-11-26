import { writable } from "svelte/store";
import { authenticatedFetch } from "./auth";
import { browser } from "$app/environment";
import type { Image, UpdateImageRequest, ApiResponse } from "$lib/types/api";

const API_BASE_URL = browser
  ? import.meta.env.VITE_API_URL || "http://localhost:8000/api"
  : "http://localhost:8000/api";
const IMAGE_API_URL = `${API_BASE_URL}/images`;

export interface ImageState {
  images: Image[];
  loading: boolean;
  error: string | null;
  uploadProgress: number;
}

function createImageStore() {
  const { subscribe, set, update } = writable<ImageState>({
    images: [],
    loading: false,
    error: null,
    uploadProgress: 0,
  });

  return {
    subscribe,

    // Upload image with multipart/form-data (protected)
    async upload(
      file: File,
      entityType: "project" | "portfolio" | "section",
      entityId: number,
      alt?: string
    ): Promise<Image> {
      update((state) => ({ ...state, loading: true, error: null, uploadProgress: 0 }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entity_type", entityType);
        formData.append("entity_id", entityId.toString());
        if (alt) {
          formData.append("alt", alt);
        }

        const response = await authenticatedFetch(`${IMAGE_API_URL}/own`, {
          method: "POST",
          body: formData,
          // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
          headers: {},
        });

        const data: ApiResponse<Image> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            images: [...state.images, data.data!],
            loading: false,
            uploadProgress: 100,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to upload image");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
          uploadProgress: 0,
        }));
        throw error;
      }
    },

    // Get images by entity (public)
    async getByEntity(
      entityType: "project" | "portfolio" | "section",
      entityId: number
    ): Promise<Image[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(
          `${IMAGE_API_URL}/entity/${entityType}/${entityId}`
        );

        // Handle 404 - no images found (return empty array)
        if (response.status === 404) {
          update((state) => ({
            ...state,
            images: [],
            loading: false,
          }));
          return [];
        }

        const data: ApiResponse<Image[]> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            images: data.data!,
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to fetch images");
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

    // Update image metadata (protected)
    async updateImage(
      imageId: number,
      updates: UpdateImageRequest
    ): Promise<Image> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${IMAGE_API_URL}/own/${imageId}`,
          {
            method: "PUT",
            body: JSON.stringify(updates),
          }
        );

        const data: ApiResponse<Image> = await response.json();

        if (response.ok && data.data) {
          update((state) => ({
            ...state,
            images: state.images.map((img) =>
              img.ID === imageId ? data.data! : img
            ),
            loading: false,
          }));
          return data.data;
        } else {
          throw new Error(data.error || "Failed to update image");
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

    // Set image as main (convenience method)
    async setMain(imageId: number): Promise<Image> {
      return this.updateImage(imageId, { is_main: true });
    },

    // Update alt text (convenience method)
    async updateAlt(imageId: number, alt: string): Promise<Image> {
      return this.updateImage(imageId, { alt });
    },

    // Delete image (protected)
    async delete(imageId: number): Promise<void> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${IMAGE_API_URL}/own/${imageId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          update((state) => ({
            ...state,
            images: state.images.filter((img) => img.ID !== imageId),
            loading: false,
          }));
        } else {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete image");
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

    // Clear images from store
    clear(): void {
      set({
        images: [],
        loading: false,
        error: null,
        uploadProgress: 0,
      });
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

export const imageStore = createImageStore();
