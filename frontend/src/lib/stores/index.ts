// Export all stores
export { auth, getAuthHeaders, authenticatedFetch } from "./auth";
export type { User, AuthState, AuthStore } from "./auth";

export { portfolioStore } from "./portfolio";
export type { Portfolio, PortfolioState } from "./portfolio";

export { categoryStore } from "./category";
export type { CategoryState } from "./category";

export { projectStore } from "./project";
export type { ProjectState } from "./project";

export { sectionStore } from "./section";
export type { SectionState } from "./section";

export { sectionContentStore } from "./sectionContent";
export type { SectionContentState } from "./sectionContent";
