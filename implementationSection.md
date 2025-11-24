# Image Model Refactoring - Implementation Plan

**Total Steps:** 51 (was 45, added 6 infrastructure steps)
**Estimated Time:** 7-11 days
**Focus:** Low cost, optimized storage, simple deployment, data persistence

---

## Critical Requirements

### 1. Audit Logging
**Requirement:** All image operations (upload, update, delete) MUST be logged in the audit system.

**Implementation:**
- Add audit log entries for:
  - Image upload: Log user, entity type, entity ID, filename, file size
  - Image deletion: Log user, image ID, filename, entity info
  - Image update: Log user, image ID, changes (alt text, is_main)
- Use existing audit logger infrastructure from `backend/internal/infrastructure/audit/`
- Include image metadata in audit entries for traceability

**Files to modify:**
- `backend/internal/application/handler/image.go` - Add audit.Logger calls

### 2. Backup Integration
**Requirement:** Image files and metadata MUST be included in backup flows.

**Implementation:**
- **Database backup:** Image metadata automatically included in PostgreSQL dumps (images table)
- **File backup:** Include `backend/uploads/` directory in backup scripts
- **Backup script modifications:**
  - Add `uploads/images/` to backup tar/zip archives
  - Document restore procedure for both DB and files
  - Test backup/restore workflow

**Files to create/modify:**
- Update existing backup scripts to include uploads directory
- Add restore documentation with file permissions (755 for dirs, 644 for files)

### 3. Data Persistence (Podman/Docker)
**Requirement:** Image files MUST persist across container restarts/resets.

**Implementation:**
- **Volume mounting required:** Map `backend/uploads/` to host filesystem
- **Docker Compose configuration:**
  ```yaml
  services:
    backend:
      volumes:
        - ./backend/uploads:/app/uploads  # Persistent volume
  ```
- **Permissions:** Ensure container user has write access to mounted volume
- **Directory initialization:** Container must create subdirectories on first run if they don't exist

**Files to modify:**
- `docker-compose.yml` or Podman configuration
- Backend startup script to ensure upload directories exist
- Documentation for deployment setup

### 4. Additional Safeguards
- **Orphan detection:** Periodic cleanup of image files without DB records
- **Consistency checks:** Verify file existence matches DB records
- **Disk space monitoring:** Alert when uploads directory exceeds threshold
- **Backup verification:** Automated tests that backup/restore works

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

## Phase 2.5: Infrastructure & Operations (6 steps)

### Step 21: Add Audit Logging to Image Handler
**File:** `backend/internal/application/handler/image.go`

**Implementation:**
```go
import "github.com/JorgeSaicoski/portfolio-manager/backend/internal/infrastructure/audit"

// In UploadImage handler
audit.Logger.Info("Image uploaded",
    "user_id", userID,
    "entity_type", entityType,
    "entity_id", entityID,
    "filename", filename,
    "file_size", fileSize,
    "mime_type", mimeType)

// In DeleteImage handler
audit.Logger.Info("Image deleted",
    "user_id", userID,
    "image_id", imageID,
    "filename", image.FileName,
    "entity_type", image.EntityType,
    "entity_id", image.EntityID)

// In UpdateImage handler
audit.Logger.Info("Image updated",
    "user_id", userID,
    "image_id", imageID,
    "changes", changes)
```

### Step 22: Configure Docker/Podman Volume Persistence
**File:** `docker-compose.yml` or Podman configuration

**Add volume mapping:**
```yaml
services:
  backend:
    volumes:
      - ./backend/uploads:/app/uploads:rw  # Persistent storage
      # OR for named volume:
      # - portfolio_uploads:/app/uploads

# If using named volume:
volumes:
  portfolio_uploads:
    driver: local
```

**Verify permissions:**
- Container user must have write access (UID/GID mapping)
- Host directory: `chmod 755 backend/uploads/images/`
- Subdirectories created on container startup

### Step 23: Add Startup Directory Initialization
**File:** `backend/cmd/main/main.go` or startup script

**Add at application startup:**
```go
import "os"

func initializeUploadDirectories() error {
    dirs := []string{
        "./uploads/images/original",
        "./uploads/images/thumbnail",
    }

    for _, dir := range dirs {
        if err := os.MkdirAll(dir, 0755); err != nil {
            return fmt.Errorf("failed to create directory %s: %v", dir, err)
        }
    }

    log.Info("Upload directories initialized successfully")
    return nil
}

// In main():
if err := initializeUploadDirectories(); err != nil {
    log.Fatal("Failed to initialize upload directories", "error", err)
}
```

### Step 24: Update Backup Scripts
**Files:** Create/modify backup scripts

**Database backup** (already includes images table):
```bash
# backup-db.sh - existing script should handle images table automatically
pg_dump portfolio_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

**File backup script:**
```bash
# backup-uploads.sh (NEW)
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup uploads directory
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" ./backend/uploads/

# Keep only last 7 backups
ls -t "$BACKUP_DIR"/uploads_*.tar.gz | tail -n +8 | xargs rm -f

echo "Upload backup created: uploads_$DATE.tar.gz"
```

**Full backup script:**
```bash
# backup-all.sh (MODIFIED)
#!/bin/bash
./backup-db.sh
./backup-uploads.sh
echo "Full backup completed"
```

### Step 25: Create Restore Documentation
**File:** `docs/RESTORE.md` (NEW)

**Content:**
```markdown
# Backup & Restore Procedures

## Database Restore
psql portfolio_db < backup_YYYYMMDD_HHMMSS.sql

## File Restore
tar -xzf backups/uploads_YYYYMMDD_HHMMSS.tar.gz -C /

## Set Correct Permissions
chmod 755 backend/uploads/images/
chmod 755 backend/uploads/images/original/
chmod 755 backend/uploads/images/thumbnail/
chmod 644 backend/uploads/images/original/*
chmod 644 backend/uploads/images/thumbnail/*

## Verify Restore
- Check database: SELECT COUNT(*) FROM images;
- Check files match DB records
- Test image upload/display
```

### Step 26: Add Deployment Configuration Documentation
**File:** `docs/DEPLOYMENT.md` (UPDATE)

**Add section:**
```markdown
## Image Storage Configuration

### Volume Mounting (Required)
The backend/uploads directory MUST be mounted as a persistent volume to prevent data loss on container restart.

**Docker Compose:**
- ./backend/uploads:/app/uploads:rw

**Podman:**
podman run -v ./backend/uploads:/app/uploads:rw ...

### Permissions
- Upload directory: 755
- Image files: 644
- Container user must have write access

### Backup Integration
- Automated backups run daily via cron
- Includes both database and file backups
- See docs/RESTORE.md for restore procedures

### Disk Space Monitoring
- Monitor uploads directory size
- Set alerts for >80% capacity
- Plan for ~100MB per 1000 images (average)
```

---

## Phase 3: Frontend Foundation (10 steps)

### Step 27: Update API Types - Add Image Interface
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

### Step 46: Test Audit Logging
**Verify:**
1. Image upload events logged with user_id, entity info, filename, size
2. Image deletion events logged with complete metadata
3. Image update events logged with change details
4. Audit logs searchable and formatted correctly
5. No sensitive data leaked in audit logs

### Step 47: Test Volume Persistence
**Verify:**
1. Upload images to running container
2. Restart container (podman/docker restart)
3. Verify images still accessible
4. Verify database records intact
5. Test with container complete recreation (stop, rm, create)

### Step 48: Test Backup & Restore
**Full workflow:**
1. Create test data (projects with images)
2. Run backup scripts (DB + files)
3. Delete test data from system
4. Restore from backup
5. Verify all images display correctly
6. Verify database consistency

### Step 49: Verify Directory Initialization
**Test:**
1. Delete upload directories
2. Restart application
3. Verify directories auto-created
4. Verify correct permissions (755)
5. Test image upload works immediately

### Step 50: Load Testing
**Performance:**
1. Upload 100 images sequentially
2. Upload 10 images concurrently
3. Load project list with 50 projects (thumbnails)
4. Monitor disk space usage
5. Check response times remain acceptable

### Step 51: Documentation Review
**Verify:**
1. RESTORE.md complete and accurate
2. DEPLOYMENT.md updated with volume config
3. Backup scripts executable and tested
4. All configuration examples valid
5. Troubleshooting guide included

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
- [ ] Create database backup (DB + files)
- [ ] Build production assets
- [ ] Configure Docker/Podman volume mounting
- [ ] Set upload directory permissions (755)
- [ ] Test backup and restore procedures
- [ ] Verify audit logging configuration

### Deployment Steps
1. Stop application (maintenance mode)
2. **Configure volume persistence** (docker-compose.yml or podman)
3. Run database migrations
4. Run data migration script
5. Create upload directories (or verify auto-creation on startup)
6. Deploy new backend binary
7. Deploy new frontend build
8. Start application
9. **Verify volume mount working** (check container can write to uploads/)
10. Verify health check
11. Test image upload functionality
12. Verify audit logs capturing events
13. Monitor logs for errors

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

## Implementation Summary

**Total Implementation Steps:** 51
- Phase 1 (Backend Foundation): 12 steps
- Phase 2 (Backend Integration): 8 steps
- Phase 2.5 (Infrastructure & Operations): 6 steps
- Phase 3 (Frontend Foundation): 10 steps
- Phase 4 (Frontend Integration): 8 steps
- Phase 5 (Testing & Validation): 7 steps

**Critical Requirements Addressed:**
✅ Audit logging for all image operations
✅ Backup integration (DB + files)
✅ Data persistence across container restarts
✅ Volume mounting configuration
✅ Automated directory initialization

**Focus:** Low cost, simple deployment, optimized performance, data safety
**Ready for:** VULTR deployment with local filesystem storage and Podman/Docker
