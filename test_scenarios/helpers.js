// k6 Test Helpers
// Common utility functions used across all test scenarios

import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from './config.js';

// Authentication token cache
let authToken = null;

/**
 * Authenticate and get JWT token
 * @returns {string} JWT token or null if auth is disabled/failed
 */
export function authenticate() {
  if (authToken) {
    return authToken;
  }

  // Check if authentication is disabled via environment variable
  if (__ENV.K6_SKIP_AUTH === 'true') {
    console.log('Authentication skipped (K6_SKIP_AUTH=true)');
    return null;
  }

  const loginPayload = JSON.stringify({
    email: config.testUser.email,
    password: config.testUser.password,
  });

  try {
    const response = http.post(
      `${config.authURL}/api/auth/login`,  // Correct path with /api prefix
      loginPayload,
      { headers: config.headers }
    );

    check(response, {
      'authentication successful': (r) => r.status === 200,
      'token received': (r) => {
        try {
          return r.json('token') !== undefined;
        } catch {
          return false;
        }
      },
    });

    if (response.status === 200) {
      authToken = response.json('token');
      return authToken;
    }

    console.warn('Authentication failed:', response.status, response.body);
    return null;
  } catch (error) {
    console.warn('Authentication error (auth service may not be running):', error);
    console.log('Continuing without authentication - set K6_SKIP_AUTH=true to suppress this warning');
    return null;
  }
}

/**
 * Get authorization headers with JWT token
 * @returns {object} Headers object with authorization (if available)
 */
export function getAuthHeaders() {
  const token = authenticate();
  if (token) {
    return {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  // Return headers without auth if token is not available
  return { ...config.headers };
}

/**
 * Generate random test data for portfolio creation
 * @param {string} ownerId - Owner ID for the portfolio
 * @returns {object} Portfolio data
 */
export function generatePortfolio(ownerId) {
  const timestamp = Date.now();
  return {
    title: `Test Portfolio ${timestamp}`,
    description: `This is a test portfolio created at ${new Date().toISOString()}`,
    ownerId: ownerId || 'test-owner-id',
  };
}

/**
 * Generate random test data for category creation
 * @param {number} portfolioId - Portfolio ID
 * @returns {object} Category data
 */
export function generateCategory(portfolioId) {
  const timestamp = Date.now();
  return {
    title: `Test Category ${timestamp}`,
    description: `Test category description`,
    portfolioId: portfolioId,
    position: 0,
  };
}

/**
 * Generate random test data for section creation
 * @param {number} portfolioId - Portfolio ID
 * @param {string} type - Section type
 * @returns {object} Section data
 */
export function generateSection(portfolioId, type = 'about') {
  const timestamp = Date.now();
  return {
    title: `Test Section ${timestamp}`,
    description: `Test section description`,
    type: type,
    portfolioId: portfolioId,
    position: 0,
  };
}

/**
 * Generate random test data for project creation
 * @param {number} categoryId - Category ID
 * @returns {object} Project data
 */
export function generateProject(categoryId) {
  const timestamp = Date.now();
  return {
    title: `Test Project ${timestamp}`,
    description: `Test project description for load testing`,
    mainImage: 'https://example.com/image.jpg',
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    skills: ['JavaScript', 'Go', 'React'],
    client: 'Test Client',
    link: 'https://example.com',
    categoryId: categoryId,
    position: 0,
  };
}

/**
 * Perform a health check on the API
 * @returns {boolean} True if healthy
 */
export function healthCheck() {
  const response = http.get(`${config.baseURL}/health`);
  return check(response, {
    'health check successful': (r) => r.status === 200,
    'service is healthy': (r) => {
      try {
        const status = r.json('status');
        // Accept both "ok" and "healthy" for compatibility
        return status === 'ok' || status === 'healthy';
      } catch {
        return false;
      }
    },
  });
}

/**
 * Wait for a random duration between min and max milliseconds
 * @param {number} min - Minimum wait time in seconds
 * @param {number} max - Maximum wait time in seconds
 */
export function randomSleep(min = 1, max = 3) {
  const duration = min + Math.random() * (max - min);
  sleep(duration);
}

/**
 * Create a portfolio and return its ID
 * @param {string} ownerId - Owner ID
 * @returns {number|null} Portfolio ID or null on failure
 */
export function createTestPortfolio(ownerId) {
  const payload = JSON.stringify(generatePortfolio(ownerId));
  const response = http.post(
    `${config.baseURL}/api/portfolios/own`,  // Fixed: Use /own route
    payload,
    { headers: getAuthHeaders() }
  );

  if (check(response, { 'portfolio created': (r) => r.status === 201 })) {
    return response.json('id');
  }
  return null;
}

/**
 * Create a category and return its ID
 * @param {number} portfolioId - Portfolio ID
 * @returns {number|null} Category ID or null on failure
 */
export function createTestCategory(portfolioId) {
  const payload = JSON.stringify(generateCategory(portfolioId));
  const response = http.post(
    `${config.baseURL}/api/categories/own`,  // Fixed: Use /own route
    payload,
    { headers: getAuthHeaders() }
  );

  if (check(response, { 'category created': (r) => r.status === 201 })) {
    return response.json('id');
  }
  return null;
}

/**
 * Create a section and return its ID
 * @param {number} portfolioId - Portfolio ID
 * @returns {number|null} Section ID or null on failure
 */
export function createTestSection(portfolioId) {
  const payload = JSON.stringify(generateSection(portfolioId));
  const response = http.post(
    `${config.baseURL}/api/sections/own`,  // Fixed: Use /own route
    payload,
    { headers: getAuthHeaders() }
  );

  if (check(response, { 'section created': (r) => r.status === 201 })) {
    return response.json('id');
  }
  return null;
}

/**
 * Create a project and return its ID
 * @param {number} categoryId - Category ID
 * @returns {number|null} Project ID or null on failure
 */
export function createTestProject(categoryId) {
  const payload = JSON.stringify(generateProject(categoryId));
  const response = http.post(
    `${config.baseURL}/api/projects/own`,  // Fixed: Use /own route
    payload,
    { headers: getAuthHeaders() }
  );

  if (check(response, { 'project created': (r) => r.status === 201 })) {
    return response.json('id');
  }
  return null;
}

/**
 * Cleanup function to delete created test data
 * @param {string} resourceType - Type of resource (portfolios, categories, sections, projects)
 * @param {number} resourceId - ID of the resource to delete
 */
export function cleanup(resourceType, resourceId) {
  if (!resourceId) return;

  const response = http.del(
    `${config.baseURL}/api/${resourceType}/${resourceId}`,
    null,
    { headers: getAuthHeaders() }
  );

  check(response, {
    [`${resourceType} deleted`]: (r) => r.status === 200 || r.status === 204,
  });
}
