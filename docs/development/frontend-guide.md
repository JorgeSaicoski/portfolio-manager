# Developer Guide - Frontend Integration

## Quick Start: Using the New Components

### 1. Section Content Management

To add section content management to any page:

```svelte
<script lang="ts">
  import SectionContentModal from '$lib/components/section/SectionContentModal.svelte';
  import type { Section } from '$lib/types/api';

  let selectedSection: Section | null = null;
  let showContentModal = false;

  function openContentModal(section: Section) {
    selectedSection = section;
    showContentModal = true;
  }

  function closeContentModal() {
    showContentModal = false;
    selectedSection = null;
  }
</script>

<!-- Trigger button -->
<button on:click={() => openContentModal(section)}>
  Manage Content
</button>

<!-- Modal -->
{#if selectedSection}
  <SectionContentModal
    section={selectedSection}
    isOpen={showContentModal}
    onClose={closeContentModal}
  />
{/if}
```

### 2. Toast Notifications

First, add the ToastContainer to your root layout:

**File:** `src/routes/+layout.svelte`

```svelte
<script>
  import ToastContainer from '$lib/components/utils/ToastContainer.svelte';
</script>

<slot />

<ToastContainer />
```

Then use toasts anywhere in your app:

```svelte
<script lang="ts">
  import { toastStore } from '$lib/stores';
  import { sectionContentStore } from '$lib/stores';

  async function saveContent() {
    try {
      await sectionContentStore.create({
        type: 'text',
        content: 'Hello world',
        section_id: 1
      });

      toastStore.success('Content created successfully!');
    } catch (error) {
      toastStore.error('Failed to create content');
    }
  }
</script>
```

### 3. Drag-and-Drop Reordering

#### For Categories:

```svelte
<script lang="ts">
  import { categoryStore } from '$lib/stores';

  let categories = $categoryStore.categories;

  function handleDrop(draggedId: number, targetIndex: number) {
    const draggedIndex = categories.findIndex(c => c.ID === draggedId);

    // Reorder array
    const reordered = [...categories];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Calculate updates
    const updates = reordered.map((category, index) => ({
      id: category.ID,
      position: index
    }));

    // Send to backend
    categoryStore.reorderCategories(updates).catch(err => {
      toastStore.error('Failed to reorder categories');
    });
  }
</script>

{#each categories as category, index (category.ID)}
  <div
    draggable="true"
    on:dragstart={(e) => handleDragStart(e, category)}
    on:drop={(e) => handleDrop(category.ID, index)}
  >
    {category.title}
  </div>
{/each}
```

**Same pattern works for:**
- `projectStore.reorderProjects(updates)`
- `sectionStore.reorderSections(updates)`
- `sectionContentStore.reorderContents(updates)`

### 4. Using Nested Endpoints

Instead of making multiple API calls:

**Old way (multiple requests):**
```typescript
const portfolio = await portfolioStore.getById(1);
const categories = await categoryStore.getOwn(); // Fetch all, filter client-side
const sections = await sectionStore.getOwn(); // Fetch all, filter client-side
```

**New way (single request per resource):**
```typescript
const portfolio = await portfolioStore.getById(1);
const categories = await portfolioStore.getCategories(1); // Direct fetch
const sections = await portfolioStore.getSections(1); // Direct fetch
```

---

## Store API Reference

### SectionContentStore

```typescript
import { sectionContentStore } from '$lib/stores';

// Get all content for a section
const contents = await sectionContentStore.getBySectionId(sectionId);

// Get single content
const content = await sectionContentStore.getById(contentId);

// Create content
const newContent = await sectionContentStore.create({
  type: 'text',
  content: 'My content',
  order: 0,
  section_id: 1
});

// Update content
const updated = await sectionContentStore.update(contentId, {
  content: 'Updated content'
});

// Update just the order
await sectionContentStore.updateOrder(contentId, { order: 3 });

// Batch reorder (drag-and-drop)
await sectionContentStore.reorderContents([
  { id: 1, order: 0 },
  { id: 2, order: 1 },
  { id: 3, order: 2 }
]);

// Delete content
await sectionContentStore.delete(contentId);

// Utility methods
sectionContentStore.clearCurrent();
sectionContentStore.clearError();
sectionContentStore.clearAll();
```

### ToastStore

```typescript
import { toastStore } from '$lib/stores';

// Show notifications
toastStore.success('Operation successful!'); // 5s duration
toastStore.error('Something went wrong'); // 7s duration
toastStore.warning('Please be careful'); // 6s duration
toastStore.info('Here is some info'); // 5s duration

// Custom duration
toastStore.success('Quick message', 3000); // 3s

// Manual management
toastStore.remove(toastId);
toastStore.clear(); // Remove all toasts
```

### Enhanced Store Methods

#### PortfolioStore

```typescript
import { portfolioStore } from '$lib/stores';

// NEW: Fetch nested relationships
const categories = await portfolioStore.getCategories(portfolioId);
const sections = await portfolioStore.getSections(portfolioId);

// Utility
portfolioStore.clearError();
portfolioStore.clearCurrent();
```

#### CategoryStore

```typescript
import { categoryStore } from '$lib/stores';

// NEW: Position management
await categoryStore.updatePosition(categoryId, 5);
await categoryStore.reorderCategories([
  { id: 1, position: 0 },
  { id: 2, position: 1 }
]);
```

#### ProjectStore

```typescript
import { projectStore } from '$lib/stores';

// NEW: Position management
await projectStore.updatePosition(projectId, 3);
await projectStore.reorderProjects([
  { id: 10, position: 0 },
  { id: 11, position: 1 }
]);
```

#### SectionStore

```typescript
import { sectionStore } from '$lib/stores';

// NEW: Position management
await sectionStore.updatePosition(sectionId, 2);
await sectionStore.reorderSections([
  { id: 5, position: 0 },
  { id: 6, position: 1 }
]);
```

---

## Component Props Reference

### SectionContentModal

```typescript
export let section: Section;          // Required: The section to manage content for
export let isOpen: boolean = false;   // Required: Control modal visibility
export let onClose: () => void;       // Required: Callback when modal closes
```

### ContentBlockEditor

```typescript
export let content: Partial<SectionContent> = {
  type: 'text',
  content: '',
  order: 0,
  metadata: null
};
export let onSave: (content: Partial<SectionContent>) => void;  // Required
export let onCancel: () => void;                                 // Required
export let isEditing: boolean = false;
```

### ContentBlockList

```typescript
export let sectionId: number;                                    // Required
export let contents: SectionContent[] = [];                      // Required
export let onEdit: (content: SectionContent) => void;           // Required
export let onDelete: (id: number) => void;                      // Required
export let editable: boolean = true;
```

### Toast

```typescript
export let message: string;                                      // Required
export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
export let duration: number = 5000;  // Auto-close after ms (0 = no auto-close)
export let onClose: () => void;                                  // Required
```

---

## Type Definitions

### SectionContent

```typescript
interface SectionContent {
  ID: number;
  section_id: number;
  type: 'text' | 'image';
  content: string;           // Text content or image URL
  order: number;             // Display order (0-indexed)
  metadata?: string | null;  // JSON metadata (optional)
  owner_id: string;
  CreatedAt: string;
  UpdatedAt: string;
  Section?: Section;
}
```

### Toast

```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}
```

---

## Best Practices

### 1. Error Handling

Always wrap store operations in try-catch and show toasts:

```typescript
async function deleteProject(id: number) {
  try {
    await projectStore.delete(id);
    toastStore.success('Project deleted successfully');
  } catch (error) {
    console.error('Delete failed:', error);
    toastStore.error('Failed to delete project');
  }
}
```

### 2. Loading States

Subscribe to store loading states for better UX:

```typescript
$: loading = $sectionContentStore.loading;

{#if loading}
  <div class="spinner">Loading...</div>
{:else}
  <!-- Content -->
{/if}
```

### 3. Optimistic Updates

Reordering uses optimistic updates automatically - no need to show loading spinners!

```typescript
// UI updates immediately, API call happens in background
await categoryStore.reorderCategories(updates);
```

### 4. Cleanup

Clear store state when navigating away:

```typescript
import { onDestroy } from 'svelte';

onDestroy(() => {
  sectionContentStore.clearAll();
  categoryStore.clearCurrent();
});
```

### 5. Reactive Subscriptions

Use `$` prefix for automatic reactivity:

```typescript
import { sectionContentStore } from '$lib/stores';

$: contents = $sectionContentStore.contents;
$: loading = $sectionContentStore.loading;
$: error = $sectionContentStore.error;
```

---

## Common Patterns

### Pattern 1: CRUD with Toast Feedback

```typescript
async function createCategory(data) {
  try {
    const category = await categoryStore.create(data);
    toastStore.success(`Category "${category.title}" created!`);
    return category;
  } catch (error) {
    toastStore.error('Failed to create category');
    throw error;
  }
}
```

### Pattern 2: Confirmation Before Delete

```typescript
async function deleteWithConfirmation(id: number, name: string) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) {
    return;
  }

  try {
    await categoryStore.delete(id);
    toastStore.success('Category deleted');
  } catch (error) {
    toastStore.error('Failed to delete category');
  }
}
```

### Pattern 3: Loading Nested Data

```typescript
async function loadPortfolioDetails(portfolioId: number) {
  try {
    const [portfolio, categories, sections] = await Promise.all([
      portfolioStore.getById(portfolioId),
      portfolioStore.getCategories(portfolioId),
      portfolioStore.getSections(portfolioId)
    ]);

    // All data loaded in parallel!
    return { portfolio, categories, sections };
  } catch (error) {
    toastStore.error('Failed to load portfolio');
    throw error;
  }
}
```

### Pattern 4: Form Validation

```typescript
function validateContent(content: Partial<SectionContent>): string | null {
  if (!content.content?.trim()) {
    return 'Content is required';
  }

  if (content.type === 'image') {
    try {
      new URL(content.content);
    } catch {
      return 'Please enter a valid image URL';
    }
  }

  if (content.metadata) {
    try {
      JSON.parse(content.metadata);
    } catch {
      return 'Metadata must be valid JSON';
    }
  }

  return null;
}
```

---

## Troubleshooting

### Toast not appearing?

Make sure `ToastContainer` is in your root layout:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import ToastContainer from '$lib/components/utils/ToastContainer.svelte';
</script>

<slot />
<ToastContainer />
```

### Drag-and-drop not working?

1. Check `draggable="true"` on element
2. Ensure handlers are attached: `on:dragstart`, `on:dragover`, `on:drop`
3. Call `e.preventDefault()` in `dragover` handler
4. Check browser console for errors

### Store not updating?

Use reactive `$` syntax:

```typescript
// ❌ Wrong - not reactive
const contents = sectionContentStore.contents;

// ✅ Correct - reactive
$: contents = $sectionContentStore.contents;
```

### API calls failing?

1. Check network tab for error responses
2. Verify authentication (check auth store)
3. Check CORS settings (backend)
4. Look for error in `$store.error`

---

## Performance Tips

### 1. Debounce Reordering

For frequent drag operations:

```typescript
import { debounce } from '$lib/utils';

const debouncedReorder = debounce((updates) => {
  categoryStore.reorderCategories(updates);
}, 500);
```

### 2. Pagination

Use pagination for large datasets:

```typescript
const PAGE_SIZE = 20;
let currentPage = 1;

async function loadMore() {
  await categoryStore.getOwn(currentPage, PAGE_SIZE);
  currentPage++;
}
```

### 3. Lazy Load Images

```svelte
<img
  src={content.content}
  loading="lazy"
  alt="Content image"
/>
```

---

## Testing

### Unit Testing Stores

```typescript
import { sectionContentStore } from '$lib/stores/sectionContent';
import { get } from 'svelte/store';

describe('SectionContentStore', () => {
  it('should fetch contents by section ID', async () => {
    const contents = await sectionContentStore.getBySectionId(1);

    expect(contents).toHaveLength(3);
    expect(contents[0].order).toBeLessThan(contents[1].order);
  });
});
```

### Component Testing

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import ContentBlockEditor from '$lib/components/section/ContentBlockEditor.svelte';

test('validates image URLs', async () => {
  const { getByLabelText, getByText } = render(ContentBlockEditor, {
    props: { content: { type: 'image' }, onSave: vi.fn(), onCancel: vi.fn() }
  });

  const input = getByLabelText('Image URL');
  await fireEvent.input(input, { target: { value: 'not-a-url' } });

  expect(getByText('Please enter a valid image URL')).toBeInTheDocument();
});
```

---

## Migration Guide

### Upgrading Existing Pages

If you have existing portfolio/category/section pages, here's how to add the new features:

**Step 1:** Import new components

```svelte
<script>
  import SectionContentModal from '$lib/components/section/SectionContentModal.svelte';
  import { toastStore } from '$lib/stores';
</script>
```

**Step 2:** Add state for modal

```svelte
<script>
  let showContentModal = false;
  let selectedSection = null;
</script>
```

**Step 3:** Add trigger button

```svelte
<button on:click={() => {
  selectedSection = section;
  showContentModal = true;
}}>
  Manage Content
</button>
```

**Step 4:** Add modal component

```svelte
{#if selectedSection}
  <SectionContentModal
    section={selectedSection}
    isOpen={showContentModal}
    onClose={() => {
      showContentModal = false;
      selectedSection = null;
    }}
  />
{/if}
```

**Done!** You now have full section content management.

---

For more details, see [FRONTEND_INTEGRATION_COMPLETE.md](../FRONTEND_INTEGRATION_COMPLETE.md)
