# API Usage Examples

Practical examples for common API operations.

## Setup

### Get Access Token

First, obtain an access token from Authentik (see [Authentication Guide](authentication.md)):

```bash
export TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
export API_URL="http://localhost:8000/api"
```

## Portfolio Operations

### Create Portfolio

```bash
curl -X POST $API_URL/portfolios/own \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Portfolio",
    "description": "Showcase of my work"
  }'
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "title": "My Portfolio",
    "description": "Showcase of my work",
    "owner_id": "user-123",
    "created_at": "2025-11-29T10:00:00Z",
    "updated_at": "2025-11-29T10:00:00Z"
  },
  "message": "Portfolio created successfully"
}
```

### List My Portfolios

```bash
curl $API_URL/portfolios/own?page=1&limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

### Get Public Portfolio

```bash
curl $API_URL/portfolios/public/1
# No authentication required
```

### Update Portfolio

```bash
curl -X PUT $API_URL/portfolios/own/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Portfolio Title",
    "description": "New description"
  }'
```

### Delete Portfolio

```bash
curl -X DELETE $API_URL/portfolios/own/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Category Operations

### Create Category

```bash
curl -X POST $API_URL/categories/own \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Web Development",
    "description": "Full-stack web projects",
    "portfolio_id": 1
  }'
```

### Reorder Categories

```bash
curl -X PUT $API_URL/categories/own/reorder \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": [
      {"id": 3, "position": 0},
      {"id": 1, "position": 1},
      {"id": 2, "position": 2}
    ]
  }'
```

## Project Operations

### Create Project

```bash
curl -X POST $API_URL/projects/own \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "E-commerce Platform",
    "description": "Full-stack e-commerce application",
    "skills": ["React", "Node.js", "PostgreSQL"],
    "client": "ABC Company",
    "link": "https://example.com",
    "category_id": 1
  }'
```

### Search Projects by Skills

```bash
curl "$API_URL/projects/search/skills?skills=React&skills=Node.js"
# No authentication required for public search
```

### Search Projects by Client

```bash
curl "$API_URL/projects/search/client?client=ABC%20Company"
```

## Image Operations

### Upload Image

```bash
curl -X POST $API_URL/images/own \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "entity_type=project" \
  -F "entity_id=1" \
  -F "alt=Project screenshot" \
  -F "is_main=true"
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "url": "/uploads/images/original/abc123_image.jpg",
    "thumbnail_url": "/uploads/images/thumbnail/abc123_image.jpg",
    "file_name": "image.jpg",
    "file_size": 245678,
    "mime_type": "image/jpeg",
    "alt": "Project screenshot",
    "entity_type": "project",
    "entity_id": 1,
    "is_main": true
  },
  "message": "Image uploaded successfully"
}
```

### Get Images for Project

```bash
curl $API_URL/images/entity/project/1
# No authentication required
```

### Update Image Metadata

```bash
curl -X PUT $API_URL/images/own/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alt": "Updated alt text",
    "is_main": true
  }'
```

## Section Operations

### Create Section

```bash
curl -X POST $API_URL/sections/own \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "About Me",
    "description": "Personal introduction",
    "type": "text",
    "portfolio_id": 1
  }'
```

### Add Section Content

```bash
curl -X POST $API_URL/section-contents/own \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "section_id": 1,
    "type": "text",
    "content": "I am a full-stack developer...",
    "order": 0
  }'
```

### Get Section Contents (Public)

```bash
curl $API_URL/sections/1/contents
# Returns all content blocks ordered by 'order' field
```

## User Operations

### Get My Data Summary

```bash
curl $API_URL/users/me/summary \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "data": {
    "userID": "user-123",
    "portfolios": 2,
    "categories": 5,
    "sections": 8,
    "projects": 12,
    "totalItems": 27
  },
  "message": "User data summary"
}
```

### Delete All My Data (GDPR)

```bash
curl -X DELETE $API_URL/users/me/data \
  -H "Authorization: Bearer $TOKEN"
```

**WARNING**: This permanently deletes all your data!

## Pagination

### Paginated List

```bash
# First page (10 items)
curl "$API_URL/portfolios/own?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Second page
curl "$API_URL/portfolios/own?page=2&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Large page size
curl "$API_URL/portfolios/own?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling Examples

### Handling 401 (Unauthorized)

```bash
response=$(curl -s -w "\n%{http_code}" $API_URL/portfolios/own \
  -H "Authorization: Bearer $TOKEN")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "401" ]; then
  echo "Token expired, refreshing..."
  # Refresh token logic here
fi
```

### Handling 404 (Not Found)

```bash
curl -X GET $API_URL/portfolios/own/999 \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "error": "Portfolio not found"
}
```

### Handling 403 (Forbidden)

```bash
# Trying to access another user's portfolio
curl -X PUT $API_URL/portfolios/own/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Hacked"}'
```

**Response:**
```json
{
  "error": "Access denied: portfolio belongs to another user"
}
```

## Complete Workflow Example

### Creating a Full Portfolio

```bash
# 1. Create portfolio
PORTFOLIO=$(curl -s -X POST $API_URL/portfolios/own \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Work", "description": "Portfolio"}')

PORTFOLIO_ID=$(echo $PORTFOLIO | jq -r '.data.id')
echo "Created portfolio: $PORTFOLIO_ID"

# 2. Create category
CATEGORY=$(curl -s -X POST $API_URL/categories/own \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Web Dev\", \"portfolio_id\": $PORTFOLIO_ID}")

CATEGORY_ID=$(echo $CATEGORY | jq -r '.data.id')
echo "Created category: $CATEGORY_ID"

# 3. Create project
PROJECT=$(curl -s -X POST $API_URL/projects/own \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"My Project\",
    \"description\": \"Cool project\",
    \"category_id\": $CATEGORY_ID,
    \"skills\": [\"React\", \"Go\"]
  }")

PROJECT_ID=$(echo $PROJECT | jq -r '.data.id')
echo "Created project: $PROJECT_ID"

# 4. Upload image
curl -X POST $API_URL/images/own \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@image.jpg" \
  -F "entity_type=project" \
  -F "entity_id=$PROJECT_ID" \
  -F "is_main=true"

echo "Portfolio created successfully!"
```

## Testing with Bruno

Bruno collection examples (save as `portfolio.bru`):

```
meta {
  name: Portfolio Manager
  type: collection
}

vars {
  base_url: http://localhost:8000/api
  token: {{process.env.AUTH_TOKEN}}
}

### Get Portfolios
GET {{base_url}}/portfolios/own
Authorization: Bearer {{token}}

### Create Portfolio
POST {{base_url}}/portfolios/own
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "My Portfolio",
  "description": "Test portfolio"
}
```

## Related Documentation

- [API Overview](/backend/API_OVERVIEW.md) - Complete endpoint reference
- [API Authentication](authentication.md) - Authentication guide
- [Image API](/docs/api/images.md) - Detailed image documentation
- [How to Test](/docs/how-to-do/how-to-test.md) - Testing guide

## External Tools

- [Bruno](https://www.usebruno.com/) - API client
- [Postman](https://www.postman.com/) - API testing
- [jq](https://stedolan.github.io/jq/) - JSON processing
- [curl](https://curl.se/) - Command-line HTTP client
