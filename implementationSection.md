# Image Model Refactoring - Implementation Plan

**Total Steps:** 45
**Estimated Time:** 6-10 days
**Focus:** Low cost, optimized storage, simple deployment

---

## Technical Decisions

### Storage Strategy
- **Location:** Local filesystem (`backend/uploads/images/`)
- **Structure:**
  - `uploads/images/original/` - Full-size optimized images
  - `uploads/images/thumbnail/` - 400px thumbnails for listings
- **Database:** Store metadata only (URLs, filenames, sizes, etc.)
- **Serving:** Static file endpoint via HTTP router

### Why NOT Base64?
❌ **Rejected:** Base64 encoding
- Increases file size by ~33%
- Bloats database records
- Bloats API responses
- Poor performance for large images
- No browser caching benefits

✅ **Chosen:** Filesystem + URL references
- Smaller database records
- Efficient HTTP caching
- Direct browser image loading
- CDN-ready for future migration

### Image Optimization (Cost Reduction)
1. **Automatic resize:** Max 1920px width (preserve aspect ratio)
2. **Compression:** JPEG quality 85%, WebP when supported
3. **Thumbnails:** 400px for listings (reduces bandwidth)
4. **Validation:** Max 10MB upload, allowed types: JPEG, PNG, WebP

### Architecture
- **Use existing structure:** `backend/internal/application/models/`
- **Repository pattern:** Maintain consistency with current codebase
- **Handler pattern:** Follow existing handler structure
- **Migration:** Maintenance window approach (simpler, lower risk)

---

## Phase 1: Backend Foundation (12 steps)

### Step 1: Add Image Processing Dependencies
**File:** `backend/go.mod`
- Add `github.com/disintegration/imaging` for image resize/optimization
- Run `go mod tidy`

### Step 2: Create Image Model
**File:** `backend/internal/application/models/image.go`
```go
type Image struct {
    gorm.Model
    URL         string  // e.g., "/uploads/images/original/abc123.jpg"
    ThumbnailURL string // e.g., "/uploads/images/thumbnail/abc123.jpg"
    FileName    string
    FileSize    int64
    MimeType    string
    Alt         string
    OwnerID     string
    Type        string  // "photo" | "image" | "icon" | "logo" | "banner" | "avatar" | "background"
    EntityID    uint
    EntityType  string  // "project" | "portfolio" | "section"
    IsMain      bool
}
```

### Step 3: Create ImageRepository Interface
**File:** `backend/internal/infrastructure/repo/interfaces.go`
- Add `ImageRepository` interface with CRUD methods
- Methods: `Create()`, `GetByID()`, `GetByEntity()`, `Delete()`, `Update()`

### Step 4: Implement ImageRepository
**File:** `backend/internal/infrastructure/repo/image_repository.go`
- Implement all interface methods
- Add preloading for efficient queries
- Add ownership validation

### Step 5: Create Upload Directory Structure
**Action:** Create directories (handled in code)
- `backend/uploads/images/original/`
- `backend/uploads/images/thumbnail/`
- Add `.gitkeep` files, add `*.jpg, *.png, *.webp` to `.gitignore`

### Step 6: Create Image Utility Functions
**File:** `backend/internal/application/handler/image_utils.go`
- `validateImage(file)` - check size, mime type
- `optimizeImage(src)` - resize to max 1920px, compress
- `generateThumbnail(src, 400)` - create 400px thumbnail
- `saveImage(file, entityType, entityID)` - save both versions
- `deleteImageFiles(image)` - remove from filesystem

### Step 7: Create Image DTOs (Request)
**File:** `backend/internal/shared/dto/request/image.go`
```go
type CreateImageRequest struct {
    File       multipart.File
    EntityType string  // "project" | "portfolio" | "section"
    EntityID   uint
    Type       string
    Alt        string
    IsMain     bool
}

type UpdateImageRequest struct {
    Alt    string
    IsMain bool
}
```

### Step 8: Create Image DTOs (Response)
**File:** `backend/internal/shared/dto/response/image.go`
```go
type ImageResponse struct {
    ID           uint
    URL          string
    ThumbnailURL string
    FileName     string
    FileSize     int64
    MimeType     string
    Alt          string
    Type         string
    IsMain       bool
    CreatedAt    time.Time
}
```

### Step 9: Update Project DTOs
**Files:**
- `backend/internal/shared/dto/request/project.go`
- `backend/internal/shared/dto/response/project.go`

**Changes:**
- Remove `MainImage string` field
- Update response to include `Images []ImageResponse`

### Step 10: Create Image Handler
**File:** `backend/internal/application/handler/image.go`
- `UploadImage()` - handle multipart upload, optimize, save
- `GetImages()` - get all images for entity
- `DeleteImage()` - validate ownership, delete files, delete record
- `UpdateImage()` - update alt text, isMain status

### Step 11: Add Image Routes
**File:** `backend/internal/application/router/router.go`
```go
// Add to protected routes
api.POST("/images/upload", handlers.UploadImage)
api.GET("/images", handlers.GetImages)  // ?entity_type=project&entity_id=1
api.DELETE("/images/:id", handlers.DeleteImage)
api.PUT("/images/:id", handlers.UpdateImage)

// Add static file serving
router.Static("/uploads", "./uploads")
```

### Step 12: Add Unit Tests
**File:** `backend/internal/infrastructure/repo/image_repository_test.go`
- Test Create, GetByID, GetByEntity, Delete operations
- Test ownership validation

---

## Phase 2: Backend Integration (8 steps)

### Step 13: Update Project Model
**File:** `backend/internal/application/models/project.go`

**Changes:**
```go
type Project struct {
    gorm.Model
    Title       string
    Images      []Image `gorm:"foreignKey:EntityID;constraint:OnDelete:CASCADE"` // NEW
    // Remove: Images StringArray
    // Remove: MainImage string
    Description string `gorm:"type:text"`
    Skills      StringArray `gorm:"type:text[]"`
    Client      string
    Link        string
    Position    uint
    OwnerID     string
    CategoryID  uint
}
```

### Step 14: Create Database Migration
**File:** `backend/internal/infrastructure/db/migrations/XXX_create_images_table.go`
- Create `images` table with all fields
- Add indexes on `entity_type`, `entity_id`, `owner_id`
- Add composite index on `(entity_type, entity_id)`

### Step 15: Create Data Migration Script
**File:** `backend/internal/infrastructure/db/migrations/XXX_migrate_project_images.go`

**Logic:**
1. Query all projects with existing images
2. For each image URL in `images` or `main_image`:
   - Parse URL to get filename
   - Create Image record with:
     - URL = original URL (external URLs stay as-is)
     - EntityType = "project"
     - EntityID = project.ID
     - IsMain = true if from main_image
3. Handle errors gracefully (log, skip, continue)

### Step 16: Update Project Handler (Create/Update)
**File:** `backend/internal/application/handler/project.go`

**Changes:**
- Remove image handling from CreateProject
- Remove image handling from UpdateProject
- Images now managed via separate image endpoints
- Preload Images relationship when fetching projects

### Step 17: Update Project Handler (Get Methods)
**File:** `backend/internal/application/handler/project.go`

**Changes:**
```go
// In GetProject, GetProjects, etc.
db.Preload("Images").Find(&projects)
```

### Step 18: Add Image Validation Middleware
**File:** `backend/internal/shared/middleware/image_validator.go`
- Validate file size (max 10MB)
- Validate mime types (image/jpeg, image/png, image/webp)
- Validate ownership (user can only manage their images)

### Step 19: Add HTTP Tests for Images
**File:** `backend/cmd/test/image_test.go`
- Test upload image (happy path)
- Test upload with invalid file type
- Test upload with oversized file
- Test get images for entity
- Test delete image
- Test delete image (unauthorized)

### Step 20: Update Existing Project Tests
**File:** `backend/cmd/test/project_test.go`
- Update assertions to expect `Images []Image` instead of `images []string`
- Update test data factories

---

## Phase 3: Frontend Foundation (10 steps)

### Step 21: Update API Types - Add Image Interface
**File:** `frontend/src/lib/types/api.ts`

**Add:**
```typescript
export interface Image {
  ID: number;
  url: string;
  thumbnail_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  alt: string;
  type: 'photo' | 'image' | 'icon' | 'logo' | 'banner' | 'avatar' | 'background';
  entity_id: number;
  entity_type: 'project' | 'portfolio' | 'section';
  is_main: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}
```

### Step 22: Update Project Interface
**File:** `frontend/src/lib/types/api.ts`

**Changes:**
```typescript
export interface Project {
  ID: number;
  title: string;
  images?: Image[];        // Changed from string[]
  // Remove: main_image?: string;
  description: string;
  skills?: string[];
  client?: string;
  link?: string;
  position: number;
  category_id: number;
  owner_id: string;
  CreatedAt: string;
  UpdatedAt: string;
}

// Helper to get main image
export function getMainImage(project: Project): Image | undefined {
  return project.images?.find(img => img.is_main) || project.images?.[0];
}
```

### Step 23: Create Image Store
**File:** `frontend/src/lib/stores/image.ts`

**Features:**
```typescript
import { writable } from 'svelte/store';

export const imageStore = writable({
  uploading: false,
  error: null as string | null,
  progress: 0
});

export async function uploadImage(
  file: File,
  entityType: string,
  entityId: number,
  type: string = 'image',
  alt: string = '',
  isMain: boolean = false
): Promise<Image> {
  // Implementation with FormData, progress tracking
}

export async function deleteImage(imageId: number): Promise<void> {
  // DELETE /api/images/:id
}

export async function updateImage(
  imageId: number,
  updates: { alt?: string; is_main?: boolean }
): Promise<Image> {
  // PUT /api/images/:id
}
```

### Step 24: Create ImageUploader Component Structure
**File:** `frontend/src/lib/components/admin/ImageUploader.svelte`

**Props:**
```typescript
export let entityType: 'project' | 'portfolio' | 'section';
export let entityId: number;
export let images: Image[] = [];
export let onUpload: (image: Image) => void;
export let onDelete: (imageId: number) => void;
export let onMainChange: (imageId: number) => void;
```

**Template structure:**
- Drop zone overlay
- File input (hidden)
- Image grid display
- Upload button
- Progress bar

### Step 25: Implement Drag-and-Drop
**File:** `frontend/src/lib/components/admin/ImageUploader.svelte`

**Features:**
- `on:dragover` - prevent default, show overlay
- `on:dragleave` - hide overlay
- `on:drop` - handle files, upload
- Visual feedback (border color change)

### Step 26: Add Image Preview Grid
**File:** `frontend/src/lib/components/admin/ImageUploader.svelte`

**Display:**
```svelte
{#each images as image}
  <div class="image-card">
    <img src={image.thumbnail_url} alt={image.alt} />
    <div class="image-info">
      <span>{image.file_name}</span>
      <span>{formatFileSize(image.file_size)}</span>
    </div>
    <div class="image-actions">
      <button on:click={() => onDelete(image.ID)}>Delete</button>
      <label>
        <input
          type="checkbox"
          checked={image.is_main}
          on:change={() => onMainChange(image.ID)}
        />
        Main
      </label>
    </div>
  </div>
{/each}
```

### Step 27: Add Delete/Main Selection
**File:** `frontend/src/lib/components/admin/ImageUploader.svelte`

**Features:**
- Delete button with confirmation
- Main image toggle (radio behavior - only one can be main)
- Optimistic UI updates
- Error handling

### Step 28: Add Upload Progress
**File:** `frontend/src/lib/components/admin/ImageUploader.svelte`

**Display:**
```svelte
{#if $imageStore.uploading}
  <div class="upload-progress">
    <progress value={$imageStore.progress} max="100"></progress>
    <span>{$imageStore.progress}%</span>
  </div>
{/if}
```

### Step 29: Add Client-Side Validation
**File:** `frontend/src/lib/components/admin/ImageUploader.svelte`

**Validate:**
- File size < 10MB
- File type in ['image/jpeg', 'image/png', 'image/webp']
- Show error messages
- Prevent upload if invalid

### Step 30: Style ImageUploader
**File:** `frontend/src/lib/components/admin/ImageUploader.svelte`

**Styling:**
- Drop zone with dashed border
- Grid layout for images (3-4 columns)
- Hover effects
- Responsive design
- Loading states
- Error states (red border/text)

---

## Phase 4: Frontend Integration (8 steps)

### Step 31: Update ProjectForm - Remove Old Image Input
**File:** `frontend/src/lib/components/admin/ProjectForm.svelte`

**Remove:**
```svelte
<!-- REMOVE THIS -->
<div class="form-group">
  <label for="mainImage">Main Image URL</label>
  <input
    type="text"
    id="mainImage"
    bind:value={formData.mainImage}
  />
</div>
```

### Step 32: Integrate ImageUploader Component
**File:** `frontend/src/lib/components/admin/ProjectForm.svelte`

**Add:**
```svelte
<script>
  import ImageUploader from './ImageUploader.svelte';
  import { uploadImage, deleteImage } from '$lib/stores/image';

  let projectImages: Image[] = project?.images || [];
</script>

<!-- In form -->
<div class="form-group">
  <label>Project Images</label>
  <ImageUploader
    entityType="project"
    entityId={project?.ID || 0}
    images={projectImages}
    onUpload={handleImageUpload}
    onDelete={handleImageDelete}
    onMainChange={handleMainImageChange}
  />
</div>
```

### Step 33: Update Form Submission Logic
**File:** `frontend/src/lib/components/admin/ProjectForm.svelte`

**Changes:**
```typescript
async function handleSubmit() {
  // 1. Create/update project (without images)
  const savedProject = await projectStore.save(formData);

  // 2. Images are already uploaded via ImageUploader
  //    (they upload immediately when selected)

  // 3. Redirect
  goto(`/projects/${savedProject.ID}`);
}

async function handleImageUpload(file: File) {
  if (!project?.ID) {
    // Can't upload without project ID - need to save project first
    alert('Please save the project first before uploading images');
    return;
  }

  const image = await uploadImage(file, 'project', project.ID);
  projectImages = [...projectImages, image];
}

async function handleImageDelete(imageId: number) {
  await deleteImage(imageId);
  projectImages = projectImages.filter(img => img.ID !== imageId);
}

async function handleMainImageChange(imageId: number) {
  // Update all images: set selected as main, others as not main
  projectImages = projectImages.map(img => ({
    ...img,
    is_main: img.ID === imageId
  }));

  // Update on server
  await updateImage(imageId, { is_main: true });
}
```

### Step 34: Update Project Store
**File:** `frontend/src/lib/stores/project.ts`

**Changes:**
- Update type imports: `import type { Project, Image } from '$lib/types/api'`
- Remove image handling from create/update methods
- Ensure images are included in API responses

### Step 35: Update Project List View
**File:** `frontend/src/routes/(protected)/projects/+page.svelte`

**Changes:**
```svelte
<script>
  import { getMainImage } from '$lib/types/api';
</script>

{#each projects as project}
  <div class="project-card">
    {#if getMainImage(project)}
      <img
        src={getMainImage(project).thumbnail_url}
        alt={getMainImage(project).alt || project.title}
      />
    {:else}
      <div class="no-image">No image</div>
    {/if}
    <!-- rest of card -->
  </div>
{/each}
```

### Step 36: Update Project Detail View
**File:** `frontend/src/routes/(protected)/projects/[id]/+page.svelte`

**Changes:**
```svelte
<!-- Image gallery -->
{#if project.images?.length}
  <div class="image-gallery">
    {#each project.images as image}
      <img
        src={image.url}
        alt={image.alt || project.title}
        class:main={image.is_main}
      />
    {/each}
  </div>
{/if}
```

### Step 37: Add Loading/Error States
**Files:**
- `frontend/src/lib/components/admin/ImageUploader.svelte`
- `frontend/src/lib/components/admin/ProjectForm.svelte`

**Add:**
- Loading spinners during upload
- Error messages with retry option
- Disabled states during operations
- Success notifications

### Step 38: Handle Backward Compatibility
**File:** `frontend/src/lib/types/api.ts`

**Add type guard:**
```typescript
export function hasImages(project: Project): boolean {
  return !!project.images && project.images.length > 0;
}

// Use throughout app to safely check for images
{#if hasImages(project)}
  <!-- render images -->
{:else}
  <!-- fallback -->
{/if}
```

---

## Phase 5: Testing & Optimization (7 steps)

### Step 39: Test Image Upload Flow
**Manual testing:**
1. Create new project
2. Upload single image
3. Upload multiple images (3-5)
4. Verify thumbnails generated
5. Verify files saved to filesystem
6. Verify database records created
7. Check file sizes (optimization working?)

### Step 40: Test Image Management
**Manual testing:**
1. Delete image - verify file removed
2. Change main image - verify only one marked main
3. Edit alt text - verify saves
4. Upload invalid file type - verify error
5. Upload oversized file - verify error

### Step 41: Test Migration Script
**Steps:**
1. Create backup of database
2. Create test projects with old-style images
3. Run migration
4. Verify Image records created
5. Verify projects still display correctly
6. Test rollback if needed

### Step 42: Verify Image Optimization
**Check:**
1. Original images resized to max 1920px
2. Thumbnails generated at 400px
3. File sizes reasonable (< 500KB for optimized)
4. Quality acceptable
5. No distortion/aspect ratio issues

### Step 43: Test Static File Serving
**Verify:**
1. Images accessible at `/uploads/images/original/...`
2. Thumbnails accessible at `/uploads/images/thumbnail/...`
3. Proper content-type headers
4. 404 for missing images
5. No directory listing enabled

### Step 44: Fix Styling/UX Issues
**Review:**
1. ImageUploader component responsive
2. Drag-and-drop visual feedback clear
3. Loading states visible
4. Error messages helpful
5. Mobile experience good
6. Accessibility (alt texts, keyboard nav)

### Step 45: Integration Testing
**Full workflow:**
1. Create project → upload images → save → view
2. Edit project → add more images → delete one → save → view
3. List projects → thumbnails display correctly
4. Performance acceptable (check network tab)
5. No console errors
6. No memory leaks (upload 20+ images)

---

## Cost Optimization Summary

### Storage Savings
- **Thumbnails:** ~90% smaller than originals (400px vs full size)
- **Optimization:** ~40-60% size reduction via compression
- **Bandwidth:** Serve thumbnails in listings, originals only on detail view

### Example Calculation
- Original upload: 3MB
- After optimization: 1.2MB (60% reduction)
- Thumbnail: 50KB (98% reduction from original)
- **Listing 100 projects:** 5MB (thumbnails) vs 300MB (originals)

### Future Migration to Cloud Storage
Current implementation is CDN-ready:
- URLs stored in database (can be updated in bulk)
- Separate thumbnail/original paths (can point to different CDN zones)
- Easy migration: upload files to S3, update URLs in database

---

## Deployment Checklist

### Before Deployment
- [ ] Run all tests (unit, integration, HTTP)
- [ ] Test migration on staging database
- [ ] Create database backup
- [ ] Build production assets
- [ ] Set upload directory permissions (755)

### Deployment Steps
1. Stop application (maintenance mode)
2. Run database migrations
3. Run data migration script
4. Create upload directories
5. Deploy new backend binary
6. Deploy new frontend build
7. Start application
8. Verify health check
9. Test image upload
10. Monitor logs for errors

### Rollback Plan
If issues occur:
1. Stop application
2. Restore database from backup
3. Deploy previous version
4. Start application

---

## Future Enhancements (Out of Scope)

- Multiple image format support (AVIF, WebP with fallback)
- Cloud storage integration (S3, DO Spaces)
- CDN integration
- Image editing (crop, rotate, filters)
- Bulk upload
- Image gallery with lightbox
- Lazy loading
- Progressive image loading (LQIP)
- Virus scanning for uploads

---

## Resources

### Go Libraries
- `github.com/disintegration/imaging` - Image resize/manipulation
- Built-in `mime/multipart` - File upload handling

### Frontend
- Native File API
- Native Drag-and-Drop API
- FormData for multipart uploads

### Testing
- Go `net/http/httptest` for HTTP tests
- Manual testing checklist above

---

**Total Implementation Steps:** 45
**Focus:** Low cost, simple deployment, optimized performance
**Ready for:** VULTR deployment with local filesystem storage
