import { writable } from "svelte/store";
import { authenticatedFetch } from "./auth";
import { browser } from "$app/environment";
import { transformPortfolio, transformPortfolios } from "$lib/utils/transform";

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

interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

function createPortfolioStore() {
  const { subscribe, update } = writable<PortfolioState>({
    portfolios: [],
    loading: false,
    error: null,
    currentPortfolio: null,
  });

  // Portfolio store initialized

  return {
    subscribe,

    async getOwn(page = 1, limit = 10) {
      const url = `${PORTFOLIO_API_URL}/own?page=${page}&limit=${limit}`;
      // request: GET ${url}

      update((state: PortfolioState) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(url);
        const data: ApiResponse<any[]> = await response.json();

        // response logged

        if (response.ok) {
          const rawPortfolios = data.data || [];
          const portfolios = transformPortfolios(rawPortfolios);
          // getOwn.success

          update((state: PortfolioState) => ({
            ...state,
            portfolios,
            loading: false,
          }));
          return portfolios;
        } else {
          // failed to load portfolios
          throw new Error(data.error || "Failed to load portfolios");
        }
      } catch (error) {
        // error loading portfolios
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state: PortfolioState) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    async getById(id: number) {
      const url = `${API_BASE_URL}/portfolios/id/${id}`;
      // request: GET ${url}

      update((state: PortfolioState) => ({ ...state, loading: true, error: null }));

      try {
        // Use regular fetch (not authenticatedFetch) since it's a public route
        const response = await fetch(url);
        const data: ApiResponse<any> = await response.json();

        // response logged

        if (response.ok) {
          const rawPortfolio = data.data;
          const portfolio = rawPortfolio ? transformPortfolio(rawPortfolio) : null;
          // getById.success

          update((state: PortfolioState) => ({
            ...state,
            currentPortfolio: portfolio,
            loading: false,
          }));
          return { ...data, data: portfolio };
        } else {
          // failed to load portfolio
          throw new Error(data.error || "Failed to load portfolio");
        }
      } catch (error) {
        // error loading portfolio
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state: PortfolioState) => ({
          ...state,
          loading: false,
          error: errorMessage,
          currentPortfolio: null,
        }));
        throw error;
      }
    },

    async create(portfolioData: Partial<Portfolio>) {
      const url = `${PORTFOLIO_API_URL}/own`;
      // request: POST ${url}

      update((state: PortfolioState) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(url, {
          method: "POST",
          body: JSON.stringify(portfolioData),
        });
        const data: ApiResponse<any> = await response.json();

        // response logged

        if (response.ok) {
          const rawPortfolio = data.data;
          const newPortfolio = rawPortfolio ? transformPortfolio(rawPortfolio) : null;
          // create.success

          update((state: PortfolioState) => ({
            ...state,
            portfolios: [...(state.portfolios || []), newPortfolio!],
            loading: false,
          }));
          return { ...data, data: newPortfolio };
        } else {
          // failed to create portfolio
          throw new Error(data.error || "Failed to create portfolio");
        }
      } catch (error) {
        // error creating portfolio
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state: PortfolioState) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    async update(id: number, portfolioData: Partial<Portfolio>) {
      const url = `${PORTFOLIO_API_URL}/own/${id}`;
      // request: PUT ${url}

      update((state: PortfolioState) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(url, {
          method: "PUT",
          body: JSON.stringify(portfolioData),
        });
        const data: ApiResponse<any> = await response.json();

        // response logged

        if (response.ok) {
          const rawPortfolio = data.data;
          const updatedPortfolio = rawPortfolio ? transformPortfolio(rawPortfolio) : null;
          // update.success

          update((state: PortfolioState) => ({
            ...state,
            portfolios: state.portfolios.map((p: Portfolio) =>
              p.ID === id ? updatedPortfolio! : p
            ),
            loading: false,
          }));
          return { ...data, data: updatedPortfolio };
        } else {
          // failed to update portfolio
          throw new Error(data.error || "Failed to update portfolio");
        }
      } catch (error) {
        // error updating portfolio
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state: PortfolioState) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    async delete(id: number) {
      const url = `${PORTFOLIO_API_URL}/own/${id}`;
      // request: DELETE ${url}

      update((state: PortfolioState) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(url, {
          method: "DELETE",
        });

        // response logged

        if (response.ok) {
          // delete.success

          update((state: PortfolioState) => ({
            ...state,
            portfolios: state.portfolios.filter((p: Portfolio) => p.ID !== id),
            loading: false,
          }));
        } else {
          const data: ApiResponse = await response.json();
          // failed to delete portfolio
          throw new Error(data.error || "Failed to delete portfolio");
        }
      } catch (error) {
        // error deleting portfolio
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        update((state: PortfolioState) => ({
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
