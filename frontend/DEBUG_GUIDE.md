# Frontend Debug Logging Guide

## Overview

The frontend now includes comprehensive debug logging for all API calls, store operations, and component actions. This helps track down issues and understand the flow of data through the application.

## How to Enable Debug Mode

### Method 1: Environment Variable (Recommended for Development)

Add to your `.env` file:
```bash
VITE_DEBUG=true
```

### Method 2: Browser Console (Runtime)

Open your browser console and run:
```javascript
localStorage.setItem('debug', 'true')
```

Then reload the page.

### Method 3: Automatic in Development

Debug mode is automatically enabled when running in development mode (`npm run dev`).

## How to Disable Debug Mode

### Remove Environment Variable
Remove or set to false in `.env`:
```bash
VITE_DEBUG=false
```

### Browser Console
```javascript
localStorage.removeItem('debug')
```

Then reload the page.

## What Gets Logged

### 1. **API Requests** 📤
All HTTP requests to the backend, including:
- Method (GET, POST, PUT, DELETE)
- URL
- Request body
- Headers (including auth tokens)

Example output:
```
📤 [2025-11-24T...] PortfolioStore - GET http://localhost:8000/api/portfolios/own?page=1&limit=10
  { body: undefined, headers: {...} }
```

### 2. **API Responses** 📥
All HTTP responses from the backend, including:
- Status code
- Status text
- Response data
- Error messages (if any)

Example output:
```
📥 [2025-11-24T...] PortfolioStore - 200 OK - http://localhost:8000/api/portfolios/own?page=1&limit=10
  { data: { data: [...] } }
```

### 3. **Store Updates** ℹ️
State changes in Svelte stores:
- Store name
- Action/method called
- Data being updated

Example output:
```
ℹ️ [2025-11-24T...] PortfolioStore - Store Update: portfolioStore.getOwn
  { page: 1, limit: 10 }

ℹ️ [2025-11-24T...] PortfolioStore - Store Update: portfolioStore.getOwn.success
  { portfoliosCount: 5, portfolios: [...] }
```

### 4. **Errors** ❌
Any errors that occur during operations:
- Error message
- Stack trace
- Context data

Example output:
```
❌ [2025-11-24T...] PortfolioStore - Failed to load portfolios
  Error: Network error
```

### 5. **Warnings** ⚠️
Important events that aren't errors:
- Authentication expiration
- Validation warnings
- Deprecation notices

Example output:
```
⚠️ [2025-11-24T...] AuthStore - Authentication expired - clearing auth state
```

## Stores with Debug Logging

The following stores have comprehensive debug logging:

1. **`portfolioStore`** - All portfolio CRUD operations
   - `getOwn()` - Fetch user's portfolios
   - `getById()` - Fetch specific portfolio
   - `create()` - Create new portfolio
   - `update()` - Update existing portfolio
   - `delete()` - Delete portfolio

2. **`auth` (authenticatedFetch)** - All authenticated API calls
   - Request/response logging for all authenticated endpoints
   - Authentication status checks
   - Token expiration warnings

## Components with Debug Logging

Many components already include `console.log()` statements for debugging:

1. **PortfolioTable.svelte**
   - Portfolio loading
   - View/Edit/Delete actions
   - Portfolio count changes

2. **PortfolioModal.svelte**
   - Modal open/close
   - Form submission
   - Create/Update operations

3. **Dashboard page**
   - Auth state changes
   - User authentication status

## Debug Logger API

If you want to add debug logging to other stores or components, use the debug logger:

```typescript
import { createDebugLogger } from '$lib/utils/debug';

const debug = createDebugLogger('YourStoreName');

// Log info messages
debug.info('Something happened', { data: value });

// Log warnings
debug.warn('Something unexpected', { context: data });

// Log errors
debug.error('Something failed', error);

// Log API requests
debug.request({
  method: 'GET',
  url: 'http://api.example.com/endpoint',
  body: requestBody,
  headers: { ... }
});

// Log API responses
debug.response({
  url: 'http://api.example.com/endpoint',
  status: 200,
  statusText: 'OK',
  data: responseData
});

// Log store updates
debug.storeUpdate('storeName', 'actionName', { data });

// Log component actions
debug.componentAction('ComponentName', 'actionName', { data });
```

## Troubleshooting

### Debug logs not appearing?

1. **Check if debug mode is enabled**
   ```javascript
   // Run in browser console
   console.log(localStorage.getItem('debug'));
   // Should return "true"
   ```

2. **Check environment variables**
   ```bash
   # Make sure your .env includes:
   VITE_DEBUG=true
   ```

3. **Reload the page** after enabling debug mode

4. **Check browser console settings**
   - Make sure "Verbose" or "Debug" level logs are enabled
   - Console filters might be hiding the logs

### Too many logs?

If debug logging is too verbose, you can:

1. Filter by store name in the browser console (e.g., search for "PortfolioStore")
2. Use browser console groups/collapsing features
3. Add more granular filtering in the debug utility

## TypeScript Configuration

The TypeScript error for `import.meta.env` has been fixed by adding `"module": "esnext"` to `tsconfig.json`.

## Next Steps

To add debug logging to additional stores:

1. Import the debug logger:
   ```typescript
   import { createDebugLogger } from '$lib/utils/debug';
   const debug = createDebugLogger('StoreName');
   ```

2. Add logging at key points:
   - Before API calls
   - After receiving responses
   - On state updates
   - On errors

3. Follow the patterns used in `portfolio.ts` and `auth.ts`
