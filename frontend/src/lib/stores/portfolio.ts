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
      console.log(`=== GET OWN PORTFOLIOS (page=${page}, limit=${limit}) ===`);
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${PORTFOLIO_API_URL}/own?page=${page}&limit=${limit}`
        );

        console.log("GET portfolios response status:", response.status);
        const data = await response.json();
        console.log("GET portfolios full response:", data);
        console.log("Response data field:", data.data);
        console.log("Response data type:", typeof data.data, Array.isArray(data.data) ? "is array" : "not array");

        if (response.ok) {
          const portfolios = data.data; // FIXED: Was data.portfolios, should be data.data
          console.log("Extracted portfolios:", portfolios);
          console.log("Portfolios count:", portfolios?.length || 0);

          update((state) => ({
            ...state,
            portfolios: portfolios || [],
            loading: false,
          }));
          return portfolios;
        } else {
          console.error("GET portfolios failed:", data.error);
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("GET portfolios error:", error);
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
      console.log(`=== GET PORTFOLIO BY ID (id=${id}) ===`);
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        // Use regular fetch (not authenticatedFetch) since it's a public route
        const response = await fetch(`${API_BASE_URL}/portfolios/id/${id}`);
        console.log("GET by ID response status:", response.status);

        const data = await response.json();
        console.log("GET by ID full response:", data);
        console.log("Response data field:", data.data);

        if (response.ok) {
          const portfolio = data.data; // FIXED: Was data.portfolio, should be data.data
          console.log("Extracted portfolio:", portfolio);

          update((state) => ({
            ...state,
            currentPortfolio: portfolio,
            loading: false,
          }));
          return data;
        } else {
          console.error("GET by ID failed:", data.error);
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("GET by ID error:", error);
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
      console.log("=== CREATE PORTFOLIO ===");
      console.log("Data being sent to API:", portfolioData);
      console.log("Stringified data:", JSON.stringify(portfolioData));

      update((state) => {
        console.log("Current state before create:", state);
        console.log("Current portfolios array:", state.portfolios);
        console.log("Portfolios array length:", state.portfolios?.length);
        return { ...state, loading: true, error: null };
      });

      try {
        const response = await authenticatedFetch(`${PORTFOLIO_API_URL}/own`, {
          method: "POST",
          body: JSON.stringify(portfolioData),
        });

        console.log("CREATE response status:", response.status);
        console.log("CREATE response headers:", Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log("CREATE full response:", data);
        console.log("Response data field:", data.data);

        if (response.ok) {
          const newPortfolio = data.data; // FIXED: Was data.portfolio, should be data.data
          console.log("Portfolio created successfully:", newPortfolio);

          update((state) => {
            console.log("State portfolios before adding:", state.portfolios);
            const updatedPortfolios = [...(state.portfolios || []), newPortfolio];
            console.log("Updated portfolios array:", updatedPortfolios);
            return {
              ...state,
              portfolios: updatedPortfolios,
              loading: false,
            };
          });
          return data;
        } else {
          console.error("Portfolio creation failed:", data.error);
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("Portfolio creation error:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : "N/A");
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
      console.log(`=== UPDATE PORTFOLIO (id=${id}) ===`);
      console.log("Update data:", portfolioData);

      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${PORTFOLIO_API_URL}/own/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(portfolioData),
          }
        );

        console.log("UPDATE response status:", response.status);
        const data = await response.json();
        console.log("UPDATE full response:", data);
        console.log("Response data field:", data.data);

        if (response.ok) {
          const updatedPortfolio = data.data; // FIXED: Was data.portfolio, should be data.data
          console.log("Portfolio updated successfully:", updatedPortfolio);

          update((state) => ({
            ...state,
            portfolios: state.portfolios.map((p) =>
              p.ID === id ? updatedPortfolio : p
            ),
            loading: false,
          }));
          return data;
        } else {
          console.error("UPDATE failed:", data.error);
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("UPDATE error:", error);
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
      console.log(`=== DELETE PORTFOLIO (id=${id}) ===`);
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(
          `${PORTFOLIO_API_URL}/own/${id}`,
          {
            method: "DELETE",
          }
        );

        console.log("DELETE response status:", response.status);

        if (response.ok) {
          console.log(`Portfolio ${id} deleted successfully`);
          update((state) => {
            const filtered = state.portfolios.filter((p) => p.ID !== id);
            console.log("Remaining portfolios after delete:", filtered);
            return {
              ...state,
              portfolios: filtered,
              loading: false,
            };
          });
        } else {
          const data = await response.json();
          console.error("DELETE failed:", data.error);
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("DELETE error:", error);
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
