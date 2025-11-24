import { writable } from "svelte/store";
import { authenticatedFetch } from "./auth";
import { browser } from "$app/environment";
import { createDebugLogger } from "$lib/utils/debug";
import { transformPortfolio, transformPortfolios } from "$lib/utils/transform";

const debug = createDebugLogger("PortfolioStore");

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

  debug.info("Portfolio store initialized", { API_BASE_URL, PORTFOLIO_API_URL });

  return {
    subscribe,

    async getOwn(page = 1, limit = 10) {
      const url = `${PORTFOLIO_API_URL}/own?page=${page}&limit=${limit}`;
      debug.request({ method: "GET", url });
      debug.storeUpdate("portfolioStore", "getOwn", { page, limit });

      update((state: PortfolioState) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(url);
        const data: ApiResponse<any[]> = await response.json();

        debug.response({
          url,
          status: response.status,
          statusText: response.statusText,
          data
        });

        if (response.ok) {
          const rawPortfolios = data.data || [];
          const portfolios = transformPortfolios(rawPortfolios);
          debug.storeUpdate("portfolioStore", "getOwn.success", {
            portfoliosCount: portfolios.length,
            portfolios
          });

          update((state: PortfolioState) => ({
            ...state,
            portfolios,
            loading: false,
          }));
          return portfolios;
        } else {
          debug.error("Failed to load portfolios", data.error);
          throw new Error(data.error || "Failed to load portfolios");
        }
      } catch (error) {
        debug.error("Error loading portfolios", error);
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
      debug.request({ method: "GET", url });
      debug.storeUpdate("portfolioStore", "getById", { id });

      update((state: PortfolioState) => ({ ...state, loading: true, error: null }));

      try {
        // Use regular fetch (not authenticatedFetch) since it's a public route
        const response = await fetch(url);
        const data: ApiResponse<any> = await response.json();

        debug.response({
          url,
          status: response.status,
          statusText: response.statusText,
          data
        });

        if (response.ok) {
          const rawPortfolio = data.data;
          const portfolio = rawPortfolio ? transformPortfolio(rawPortfolio) : null;
          debug.storeUpdate("portfolioStore", "getById.success", { portfolio });

          update((state: PortfolioState) => ({
            ...state,
            currentPortfolio: portfolio,
            loading: false,
          }));
          return { ...data, data: portfolio };
        } else {
          debug.error("Failed to load portfolio", data.error);
          throw new Error(data.error || "Failed to load portfolio");
        }
      } catch (error) {
        debug.error("Error loading portfolio", error);
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
      debug.request({ method: "POST", url, body: portfolioData });
      debug.storeUpdate("portfolioStore", "create", { portfolioData });

      update((state: PortfolioState) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(url, {
          method: "POST",
          body: JSON.stringify(portfolioData),
        });
        const data: ApiResponse<any> = await response.json();

        debug.response({
          url,
          status: response.status,
          statusText: response.statusText,
          data
        });

        if (response.ok) {
          const rawPortfolio = data.data;
          const newPortfolio = rawPortfolio ? transformPortfolio(rawPortfolio) : null;
          debug.storeUpdate("portfolioStore", "create.success", { newPortfolio });

          update((state: PortfolioState) => ({
            ...state,
            portfolios: [...(state.portfolios || []), newPortfolio!],
            loading: false,
          }));
          return { ...data, data: newPortfolio };
        } else {
          debug.error("Failed to create portfolio", data.error);
          throw new Error(data.error || "Failed to create portfolio");
        }
      } catch (error) {
        debug.error("Error creating portfolio", error);
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
      debug.request({ method: "PUT", url, body: portfolioData });
      debug.storeUpdate("portfolioStore", "update", { id, portfolioData });

      update((state: PortfolioState) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(url, {
          method: "PUT",
          body: JSON.stringify(portfolioData),
        });
        const data: ApiResponse<any> = await response.json();

        debug.response({
          url,
          status: response.status,
          statusText: response.statusText,
          data
        });

        if (response.ok) {
          const rawPortfolio = data.data;
          const updatedPortfolio = rawPortfolio ? transformPortfolio(rawPortfolio) : null;
          debug.storeUpdate("portfolioStore", "update.success", { updatedPortfolio });

          update((state: PortfolioState) => ({
            ...state,
            portfolios: state.portfolios.map((p: Portfolio) =>
              p.ID === id ? updatedPortfolio! : p
            ),
            loading: false,
          }));
          return { ...data, data: updatedPortfolio };
        } else {
          debug.error("Failed to update portfolio", data.error);
          throw new Error(data.error || "Failed to update portfolio");
        }
      } catch (error) {
        debug.error("Error updating portfolio", error);
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
      debug.request({ method: "DELETE", url });
      debug.storeUpdate("portfolioStore", "delete", { id });

      update((state: PortfolioState) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(url, {
          method: "DELETE",
        });

        debug.response({
          url,
          status: response.status,
          statusText: response.statusText,
          data: response.ok ? "Success" : "Failed"
        });

        if (response.ok) {
          debug.storeUpdate("portfolioStore", "delete.success", { id });

          update((state: PortfolioState) => ({
            ...state,
            portfolios: state.portfolios.filter((p: Portfolio) => p.ID !== id),
            loading: false,
          }));
        } else {
          const data: ApiResponse = await response.json();
          debug.error("Failed to delete portfolio", data.error);
          throw new Error(data.error || "Failed to delete portfolio");
        }
      } catch (error) {
        debug.error("Error deleting portfolio", error);
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
