# Bruno Collection for Portfolio Manager API

## Quick Start

1. **Install Bruno**: https://www.usebruno.com/
2. **Open Collection**: File → Open Collection → Select this folder
3. **Configure Environment**:
   - Edit `environments/local.bru`
   - Add your `authToken` after logging in
4. **Run Requests**: Click any `.bru` file and hit "Send"

## Structure

This collection mirrors the HTTP request tests with one `.bru` file per test case:

```
bruno-collection/
├── bruno.json                 # Collection metadata
├── environments/
│   └── local.bru             # Local environment variables
├── health/
│   ├── health-check.bru
│   ├── readiness-check.bru
│   └── metrics.bru
├── portfolio/
│   ├── get-own-portfolios.bru
│   ├── create-portfolio.bru
│   ├── update-portfolio.bru
│   ├── delete-portfolio.bru
│   └── get-portfolio-public.bru
├── category/
│   └── ... (36 .bru files)
├── project/
│   └── ... (53 .bru files)
└── section/
    └── ... (53 .bru files)
```

## Generating Additional Files

The existing `*.http` files can be converted to Bruno format.  Each `### Request Name` section in the `.http` files should become a separate `.bru` file.

**Example conversion:**

From `portfolio.http`:
```http
### Create Portfolio - Success
POST {{backendUrl}}/api/portfolios/own
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "title": "My Portfolio"
}
```

To `portfolio/create-portfolio.bru`:
```bru
meta {
  name: Create Portfolio
  type: http
  seq: 2
}

post {
  url: {{backendUrl}}/api/portfolios/own
  body: json
  auth: bearer
}

auth:bearer {
  token: {{authToken}}
}

body:json {
  {
    "title": "My Portfolio"
  }
}

tests {
  test("Status is 201", function() {
    expect(res.status).to.equal(201);
  });
}
```

## Why Bruno?

-  **Git-Friendly**: Each request is a file, easy to track in version control
-  **Open Source**: No vendor lock-in
-  **Fast**: Lightweight and quick to start
-  **No Account Required**: Works offline
-  **Markdown Support**: Great documentation capabilities

## Note

For the complete set of test requests (177 total), you can:
1. Use the **Postman collection** (`Portfolio-Manager.postman.json`) - all requests included
2. Use the **IntelliJ `.http` files** - complete coverage
3. Generate additional Bruno files from the `.http` files using the pattern above

The Bruno foundation is set up. Additional `.bru` files can be added as needed by following the structure in `health/health-check.bru`.
