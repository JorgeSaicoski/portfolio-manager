// k6 Test Configuration
// This file contains common configuration and constants for all test scenarios

export const config = {
  // Base URL for the API (override with K6_BASE_URL environment variable)
  baseURL: __ENV.K6_BASE_URL || 'http://localhost:8000',

  // Authentication endpoints
  authURL: __ENV.K6_AUTH_URL || 'http://localhost:8080',

  // Test data configuration
  testUser: {
    username: __ENV.K6_TEST_USERNAME || 'testuser2',
    email: __ENV.K6_TEST_EMAIL || 'tes2t@example.com',
    password: __ENV.K6_TEST_PASSWORD || 'testpassword',
  },

  // Performance thresholds
  thresholds: {
    // HTTP request duration (p95 should be below 500ms)
    http_req_duration: ['p(95)<500'],

    // HTTP request failed rate should be below 1%
    http_req_failed: ['rate<0.01'],

    // HTTP requests per second
    http_reqs: ['rate>10'],
  },

  // Common headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Export default options that can be extended by test scenarios
export const defaultOptions = {
  thresholds: config.thresholds,
  summaryTrendStats: ['min', 'avg', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],

  // Max redirects
  maxRedirects: 4,
};
