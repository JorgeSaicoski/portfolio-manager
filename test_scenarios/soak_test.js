// Soak Test Scenario (Endurance Test)
// Tests the system's behavior over an extended period
// Goal: Identify memory leaks, connection pool issues, and long-term stability problems

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

  // Soak test stages - sustained load over extended period
  stages: [
    { duration: '2m', target: 10 },    // Ramp up
    { duration: '2m', target: 20 },    // Increase to moderate load
    { duration: '26m', target: 20 },   // Maintain for 26 minutes (total 30 min soak)
    { duration: '2m', target: 0 },     // Ramp down
  ],

  // Thresholds for long-running test
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.02'], // Allow 2% failure rate
    'http_req_duration{name:list_portfolios}': ['p(95)<500'],
    'http_req_duration{name:get_portfolio}': ['p(95)<600'],
    'http_req_duration{name:create_portfolio}': ['p(95)<800'],

    // Check for performance degradation over time
    'http_req_duration{phase:early}': ['p(95)<600'],
    'http_req_duration{phase:late}': ['p(95)<800'], // Allow some degradation
  },
};

// Setup function
export function setup() {
  console.log('Starting Soak Test (30 minutes)...');
  console.log(`Target URL: ${config.baseURL}`);
  console.log('This test will run for an extended period to detect:');
  console.log('- Memory leaks');
  console.log('- Connection pool exhaustion');
  console.log('- Resource cleanup issues');
  console.log('- Performance degradation over time');

  // Verify API is healthy
  const isHealthy = healthCheck();
  if (!isHealthy) {
    throw new Error('API health check failed - aborting soak test');
  }

  // Authenticate
  const token = authenticate();
  if (!token) {
    throw new Error('Authentication failed - aborting soak test');
  }

  console.log('Setup complete - starting soak test');
  return { token, startTime: Date.now() };
}

// Main test scenario
export default function (data) {
  const ownerId = `soak-test-user-${__VU}`;
  const elapsed = (Date.now() - data.startTime) / 1000 / 60; // minutes
  const phase = elapsed < 15 ? 'early' : 'late'; // First half vs second half

  // Realistic user workflow
  group('User Session', () => {
    // 1. User lists their portfolios
    group('Browse Portfolios', () => {
      const response = http.get(
        `${config.baseURL}/api/portfolios/own?page=1&limit=10&offset=0`,
        {
          headers: getAuthHeaders(),
          tags: { name: 'list_portfolios', phase: phase },
        }
      );

      check(response, {
        'portfolios listed': (r) => r.status === 200,
        'response time acceptable': (r) => r.timings.duration < 800,
        'has data structure': (r) => {
          try {
            return r.json('data') !== undefined;
          } catch {
            return false;
          }
        },
      });
    });

    randomSleep(2, 4);

    // 2. User creates a new portfolio
    let portfolioId;
    group('Create Portfolio', () => {
      portfolioId = createTestPortfolio(ownerId);

      check(portfolioId, {
        'portfolio created': (id) => id !== null,
      });
    });

    if (!portfolioId) {
      console.error('Portfolio creation failed, skipping dependent operations');
      sleep(5);
      return;
    }

    randomSleep(3, 5);

    // 3. User views the portfolio details
    group('View Portfolio', () => {
      const response = http.get(
        `${config.baseURL}/api/portfolios/own/${portfolioId}`,
        {
          headers: getAuthHeaders(),
          tags: { name: 'get_portfolio', phase: phase },
        }
      );

      check(response, {
        'portfolio retrieved': (r) => r.status === 200,
        'has portfolio data': (r) => r.json('title') !== undefined,
      });
    });

    randomSleep(2, 4);

    // 4. User adds sections to portfolio
    group('Add Sections', () => {
      const sectionTypes = ['about', 'skills', 'experience'];
      sectionTypes.forEach((type) => {
        const sectionId = createTestSection(portfolioId, type);
        check(sectionId, {
          [`${type} section created`]: (id) => id !== null,
        });
        sleep(1);
      });
    });

    randomSleep(3, 6);

    // 5. User creates categories
    let categoryId;
    group('Create Categories', () => {
      categoryId = createTestCategory(portfolioId);
      check(categoryId, {
        'category created': (id) => id !== null,
      });
    });

    randomSleep(2, 3);

    // 6. User adds projects to category
    if (categoryId) {
      group('Add Projects', () => {
        for (let i = 0; i < 2; i++) {
          const projectId = createTestProject(categoryId);
          check(projectId, {
            'project created': (id) => id !== null,
          });
          sleep(2);
        }
      });

      randomSleep(2, 4);
    }

    // 7. User updates portfolio
    group('Update Portfolio', () => {
      const updatePayload = JSON.stringify({
        title: `Updated Portfolio ${Date.now()}`,
        description: `Updated during soak test at ${elapsed.toFixed(2)} minutes`,
      });

      const response = http.put(
        `${config.baseURL}/api/portfolios/own/${portfolioId}`,
        updatePayload,
        {
          headers: getAuthHeaders(),
          tags: { name: 'update_portfolio', phase: phase },
        }
      );

      check(response, {
        'portfolio updated': (r) => r.status === 200,
      });
    });

    randomSleep(3, 5);

    // 8. User browses portfolios again
    group('Browse Portfolios Again', () => {
      http.get(`${config.baseURL}/api/portfolios/own?page=1&limit=20&offset=0`, {
        headers: getAuthHeaders(),
        tags: { name: 'list_portfolios', phase: phase },
      });
    });

    randomSleep(2, 4);
  });

  // Periodic health check
  if (__ITER % 10 === 0) {
    group('System Health Check', () => {
      const response = http.get(`${config.baseURL}/health`);

      check(response, {
        'system healthy': (r) => r.status === 200,
        'database connected': (r) => {
          try {
            return r.json('database') === 'connected';
          } catch {
            return false;
          }
        },
      });
    });
  }

  // Longer sleep between iterations to simulate real user behavior
  randomSleep(5, 10);
}

// Teardown function
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;
  console.log(`Soak test completed after ${duration.toFixed(2)} minutes`);

  // Final health check
  sleep(5);
  const isHealthy = healthCheck();

  if (isHealthy) {
    console.log('✓ System remained healthy throughout the soak test');
  } else {
    console.warn('⚠ System health degraded during soak test');
  }

  console.log('\nRecommended post-test analysis:');
  console.log('1. Check memory usage trends over time');
  console.log('2. Verify database connection pool metrics');
  console.log('3. Review response time degradation (early vs late)');
  console.log('4. Check for any resource leaks in application logs');
  console.log('5. Monitor database query performance over time');
  console.log('6. Verify no goroutine leaks (if using Go profiling)');
}
