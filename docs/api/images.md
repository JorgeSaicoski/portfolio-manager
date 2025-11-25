# Image Management API

The Image Management API provides endpoints for uploading, retrieving, updating, and deleting images associated with portfolio entities (projects, portfolios, sections).

## Overview

Images are stored using a polymorphic relationship model, allowing them to be associated with different entity types. Each image is automatically optimized (resized to 1920px max width) and a thumbnail is generated (400px width).

### Features

- **Automatic Image Optimization**: Images are automatically resized to 1920px max width with 85% JPEG quality
- **Thumbnail Generation**: 400px thumbnails are automatically created
- **File Validation**: Only JPEG, PNG, and WebP files up to 10MB are accepted
- **Ownership Validation**: Users can only upload/modify images for entities they own
- **Audit Logging**: All image operations are logged for compliance
- **Polymorphic Relationships**: Images can be associated with projects, portfolios, or sections

## Base URL

```
/api/images
```

## Authentication

All image endpoints require authentication via Bearer token:

```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Upload Image

Upload a new image and associate it with an entity.

**Endpoint:** `POST /api/images/upload`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | Image file (JPEG, PNG, or WebP, max 10MB) |
| entity_type | String | Yes | Type of entity (`project`, `portfolio`, `section`) |
| entity_id | Integer | Yes | ID of the entity |
| type | String | No | Image type (default: `image`) |
| alt | String | No | Alt text for accessibility |
| is_main | Boolean | No | Whether this is the main image (default: false) |

**Example Request:**

```bash
curl -X POST http://localhost:8000/api/images/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg" \
  -F "entity_type=project" \
  -F "entity_id=1" \
  -F "alt=Project screenshot" \
  -F "is_main=true"
```

**Success Response:** `201 Created`

```json
{
  "message": "Image uploaded successfully",
  "data": {
    "id": 1,
    "url": "/uploads/images/original/abc123_image.jpg",
    "thumbnail_url": "/uploads/images/thumbnail/abc123_image.jpg",
    "file_name": "image.jpg",
    "file_size": 245678,
    "mime_type": "image/jpeg",
    "alt": "Project screenshot",
    "owner_id": "user123",
    "type": "image",
    "entity_id": 1,
    "entity_type": "project",
    "is_main": true,
    "created_at": "2025-01-24T10:30:00Z",
    "updated_at": "2025-01-24T10:30:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid file type, file too large, or missing required fields
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't own the entity
- `500 Internal Server Error`: Failed to save image

---

### 2. Get Images by Entity

Retrieve all images for a specific entity.

**Endpoint:** `GET /api/images`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| entity_type | String | Yes | Type of entity (`project`, `portfolio`, `section`) |
| entity_id | Integer | Yes | ID of the entity |

**Example Request:**

```bash
curl -X GET "http://localhost:8000/api/images?entity_type=project&entity_id=1" \
  -H "Authorization: Bearer <token>"
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "data": [
    {
      "id": 1,
      "url": "/uploads/images/original/abc123_main.jpg",
      "thumbnail_url": "/uploads/images/thumbnail/abc123_main.jpg",
      "file_name": "main.jpg",
      "file_size": 245678,
      "mime_type": "image/jpeg",
      "alt": "Main project image",
      "owner_id": "user123",
      "type": "image",
      "entity_id": 1,
      "entity_type": "project",
      "is_main": true,
      "created_at": "2025-01-24T10:30:00Z",
      "updated_at": "2025-01-24T10:30:00Z"
    },
    {
      "id": 2,
      "url": "/uploads/images/original/def456_secondary.jpg",
      "thumbnail_url": "/uploads/images/thumbnail/def456_secondary.jpg",
      "file_name": "secondary.jpg",
      "file_size": 198765,
      "mime_type": "image/jpeg",
      "alt": "Secondary project image",
      "owner_id": "user123",
      "type": "image",
      "entity_id": 1,
      "entity_type": "project",
      "is_main": false,
      "created_at": "2025-01-24T10:35:00Z",
      "updated_at": "2025-01-24T10:35:00Z"
    }
  ]
}
```

**Note:** Images are returned ordered by `is_main` (main images first), then by `created_at`.

**Error Responses:**

- `400 Bad Request`: Missing required query parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Failed to retrieve images

---

### 3. Get Image by ID

Retrieve a single image by its ID.

**Endpoint:** `GET /api/images/:id`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | Integer | Image ID |

**Example Request:**

```bash
curl -X GET http://localhost:8000/api/images/1 \
  -H "Authorization: Bearer <token>"
```

**Success Response:** `200 OK`

```json
{
  "message": "Success",
  "data": {
    "id": 1,
    "url": "/uploads/images/original/abc123_image.jpg",
    "thumbnail_url": "/uploads/images/thumbnail/abc123_image.jpg",
    "file_name": "image.jpg",
    "file_size": 245678,
    "mime_type": "image/jpeg",
    "alt": "Project screenshot",
    "owner_id": "user123",
    "type": "image",
    "entity_id": 1,
    "entity_type": "project",
    "is_main": true,
    "created_at": "2025-01-24T10:30:00Z",
    "updated_at": "2025-01-24T10:30:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid image ID
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Image not found
- `500 Internal Server Error`: Failed to retrieve image

---

### 4. Update Image

Update image metadata (alt text and main image flag).

**Endpoint:** `PUT /api/images/:id`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | Integer | Image ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| alt | String | No | Updated alt text |
| is_main | Boolean | No | Whether this is the main image |

**Example Request:**

```bash
curl -X PUT http://localhost:8000/api/images/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "alt": "Updated alt text",
    "is_main": true
  }'
```

**Success Response:** `200 OK`

```json
{
  "message": "Image updated successfully",
  "data": {
    "id": 1,
    "url": "/uploads/images/original/abc123_image.jpg",
    "thumbnail_url": "/uploads/images/thumbnail/abc123_image.jpg",
    "file_name": "image.jpg",
    "file_size": 245678,
    "mime_type": "image/jpeg",
    "alt": "Updated alt text",
    "owner_id": "user123",
    "type": "image",
    "entity_id": 1,
    "entity_type": "project",
    "is_main": true,
    "created_at": "2025-01-24T10:30:00Z",
    "updated_at": "2025-01-24T11:45:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid image ID or request body
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't own this image
- `404 Not Found`: Image not found
- `500 Internal Server Error`: Failed to update image

---

### 5. Delete Image

Delete an image and its associated files.

**Endpoint:** `DELETE /api/images/:id`

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | Integer | Image ID |

**Example Request:**

```bash
curl -X DELETE http://localhost:8000/api/images/1 \
  -H "Authorization: Bearer <token>"
```

**Success Response:** `200 OK`

```json
{
  "message": "Image deleted successfully"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid image ID
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't own this image
- `404 Not Found`: Image not found
- `500 Internal Server Error`: Failed to delete image

---

## Image Storage

Images are stored in the following directory structure:

```
/app/uploads/
├── images/
│   ├── original/          # Optimized original images (max 1920px width)
│   └── thumbnail/         # Thumbnails (400px width)
```

### File Naming Convention

Files are stored with a unique identifier prefix to prevent naming conflicts:

```
{uuid}_{original_filename}.{ext}
```

Example: `a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6_project-screenshot.jpg`

---

## Image Optimization

### Automatic Processing

All uploaded images undergo automatic optimization:

1. **Validation**: File type (JPEG, PNG, WebP) and size (max 10MB) are validated
2. **Optimization**: Images are resized to maximum 1920px width while maintaining aspect ratio
3. **Compression**: JPEG quality is set to 85% for optimal balance between quality and file size
4. **Thumbnail**: A 400px width thumbnail is automatically generated
5. **Storage**: Both original and thumbnail are saved to persistent volumes

### Supported Formats

- **JPEG** (`image/jpeg`, `image/jpg`)
- **PNG** (`image/png`)
- **WebP** (`image/webp`)

### Size Limits

- **Maximum File Size**: 10MB
- **Maximum Width**: 1920px (automatically resized if larger)
- **Thumbnail Width**: 400px (automatically generated)

---

## Audit Logging

All image operations are logged to the audit system:

### Create Operations

Logged to: `audit/create.log`

```json
{
  "level": "info",
  "operation": "CREATE_IMAGE",
  "userID": "user123",
  "imageID": 1,
  "entityType": "project",
  "entityID": 1,
  "filename": "screenshot.jpg",
  "fileSize": 245678,
  "mimeType": "image/jpeg",
  "alt": "Project screenshot",
  "isMain": true,
  "msg": "Image uploaded successfully",
  "time": "2025-01-24T10:30:00Z"
}
```

### Update Operations

Logged to: `audit/update.log`

```json
{
  "level": "info",
  "operation": "UPDATE_IMAGE",
  "userID": "user123",
  "imageID": 1,
  "entityType": "project",
  "entityID": 1,
  "changes": {
    "alt": {"from": "Old alt", "to": "New alt"},
    "is_main": {"from": false, "to": true}
  },
  "msg": "Image updated successfully",
  "time": "2025-01-24T11:45:00Z"
}
```

### Delete Operations

Logged to: `audit/delete.log`

```json
{
  "level": "info",
  "operation": "DELETE_IMAGE",
  "userID": "user123",
  "imageID": 1,
  "filename": "screenshot.jpg",
  "entityType": "project",
  "entityID": 1,
  "fileSize": 245678,
  "mimeType": "image/jpeg",
  "msg": "Image deleted successfully",
  "time": "2025-01-24T12:00:00Z"
}
```

---

## Backup and Recovery

Images are included in the backup system:

### Creating Backups

```bash
make backup
```

This backs up:
- Database records (images table)
- Image files (uploads directory)
- Audit logs

### Restoring Backups

```bash
make db-restore BACKUP=20250124_120000
```

See [backup-restore.md](../operations/backup-restore.md) for detailed instructions.

---

## Cleanup Operations

Orphaned images (files without database references) can be cleaned up:

```bash
make clean-images
```

This script:
1. Scans filesystem for image files
2. Checks database for references
3. Removes files without database entries
4. Permanently deletes soft-deleted images older than 90 days

---

## Common Use Cases

### Upload Multiple Images to a Project

```javascript
const formData = new FormData();
formData.append('file', file1);
formData.append('entity_type', 'project');
formData.append('entity_id', projectId);
formData.append('is_main', true);

await fetch('/api/images/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

// Upload additional images with is_main=false
```

### Change Main Image

```javascript
// Set new main image
await fetch(`/api/images/${newMainImageId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ is_main: true })
});

// Unset old main image
await fetch(`/api/images/${oldMainImageId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ is_main: false })
});
```

### Display Images in UI

```jsx
// Get project images
const response = await fetch(
  `/api/images?entity_type=project&entity_id=${projectId}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const { data: images } = await response.json();

// Main image is first in array (ordered by is_main DESC)
const mainImage = images.find(img => img.is_main) || images[0];

// Use thumbnail for list views
<img src={mainImage.thumbnail_url} alt={mainImage.alt} />

// Use full image for detail views
<img src={mainImage.url} alt={mainImage.alt} />
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

### Common Error Scenarios

1. **File Too Large**
   ```json
   {
     "error": "File size exceeds maximum allowed size of 10MB"
   }
   ```

2. **Invalid File Type**
   ```json
   {
     "error": "Invalid file type. Only JPEG, PNG, and WebP images are allowed",
     "received_type": "application/pdf",
     "allowed_types": ["image/jpeg", "image/png", "image/webp"]
   }
   ```

3. **Entity Not Owned**
   ```json
   {
     "error": "You don't have permission to add images to this entity"
   }
   ```

4. **Image Not Found**
   ```json
   {
     "error": "Image not found"
   }
   ```

---

## Performance Considerations

- **Optimization**: Images are automatically optimized on upload, reducing storage and bandwidth
- **Thumbnails**: Use thumbnails for list views to improve page load times
- **Caching**: Image URLs are static and can be cached by CDNs or browsers
- **Lazy Loading**: Implement lazy loading for image-heavy pages
- **Pagination**: When displaying many images, implement pagination at the application level

---

## Security

- **Authentication Required**: All endpoints require valid JWT token
- **Ownership Validation**: Users can only upload/modify images for entities they own
- **File Validation**: Strict validation of file types and sizes
- **Sandboxed Storage**: Images are stored in dedicated directory with proper permissions
- **Audit Logging**: All operations are logged for security compliance

---

## Metrics

Image operations are tracked via Prometheus metrics:

- `images_uploaded_total`: Total number of images uploaded
- `images_deleted_total`: Total number of images deleted

Access metrics at: `http://localhost:8000/metrics`

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/JorgeSaicoski/portfolio-manager/issues
- Documentation: See `/docs` directory
