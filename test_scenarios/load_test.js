// Load Test Scenario
// Tests normal expected load on the API
// Goal: Validate that the system performs well under typical conditions

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { config, defaultOptions } from './config.js';
import {
  authenticate,
  getAuthHeaders,
  healthCheck,
  randomSleep,
  createTestPortfolio,
  createTestCategory,
  createTestProject,
  createTestSection,
} from './helpers.js';

// Test configuration
export const options = {
  ...defaultOptions,

  // Load test stages
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 10 },   // Stay at 10 users for 1 minute
    { duration: '30s', target: 15 },  // Ramp up to 15 users
    { duration: '2m', target: 15 },   // Stay at 15 users for 2 minutes
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],

  // Custom thresholds for load test
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    'http_req_duration{name:list_portfolios}': ['p(95)<300'],
    'http_req_duration{name:get_portfolio}': ['p(95)<400'],
    'http_req_duration{name:create_portfolio}': ['p(95)<600'],
  },
};

// Setup function - runs once before the test
export function setup() {
  console.log('Starting Load Test...');
  console.log(`Target URL: ${config.baseURL}`);

  // Verify API is healthy
  const isHealthy = healthCheck();
  if (!isHealthy) {
    throw new Error('API health check failed - aborting test');
  }

  // Authenticate (optional - will continue without auth if it fails)
  const token = authenticate();
  if (!token) {
    console.warn('Running test without authentication (some endpoints may fail)');
  }

  console.log('Setup complete - starting load test');
  return { token };
}

// Main test scenario
export default function (data) {
  const ownerId = `load-test-user-${__VU}`;

  // Test 1: List Portfolios (most common read operation)
  group('List Portfolios', () => {
    const response = http.get(
      `${config.baseURL}/api/portfolios/own?page=1&limit=10`,  // Fixed: Use /own route with pagination
      {
        headers: getAuthHeaders(),
        tags: { name: 'list_portfolios' },
      }
    );

    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 300ms': (r) => r.timings.duration < 300,
      'has data': (r) => r.json('data') !== undefined,
    });
  });

  randomSleep(1, 2);

  // Test 2: Create Portfolio
  let portfolioId;
  group('Create Portfolio', () => {
    portfolioId = createTestPortfolio(ownerId);
    check(portfolioId, {
      'portfolio created successfully': (id) => id !== null,
    });
  });

  if (!portfolioId) {
    console.error('Failed to create portfolio, skipping dependent tests');
    return;
  }

  randomSleep(1, 3);

  // Test 3: Get Portfolio Details
  group('Get Portfolio Details', () => {
    const response = http.get(
      `${config.baseURL}/api/portfolios/own/${portfolioId}`,  // Fixed: Use /own route
      {
        headers: getAuthHeaders(),
        tags: { name: 'get_portfolio' },
      }
    );

    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 400ms': (r) => r.timings.duration < 400,
      'has portfolio data': (r) => r.json('title') !== undefined,
    });
  });

  randomSleep(2, 4);

  // Test 4: Create Category
  let categoryId;
  group('Create Category', () => {
    categoryId = createTestCategory(portfolioId);
    check(categoryId, {
      'category created successfully': (id) => id !== null,
    });
  });

  if (categoryId) {
    randomSleep(1, 2);

    // Test 5: Create Project
    group('Create Project', () => {
      const projectId = createTestProject(categoryId);
      check(projectId, {
        'project created successfully': (id) => id !== null,
      });
    });
  }

  randomSleep(1, 3);

  // Test 6: Create Section
  group('Create Section', () => {
    const sectionId = createTestSection(portfolioId);
    check(sectionId, {
      'section created successfully': (id) => id !== null,
    });
  });

  randomSleep(1, 2);

  // Test 7: Update Portfolio
  group('Update Portfolio', () => {
    const updatePayload = JSON.stringify({
      title: `Updated Portfolio ${Date.now()}`,
      description: 'Updated description',
    });

    const response = http.put(
      `${config.baseURL}/api/portfolios/own/${portfolioId}`,  // Fixed: Use /own route
      updatePayload,
      {
        headers: getAuthHeaders(),
        tags: { name: 'update_portfolio' },
      }
    );

    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  randomSleep(2, 4);

  // Test 8: List Portfolios Again (test caching)
  group('List Portfolios (Cached)', () => {
    const response = http.get(
      `${config.baseURL}/api/portfolios/own?page=1&limit=10`,  // Fixed: Use /own route
      {
        headers: getAuthHeaders(),
        tags: { name: 'list_portfolios_cached' },
      }
    );

    check(response, {
      'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
      'response time < 200ms': (r) => r.timings.duration < 200,
    });
  });

  sleep(1);
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('Load test completed');
  console.log('Note: Test data cleanup should be handled by database reset in test environment');
}
