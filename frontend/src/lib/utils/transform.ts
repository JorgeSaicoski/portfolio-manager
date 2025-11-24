/**
 * Transformation utilities to convert backend API responses (snake_case/lowercase)
 * to frontend TypeScript interfaces (PascalCase)
 */

import type { Portfolio } from "$lib/stores/portfolio";

// Backend response interfaces (what we actually receive from the API)
interface BackendPortfolio {
  id: number;
  title: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface BackendCategory {
  id: number;
  name: string;
  description?: string;
  portfolio_id: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface BackendProject {
  id: number;
  title: string;
  description: string;
  category_id: number;
  portfolio_id: number;
  owner_id: string;
  start_date?: string;
  end_date?: string;
  client?: string;
  skills?: string[];
  created_at: string;
  updated_at: string;
}

interface BackendSection {
  id: number;
  title: string;
  type: string;
  order: number;
  portfolio_id: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface BackendSectionContent {
  id: number;
  section_id: number;
  content_type: string;
  content: string;
  order: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Transform backend portfolio response to frontend Portfolio interface
 */
export function transformPortfolio(raw: BackendPortfolio): Portfolio {
  return {
    ID: raw.id,
    title: raw.title,
    description: raw.description,
    owner_id: raw.owner_id,
    CreatedAt: raw.created_at,
    UpdatedAt: raw.updated_at,
  };
}

/**
 * Transform array of backend portfolios
 */
export function transformPortfolios(raw: BackendPortfolio[]): Portfolio[] {
  return raw.map(transformPortfolio);
}

/**
 * Transform backend category response to frontend Category interface
 */
export function transformCategory(raw: BackendCategory): any {
  return {
    ID: raw.id,
    name: raw.name,
    description: raw.description,
    portfolio_id: raw.portfolio_id,
    owner_id: raw.owner_id,
    CreatedAt: raw.created_at,
    UpdatedAt: raw.updated_at,
  };
}

/**
 * Transform array of backend categories
 */
export function transformCategories(raw: BackendCategory[]): any[] {
  return raw.map(transformCategory);
}

/**
 * Transform backend project response to frontend Project interface
 */
export function transformProject(raw: BackendProject): any {
  return {
    ID: raw.id,
    title: raw.title,
    description: raw.description,
    category_id: raw.category_id,
    portfolio_id: raw.portfolio_id,
    owner_id: raw.owner_id,
    start_date: raw.start_date,
    end_date: raw.end_date,
    client: raw.client,
    skills: raw.skills,
    CreatedAt: raw.created_at,
    UpdatedAt: raw.updated_at,
  };
}

/**
 * Transform array of backend projects
 */
export function transformProjects(raw: BackendProject[]): any[] {
  return raw.map(transformProject);
}

/**
 * Transform backend section response to frontend Section interface
 */
export function transformSection(raw: BackendSection): any {
  return {
    ID: raw.id,
    title: raw.title,
    type: raw.type,
    order: raw.order,
    portfolio_id: raw.portfolio_id,
    owner_id: raw.owner_id,
    CreatedAt: raw.created_at,
    UpdatedAt: raw.updated_at,
  };
}

/**
 * Transform array of backend sections
 */
export function transformSections(raw: BackendSection[]): any[] {
  return raw.map(transformSection);
}

/**
 * Transform backend section content response to frontend SectionContent interface
 */
export function transformSectionContent(raw: BackendSectionContent): any {
  return {
    ID: raw.id,
    section_id: raw.section_id,
    content_type: raw.content_type,
    content: raw.content,
    order: raw.order,
    owner_id: raw.owner_id,
    CreatedAt: raw.created_at,
    UpdatedAt: raw.updated_at,
  };
}

/**
 * Transform array of backend section contents
 */
export function transformSectionContents(raw: BackendSectionContent[]): any[] {
  return raw.map(transformSectionContent);
}

/**
 * Generic transformation helper for any object with id, created_at, updated_at
 */
export function transformGeneric(raw: any): any {
  const transformed: any = { ...raw };

  // Transform common fields
  if ('id' in raw) {
    transformed.ID = raw.id;
    delete transformed.id;
  }

  if ('created_at' in raw) {
    transformed.CreatedAt = raw.created_at;
    delete transformed.created_at;
  }

  if ('updated_at' in raw) {
    transformed.UpdatedAt = raw.updated_at;
    delete transformed.updated_at;
  }

  return transformed;
}
