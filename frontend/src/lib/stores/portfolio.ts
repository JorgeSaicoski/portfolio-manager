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
          update((state) => ({
            ...state,
            portfolios: data.portfolios,
            loading: false,
          }));
          console.log("Portfolios")
          console.log(data.portfolios)
          return data.portfolios;
        } else {
          throw new Error(data.error);
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

    async getById(id: number) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        // Use regular fetch (not authenticatedFetch) since it's a public route
        const response = await fetch(`${API_BASE_URL}/portfolios/id/${id}`);
        const data = await response.json();

        if (response.ok) {
          update((state) => ({
            ...state,
            currentPortfolio: data.portfolio,
            loading: false,
          }));
          return data;
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
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
          update((state) => ({
            ...state,
            portfolios: [...state.portfolios, data.portfolio],
            loading: false,
          }));
          return data;
        } else {
          throw new Error(data.error);
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
          update((state) => ({
            ...state,
            portfolios: state.portfolios.map((p) =>
              p.ID === id ? data.portfolio : p
            ),
            loading: false,
          }));
          return data;
        } else {
          throw new Error(data.error);
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
          throw new Error(data.error);
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
  };
}

export const portfolioStore = createPortfolioStore();
