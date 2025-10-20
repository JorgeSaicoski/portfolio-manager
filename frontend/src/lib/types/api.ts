// API Response Types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  message?: string;
}

// Portfolio Types
export interface Portfolio {
  ID: number;
  title: string;
  description?: string | null;
  owner_id: string;
  CreatedAt: string;
  UpdatedAt: string;
  categories?: Category[];
  sections?: Section[];
}

export interface CreatePortfolioRequest {
  title: string;
  description?: string;
}

export interface UpdatePortfolioRequest {
  title?: string;
  description?: string;
}

// Category Types
export interface Category {
  ID: number;
  title: string;
  description?: string | null;
  position: number;
  portfolio_id: number;
  owner_id: string;
  CreatedAt: string;
  UpdatedAt: string;
  projects?: Project[];
}

export interface CreateCategoryRequest {
  title: string;
  description?: string;
  portfolio_id: number;
}

export interface UpdateCategoryRequest {
  title?: string;
  description?: string;
}

// Project Types
export interface Project {
  ID: number;
  title: string;
  images?: string[];
  main_image?: string;
  description: string;
  skills?: string[];
  client?: string;
  link?: string;
  position: number;
  category_id: number;
  owner_id: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  images?: string[];
  main_image?: string;
  description: string;
  skills?: string[];
  client?: string;
  link?: string;
  category_id: number;
}

export interface UpdateProjectRequest {
  title?: string;
  images?: string[];
  main_image?: string;
  description?: string;
  skills?: string[];
  client?: string;
  link?: string;
}

// Section Types
export interface Section {
  ID: number;
  title: string;
  description?: string | null;
  type: string;
  position: number;
  portfolio_id: number;
  owner_id: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateSectionRequest {
  title: string;
  description?: string;
  type: string;
  portfolio_id: number;
}

export interface UpdateSectionRequest {
  title?: string;
  description?: string;
  type?: string;
}

// Pagination Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Search Parameters
export interface ProjectSearchParams {
  skills?: string[];
  client?: string;
}

export interface SectionFilterParams {
  type?: string;
  portfolio_id?: number;
}
