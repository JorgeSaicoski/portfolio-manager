// Spike Test Scenario
// Tests the system's behavior under sudden traffic spikes
// Goal: Verify the system can handle sudden increases in load and recover gracefully

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
} from './helpers.js';

// Test configuration
export const options = {
  ...defaultOptions,

  // Spike test stages - sudden jumps in load
  stages: [
    { duration: '30s', target: 10 },   // Normal load
    { duration: '10s', target: 100 },  // SPIKE! Sudden jump to 100 users
    { duration: '1m', target: 100 },   // Maintain spike
    { duration: '10s', target: 10 },   // Drop back to normal
    { duration: '30s', target: 10 },   // Recover at normal load
    { duration: '10s', target: 150 },  // SPIKE! Even bigger spike
    { duration: '1m', target: 150 },   // Maintain larger spike
    { duration: '10s', target: 10 },   // Drop back to normal
    { duration: '1m', target: 10 },    // Recovery period
    { duration: '10s', target: 0 },    // Ramp down
  ],

  // Thresholds focused on recovery and stability
  thresholds: {
    http_req_duration: ['p(95)<3000'], // More relaxed during spikes
    http_req_failed: ['rate<0.1'], // Allow up to 10% failure during spikes
    'http_req_duration{name:list_portfolios}': ['p(95)<2000'],
  },
};

// Setup function
export function setup() {
  console.log('Starting Spike Test...');
  console.log(`Target URL: ${config.baseURL}`);
  console.log('This test simulates sudden traffic spikes');

  // Verify API is healthy
  const isHealthy = healthCheck();
  if (!isHealthy) {
    console.warn('API health check failed before spike test');
  }

  // Authenticate
  const token = authenticate();
  if (!token) {
    console.warn('Authentication failed - some tests may fail');
  }

  console.log('Setup complete - starting spike test');
  return { token, startTime: Date.now() };
}

// Main test scenario
export default function (data) {
  const ownerId = `spike-test-user-${__VU}`;
  const currentVUs = __VU;

  // Simulate different user behaviors based on VU number
  if (currentVUs % 3 === 0) {
    // 33% of users: Read-heavy behavior
    group('Read-Heavy User', () => {
      // Multiple read operations
      for (let i = 0; i < 5; i++) {
        const response = http.get(
          `${config.baseURL}/api/portfolios/own?page=1&limit=10&offset=${i * 10}`,
          {
            headers: getAuthHeaders(),
            tags: { name: 'list_portfolios' },
          }
        );

        check(response, {
          'status is successful': (r) => r.status >= 200 && r.status < 400,
        });

        sleep(0.5);
      }
    });
  } else if (currentVUs % 3 === 1) {
    // 33% of users: Write-heavy behavior
    group('Write-Heavy User', () => {
      // Create multiple resources
      const portfolioId = createTestPortfolio(ownerId);
      sleep(0.3);

      if (portfolioId) {
        for (let i = 0; i < 3; i++) {
          createTestCategory(portfolioId);
          sleep(0.4);
        }
      }
    });
  } else {
    // 34% of users: Mixed behavior
    group('Mixed Behavior User', () => {
      // Read
      http.get(`${config.baseURL}/api/portfolios/own?page=1&limit=5`, {
        headers: getAuthHeaders(),
        tags: { name: 'list_portfolios' },
      });

      sleep(0.5);

      // Write
      const portfolioId = createTestPortfolio(ownerId);

      sleep(0.5);

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
          'portfolio retrieved': (r) => r.status === 200,
        });
      }

      sleep(0.5);

      // Update
      if (portfolioId) {
        const updatePayload = JSON.stringify({
          title: `Spike Test ${Date.now()}`,
          description: 'Updated during spike test',
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
  }

  // Test system health during spike
  group('Health Check During Spike', () => {
    const response = http.get(`${config.baseURL}/health`);

    check(response, {
      'health endpoint responsive': (r) => r.status === 200,
      'database still connected': (r) => {
        try {
          return r.json('database') === 'connected';
        } catch {
          return false;
        }
      },
    });
  });

  randomSleep(0.5, 1.5);
}

// Teardown function
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Spike test completed in ${duration.toFixed(2)} seconds`);
  console.log('Key metrics to review:');
  console.log('- Response time during spikes');
  console.log('- Error rate during traffic spikes');
  console.log('- System recovery time after spike');
  console.log('- Resource utilization during peaks');

  // Final health check
  sleep(5); // Wait a bit for system to stabilize
  const isHealthy = healthCheck();
  if (isHealthy) {
    console.log('✓ System recovered successfully after spike test');
  } else {
    console.warn('⚠ System may not have fully recovered - check logs');
  }
}
