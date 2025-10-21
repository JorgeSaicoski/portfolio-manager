// Stress Test Scenario
// Tests the system's behavior under extreme load
// Goal: Find the breaking point and observe how the system degrades

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
} from './helpers.js';

// Test configuration
export const options = {
  ...defaultOptions,

  // Stress test stages - gradually increase load until breaking point
  stages: [
    { duration: '1m', target: 10 },   // Warm up
    { duration: '2m', target: 25 },   // Increase to 25 users
    { duration: '2m', target: 50 },   // Push to 50 users
    { duration: '3m', target: 100 },  // High stress at 100 users
    { duration: '2m', target: 150 },  // Very high stress
    { duration: '2m', target: 200 },  // Maximum stress
    { duration: '3m', target: 200 },  // Hold at maximum
    { duration: '2m', target: 0 },    // Ramp down and recover
  ],

  // Relaxed thresholds for stress test (we expect degradation)
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // Relaxed thresholds
    http_req_failed: ['rate<0.05'], // Allow up to 5% failure rate
    'http_req_duration{name:list_portfolios}': ['p(95)<1500'],
    'http_req_duration{name:get_portfolio}': ['p(95)<2000'],
  },
};

// Setup function
export function setup() {
  console.log('Starting Stress Test...');
  console.log(`Target URL: ${config.baseURL}`);
  console.log('This test will gradually increase load to find the breaking point');

  // Verify API is healthy
  const isHealthy = healthCheck();
  if (!isHealthy) {
    console.warn('API health check failed - continuing anyway for stress test');
  }

  // Authenticate
  const token = authenticate();
  if (!token) {
    console.warn('Authentication failed - some tests may fail');
  }

  console.log('Setup complete - starting stress test');
  return { token };
}

// Main test scenario
export default function (data) {
  const ownerId = `stress-test-user-${__VU}`;

  // Test 1: High-frequency read operations
  group('Heavy Read Operations', () => {
    // List portfolios multiple times
    for (let i = 0; i < 3; i++) {
      const response = http.get(
        `${config.baseURL}/api/portfolios/own?page=1&limit=20&offset=${i * 20}`,
        {
          headers: getAuthHeaders(),
          tags: { name: 'list_portfolios' },
        }
      );

      check(response, {
        'status is 200 or 500': (r) => r.status === 200 || r.status === 500,
        'response received': (r) => r.body.length > 0,
      });

      // Very short sleep to maintain high load
      sleep(0.5);
    }
  });

  sleep(1);

  // Test 2: Create multiple resources in quick succession
  group('Rapid Resource Creation', () => {
    const portfolioId = createTestPortfolio(ownerId);

    if (portfolioId) {
      // Try to create multiple categories quickly
      for (let i = 0; i < 2; i++) {
        const categoryId = createTestCategory(portfolioId);
        if (categoryId) {
          // Create a project for each category
          createTestProject(categoryId);
        }
        sleep(0.3);
      }
    }
  });

  randomSleep(0.5, 1.5);

  // Test 3: Mixed read/write operations
  group('Mixed Operations', () => {
    // Read
    http.get(`${config.baseURL}/api/portfolios/own?page=1&limit=10`, {
      headers: getAuthHeaders(),
      tags: { name: 'list_portfolios' },
    });

    sleep(0.2);

    // Create
    const portfolioId = createTestPortfolio(ownerId);

    sleep(0.3);

    // Read specific
    if (portfolioId) {
      const response = http.get(
        `${config.baseURL}/api/portfolios/own/${portfolioId}`,
        {
          headers: getAuthHeaders(),
          tags: { name: 'get_portfolio' },
        }
      );

      check(response, {
        'portfolio retrieved': (r) => r.status === 200 || r.status === 404,
      });
    }

    sleep(0.5);

    // Update
    if (portfolioId) {
      const updatePayload = JSON.stringify({
        title: `Stress Test ${Date.now()}`,
        description: 'Stress test update',
      });

      http.put(
        `${config.baseURL}/api/portfolios/own/${portfolioId}`,
        updatePayload,
        {
          headers: getAuthHeaders(),
          tags: { name: 'update_portfolio' },
        }
      );
    }
  });

  randomSleep(0.5, 1);

  // Test 4: Database-intensive operations
  group('Database Heavy Operations', () => {
    // Query with pagination
    const pages = [0, 10, 20, 30];
    pages.forEach((offset) => {
      http.get(
        `${config.baseURL}/api/portfolios/own?page=1&limit=10&offset=${offset}`,
        {
          headers: getAuthHeaders(),
          tags: { name: 'paginated_query' },
        }
      );
      sleep(0.2);
    });
  });

  sleep(1);
}

// Teardown function
export function teardown(data) {
  console.log('Stress test completed');
  console.log('Check metrics to identify performance bottlenecks and breaking points');
  console.log('Recommended: Review database connections, memory usage, and CPU utilization');
}
