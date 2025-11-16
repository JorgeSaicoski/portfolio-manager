import { writable, type Writable } from "svelte/store";
import { authenticatedFetch } from "./auth";
import { browser } from "$app/environment";

const API_BASE_URL = browser
  ? import.meta.env.VITE_API_URL || "http://localhost:8000/api"
  : "http://localhost:8000/api";
const PORTFOLIO_API_URL = `${API_BASE_URL}/portfolios`;

export interface Portfolio {
  ID: number;
  title: string;
  description: string;
  owner_id: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface PortfolioState {
  portfolios: Portfolio[];
  loading: boolean;
  error: string | null;
  currentPortfolio: Portfolio | null;
}

function createPortfolioStore() {
  const { subscribe, set, update } = writable<PortfolioState>({
    portfolios: [],
    loading: false,
    error: null,
    currentPortfolio: null,
  });

  return {
    subscribe,

    async getOwn(page = 1, limit = 10) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${PORTFOLIO_API_URL}/own?page=${page}&limit=${limit}`
        );
        const data = await response.json();

        if (response.ok) {
          const portfolios = data.data;
          update((state) => ({
            ...state,
            portfolios: portfolios || [],
            loading: false,
          }));
          return portfolios;
        } else {
          console.error("Failed to load portfolios:", data.error);
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("Error loading portfolios:", error);
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

    async getById(id: number) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        // Use regular fetch (not authenticatedFetch) since it's a public route
        const response = await fetch(`${API_BASE_URL}/portfolios/id/${id}`);
        const data = await response.json();

        if (response.ok) {
          const portfolio = data.data;
          update((state) => ({
            ...state,
            currentPortfolio: portfolio,
            loading: false,
          }));
          return data;
        } else {
          console.error("Failed to load portfolio:", data.error);
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("Error loading portfolio:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
          currentPortfolio: null,
        }));
        throw error;
      }
    },

    async create(portfolioData: Partial<Portfolio>) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(`${PORTFOLIO_API_URL}/own`, {
          method: "POST",
          body: JSON.stringify(portfolioData),
        });
        const data = await response.json();

        if (response.ok) {
          const newPortfolio = data.data;
          update((state) => ({
            ...state,
            portfolios: [...(state.portfolios || []), newPortfolio],
            loading: false,
          }));
          return data;
        } else {
          console.error("Failed to create portfolio:", data.error);
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("Error creating portfolio:", error);
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

    async update(id: number, portfolioData: Partial<Portfolio>) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${PORTFOLIO_API_URL}/own/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(portfolioData),
          }
        );
        const data = await response.json();

        if (response.ok) {
          const updatedPortfolio = data.data;
          update((state) => ({
            ...state,
            portfolios: state.portfolios.map((p) =>
              p.ID === id ? updatedPortfolio : p
            ),
            loading: false,
          }));
          return data;
        } else {
          console.error("Failed to update portfolio:", data.error);
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("Error updating portfolio:", error);
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

    async delete(id: number) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${PORTFOLIO_API_URL}/own/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          update((state) => ({
            ...state,
            portfolios: state.portfolios.filter((p) => p.ID !== id),
            loading: false,
          }));
        } else {
          const data = await response.json();
          console.error("Failed to delete portfolio:", data.error);
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("Error deleting portfolio:", error);
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
  };
}

export const portfolioStore = createPortfolioStore();
