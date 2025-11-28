<script lang="ts">
 import { goto } from "$app/navigation";
 import { onMount } from "svelte";
 import { portfolioStore, type Portfolio } from "$lib/stores/portfolio";
 import { categoryStore } from "$lib/stores/category";
 import { sectionStore } from "$lib/stores/section";
 import type { Category, Section } from "$lib/types/api";
 import DeleteModal from "$lib/components/utils/DeleteModal.svelte";
 import CategoryModal from "$lib/components/admin/CategoryModal.svelte";
 import SectionModal from "$lib/components/admin/SectionModal.svelte";

 // Get data from load function
 const { data } = $props() as { data: { id: number } };

 // Page parameters
 const portfolioId: number = data.id;

 // Component state
 let portfolio = $state<Portfolio | null>(null);
 let loading = $state(true);
 let error = $state<string | null>(null);
 let isEditing = $state(false);
 let showDeleteModal = $state(false);
 let showCategoryModal = $state(false);
 let showSectionModal = $state(false);

 // Categories and Sections
 let categories = $state<Category[]>([]);
 let sections = $state<Section[]>([]);
 let loadingCategories = $state(false);
 let loadingSections = $state(false);

 // Edit form state
 let editTitle = $state("");
 let editDescription = $state("");
 let editError = $state("");
 let isSubmitting = $state(false);

 // Form validation
 let titleError = $state("");
 let descriptionError = $state("");

 // Load portfolio on mount
 onMount(async () => {
   await loadPortfolio();
   await loadCategories();
   await loadSections();
 });

 async function loadPortfolio() {
   loading = true;
   error = null;
   console.log(portfolioId);

   try {
     // Use the new getById function for public access
     await portfolioStore.getById(portfolioId);
     const state = $portfolioStore;
     portfolio = state.currentPortfolio;

     if (portfolio) {
       // Initialize edit form with current data
       editTitle = portfolio.title;
       editDescription = portfolio.description;
     }
   } catch (err) {
     error = err instanceof Error ? err.message : "Failed to load portfolio";
     portfolio = null;
   } finally {
     loading = false;
   }
 }

 async function loadCategories() {
   loadingCategories = true;
   try {
     categories = await categoryStore.getByPortfolio(portfolioId);
   } catch (err) {
     console.error("Failed to load categories:", err);
   } finally {
     loadingCategories = false;
   }
 }

 async function loadSections() {
   loadingSections = true;
   try {
     sections = await sectionStore.getByPortfolio(portfolioId);
   } catch (err) {
     console.error("Failed to load sections:", err);
   } finally {
     loadingSections = false;
   }
 }

 async function moveCategory(category: Category, direction: "up" | "down") {
   const currentIndex = categories.findIndex((c) => c.ID === category.ID);
   if (currentIndex === -1) return;

   let newPosition: number;
   if (direction === "up" && currentIndex > 0) {
     newPosition = categories[currentIndex - 1].position;
   } else if (direction === "down" && currentIndex < categories.length - 1) {
     newPosition = categories[currentIndex + 1].position;
   } else {
     return; // Can't move further
   }

   try {
     await categoryStore.updatePosition(category.ID, newPosition);
     await loadCategories(); // Reload to get updated positions
   } catch (err) {
     console.error("Failed to update category position:", err);
   }
 }

 async function moveSection(section: Section, direction: "up" | "down") {
   const currentIndex = sections.findIndex((s) => s.ID === section.ID);
   if (currentIndex === -1) return;

   let newPosition: number;
   if (direction === "up" && currentIndex > 0) {
     newPosition = sections[currentIndex - 1].position;
   } else if (direction === "down" && currentIndex < sections.length - 1) {
     newPosition = sections[currentIndex + 1].position;
   } else {
     return; // Can't move further
   }

   try {
     await sectionStore.updatePosition(section.ID, newPosition);
     await loadSections(); // Reload to get updated positions
   } catch (err) {
     console.error("Failed to update section position:", err);
   }
 }

 // Drag and drop for categories
 let draggedCategory = $state<Category | null>(null);
 let draggedOverCategoryIndex = $state<number | null>(null);

 // Debounce timers for position updates
 let categoryDebounceTimer: ReturnType<typeof setTimeout> | null = null;
 let sectionDebounceTimer: ReturnType<typeof setTimeout> | null = null;
 let savingCategories = $state(false);
 let savingSections = $state(false);

 function handleCategoryDragStart(e: DragEvent, category: Category) {
   draggedCategory = category;
   if (e.dataTransfer) {
     e.dataTransfer.effectAllowed = 'move';
   }
 }

 function handleCategoryDragOver(e: DragEvent, index: number) {
   if (!draggedCategory) return;
   e.preventDefault();
   draggedOverCategoryIndex = index;
   if (e.dataTransfer) {
     e.dataTransfer.dropEffect = 'move';
   }
 }

 function handleCategoryDragLeave() {
   draggedOverCategoryIndex = null;
 }

 async function handleCategoryDrop(e: DragEvent, dropIndex: number) {
   if (!draggedCategory) return;
   e.preventDefault();

   const draggedIndex = categories.findIndex(c => c.ID === draggedCategory!.ID);
   if (draggedIndex === dropIndex) {
     draggedCategory = null;
     draggedOverCategoryIndex = null;
     return;
   }

   // Reorder array optimistically
   const reorderedCategories = [...categories];
   const [removed] = reorderedCategories.splice(draggedIndex, 1);
   reorderedCategories.splice(dropIndex, 0, removed);

   // Update local state immediately
   categories = reorderedCategories;

   // Trigger debounced save
   debouncedReorderCategories(reorderedCategories);

   draggedCategory = null;
   draggedOverCategoryIndex = null;
 }

 function handleCategoryDragEnd() {
   draggedCategory = null;
   draggedOverCategoryIndex = null;
 }

 async function debouncedReorderCategories(reorderedList: Category[]) {
   // Clear existing timer
   if (categoryDebounceTimer) {
     clearTimeout(categoryDebounceTimer);
   }

   // Set saving state
   savingCategories = true;

   // Start new 2.5 second timer
   categoryDebounceTimer = setTimeout(async () => {
     try {
       // Prepare bulk update payload
       const updates = reorderedList.map((cat, index) => ({
         id: cat.ID,
         position: index + 1
       }));

       // Call new bulk reorder endpoint
       await categoryStore.bulkReorder(updates);

       // Reload to sync with server
       await loadCategories();

       savingCategories = false;
     } catch (err) {
       console.error('Failed to reorder categories:', err);
       alert('Failed to save category order. Please try again.');
       await loadCategories(); // Revert on error
       savingCategories = false;
     }
   }, 2500); // 2.5 seconds
 }

 async function handleDeleteCategory(category: Category) {
   if (confirm(`Are you sure you want to delete the category "${category.title}"? This action cannot be undone.`)) {
     try {
       await categoryStore.delete(category.ID);
       categories = categories.filter(c => c.ID !== category.ID);
     } catch (err) {
       console.error('Error deleting category:', err);
       alert('Failed to delete category. Please try again.');
     }
   }
 }

 // Drag and drop for sections
 let draggedSection = $state<Section | null>(null);
 let draggedOverSectionIndex = $state<number | null>(null);

 function handleSectionDragStart(e: DragEvent, section: Section) {
   draggedSection = section;
   if (e.dataTransfer) {
     e.dataTransfer.effectAllowed = 'move';
   }
 }

 function handleSectionDragOver(e: DragEvent, index: number) {
   if (!draggedSection) return;
   e.preventDefault();
   draggedOverSectionIndex = index;
   if (e.dataTransfer) {
     e.dataTransfer.dropEffect = 'move';
   }
 }

 function handleSectionDragLeave() {
   draggedOverSectionIndex = null;
 }

 async function handleSectionDrop(e: DragEvent, dropIndex: number) {
   if (!draggedSection) return;
   e.preventDefault();

   const draggedIndex = sections.findIndex(s => s.ID === draggedSection!.ID);
   if (draggedIndex === dropIndex) {
     draggedSection = null;
     draggedOverSectionIndex = null;
     return;
   }

   // Reorder array optimistically
   const reorderedSections = [...sections];
   const [removed] = reorderedSections.splice(draggedIndex, 1);
   reorderedSections.splice(dropIndex, 0, removed);

   // Update local state immediately
   sections = reorderedSections;

   // Trigger debounced save
   debouncedReorderSections(reorderedSections);

   draggedSection = null;
   draggedOverSectionIndex = null;
 }

 function handleSectionDragEnd() {
   draggedSection = null;
   draggedOverSectionIndex = null;
 }

 async function debouncedReorderSections(reorderedList: Section[]) {
   // Clear existing timer
   if (sectionDebounceTimer) {
     clearTimeout(sectionDebounceTimer);
   }

   // Set saving state
   savingSections = true;

   // Start new 2.5 second timer
   sectionDebounceTimer = setTimeout(async () => {
     try {
       // Prepare bulk update payload
       const updates = reorderedList.map((sec, index) => ({
         id: sec.ID,
         position: index + 1
       }));

       // Call new bulk reorder endpoint
       await sectionStore.bulkReorder(updates);

       // Reload to sync with server
       await loadSections();

       savingSections = false;
     } catch (err) {
       console.error('Failed to reorder sections:', err);
       alert('Failed to save section order. Please try again.');
       await loadSections(); // Revert on error
       savingSections = false;
     }
   }, 2500); // 2.5 seconds
 }

 async function handleDeleteSection(section: Section) {
   if (confirm(`Are you sure you want to delete the section "${section.title}"? This action cannot be undone.`)) {
     try {
       await sectionStore.delete(section.ID);
       sections = sections.filter(s => s.ID !== section.ID);
     } catch (err) {
       console.error('Error deleting section:', err);
       alert('Failed to delete section. Please try again.');
     }
   }
 }

 function validateEditForm() {
   let isValid = true;

   titleError = "";
   descriptionError = "";

   if (!editTitle.trim()) {
     titleError = "Portfolio title is required";
     isValid = false;
   } else if (editTitle.trim().length < 3) {
     titleError = "Title must be at least 3 characters";
     isValid = false;
   } else if (editTitle.trim().length > 100) {
     titleError = "Title must be less than 100 characters";
     isValid = false;
   }

   if (!editDescription.trim()) {
     descriptionError = "Portfolio description is required";
     isValid = false;
   } else if (editDescription.trim().length < 10) {
     descriptionError = "Description must be at least 10 characters";
     isValid = false;
   } else if (editDescription.trim().length > 500) {
     descriptionError = "Description must be less than 500 characters";
     isValid = false;
   }

   return isValid;
 }

 function startEdit() {
   isEditing = true;
   editTitle = portfolio?.title || "";
   editDescription = portfolio?.description || "";
   editError = "";
   titleError = "";
   descriptionError = "";
 }

 function cancelEdit() {
   isEditing = false;
   editTitle = portfolio?.title || "";
   editDescription = portfolio?.description || "";
   editError = "";
   titleError = "";
   descriptionError = "";
 }

 async function saveEdit(e: Event) {
   e.preventDefault();
   if (!portfolio || !validateEditForm()) return;

   isSubmitting = true;
   editError = "";

   try {
     await portfolioStore.update(portfolio.ID, {
       title: editTitle.trim(),
       description: editDescription.trim(),
     });

     // Reload portfolio to get updated data
     await loadPortfolio();
     isEditing = false;
   } catch (err) {
     editError =
       err instanceof Error ? err.message : "Failed to update portfolio";
   } finally {
     isSubmitting = false;
   }
 }

 function openDeleteModal() {
   showDeleteModal = true;
 }

 async function handleDeletePortfolio() {
   await portfolioStore.delete(data.id);
   goto("/portfolios");
 }

 // Navigation functions
 function goBack() {
   goto("/portfolios");
 }

 function goToDashboard() {
   goto("/dashboard");
 }

 // Format date helper
 function formatDate(dateString: string) {
   return new Date(dateString).toLocaleDateString("en-US", {
     year: "numeric",
     month: "long",
     day: "numeric",
     hour: "2-digit",
     minute: "2-digit",
   });
 }
</script>

<svelte:head>
 <title>{portfolio?.title || "Portfolio"} - Portfolio Manager</title>
 <meta name="description" content="Portfolio details and management" />
</svelte:head>

<div class="section bg-gray-50">
 <!-- Header with navigation -->
 <nav class="navbar">
   <div class="navbar-container">
     <div class="navbar-brand">
       <h1 class="navbar-title">Portfolio Manager</h1>
       <div class="breadcrumb">
         <div class="breadcrumb-item">
           <button onclick={goToDashboard} class="btn btn-ghost btn-sm">
             Dashboard
           </button>
         </div>
         <div class="breadcrumb-item">
           <button onclick={goBack} class="btn btn-ghost btn-sm">
             Portfolios
           </button>
         </div>
         <div class="breadcrumb-item active">
           {portfolio?.title || "Loading..."}
         </div>
       </div>
     </div>

     <div class="navbar-actions">
       {#if portfolio && !isEditing}
         <button class="btn btn-outline" onclick={startEdit}>
           <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
             <path
               d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
             />
           </svg>
           Edit
         </button>
         <button class="btn btn-error" onclick={openDeleteModal}>
           <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
             <path
               d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
             />
           </svg>
           Delete
         </button>
       {/if}
     </div>
   </div>
 </nav>

 <!-- Main content -->
 <main class="main-content">
   <div class="container">
     <!-- Loading state -->
     {#if loading}
       <div class="text-center">
         <div class="loading-spinner"></div>
         <p class="text-muted">Loading portfolio...</p>
       </div>
     {/if}

     <!-- Error state -->
     {#if error && !loading}
       <div class="card">
         <div class="card-body">
           <div class="text-center">
             <svg
               width="48"
               height="48"
               fill="currentColor"
               viewBox="0 0 24 24"
               class="text-error"
             >
               <path
                 d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
               />
             </svg>
             <h3 class="text-error">Error</h3>
             <p class="text-muted">{error}</p>
             <div class="form-row">
               <button class="btn btn-primary" onclick={loadPortfolio}>
                 Try Again
               </button>
               <button class="btn btn-outline" onclick={goBack}>
                 Back to Portfolios
               </button>
             </div>
           </div>
         </div>
       </div>
     {/if}

     <!-- Portfolio details -->
     {#if portfolio && !loading}
       <div class="container" style="max-width: 800px;">
         <!-- Edit Mode -->
         {#if isEditing}
           <div class="card protected">
             <div class="card-header">
               <h3>Edit Portfolio</h3>
               <p>Update your portfolio information</p>
             </div>

             <div class="card-body">
               <!-- Edit Error display -->
               {#if editError}
                 <div
                   class="card"
                   style="background-color: rgba(239, 68, 68, 0.1); color: var(--color-error); border: 1px solid rgba(239, 68, 68, 0.2); margin-bottom: var(--space-6);"
                 >
                   <div class="card-body">
                     <div class="flex">
                       <svg
                         width="20"
                         height="20"
                         fill="currentColor"
                         viewBox="0 0 24 24"
                       >
                         <path
                           d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                         />
                       </svg>
                       <span>{editError}</span>
                     </div>
                   </div>
                 </div>
               {/if}

               <form onsubmit={saveEdit} class="form">
                 <!-- Title field -->
                 <div class="form-group">
                   <label for="edit-title" class="form-label">
                     Portfolio Title
                     <span class="required">*</span>
                   </label>
                   <input
                     type="text"
                     id="edit-title"
                     bind:value={editTitle}
                     class="form-input"
                     class:error={titleError}
                     placeholder="Portfolio title"
                     disabled={isSubmitting}
                     maxlength="100"
                   />
                   {#if titleError}
                     <div class="form-error">
                       <svg
                         class="icon"
                         width="16"
                         height="16"
                         fill="currentColor"
                         viewBox="0 0 24 24"
                       >
                         <path
                           d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                         />
                       </svg>
                       {titleError}
                     </div>
                   {/if}
                   <div class="form-help">
                     {editTitle.length}/100 characters
                   </div>
                 </div>

                 <!-- Description field -->
                 <div class="form-group">
                   <label for="edit-description" class="form-label">
                     Description
                     <span class="required">*</span>
                   </label>
                   <textarea
                     id="edit-description"
                     bind:value={editDescription}
                     class="form-input"
                     class:error={descriptionError}
                     placeholder="Portfolio description"
                     disabled={isSubmitting}
                     rows="4"
                     maxlength="500"
                     style="resize: vertical; min-height: 100px;"
                   ></textarea>
                   {#if descriptionError}
                     <div class="form-error">
                       <svg
                         class="icon"
                         width="16"
                         height="16"
                         fill="currentColor"
                         viewBox="0 0 24 24"
                       >
                         <path
                           d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                         />
                       </svg>
                       {descriptionError}
                     </div>
                   {/if}
                   <div class="form-help">
                     {editDescription.length}/500 characters
                   </div>
                 </div>

                 <!-- Form actions -->
                 <div class="form-row">
                   <button
                     type="button"
                     class="btn btn-outline"
                     onclick={cancelEdit}
                     disabled={isSubmitting}
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     class="btn btn-primary"
                     disabled={isSubmitting ||
                       !editTitle.trim() ||
                       !editDescription.trim()}
                   >
                     {#if isSubmitting}
                       Saving...
                     {:else}
                       🛡️ Save Changes
                     {/if}
                   </button>
                 </div>
               </form>
             </div>
           </div>
         {:else}
           <!-- View Mode -->
           <div class="card protected">
             <div class="card-header">
               <div
                 class="flex"
                 style="justify-content: space-between; align-items: flex-start;"
               >
                 <div>
                   <h2>{portfolio.title}</h2>
                   <p class="text-muted">Portfolio #{portfolio.ID}</p>
                 </div>
                 <div class="feature-icon">
                   <svg
                     width="24"
                     height="24"
                     fill="currentColor"
                     viewBox="0 0 24 24"
                   >
                     <path
                       d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                     />
                   </svg>
                 </div>
               </div>
             </div>

             <div class="card-body">
               <div class="form-group">
                 <span class="form-label">Description</span>
                 <p class="text-base">{portfolio.description}</p>
               </div>

               <div
                 class="grid"
                 style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-6);"
               >
                 <div>
                   <span class="form-label">Created</span>
                   <p class="text-base">{formatDate(portfolio.CreatedAt)}</p>
                 </div>
                 <div>
                   <span class="form-label">Last Updated</span>
                   <p class="text-base">{formatDate(portfolio.UpdatedAt)}</p>
                 </div>
                 <div>
                   <span class="form-label">Owner</span>
                   <p class="text-base">{portfolio.owner_id}</p>
                 </div>
               </div>
             </div>

             <div class="card-footer">
               <div class="text-center">
                 <span class="text-sm text-muted">
                   🛡️ This portfolio is securely protected
                 </span>
               </div>
             </div>
           </div>

           <!-- Portfolio Categories -->
          <div class="card" style="margin-top: var(--space-6);">
            <div class="card-header">
              <div class="flex" style="justify-content: space-between; align-items: center;">
                <div class="flex" style="align-items: center; gap: var(--space-3);">
                  <h3>Portfolio Categories</h3>
                  {#if savingCategories}
                    <span class="saving-indicator">Saving...</span>
                  {/if}
                </div>
                <button class="btn btn-primary btn-sm" onclick={() => showCategoryModal = true}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: var(--space-1);">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Category
                </button>
              </div>
            </div>

            <div class="card-body">
              {#if loadingCategories}
                <div class="text-center" style="padding: var(--space-8);">
                  <p class="text-muted">Loading categories...</p>
                </div>
              {:else if categories.length === 0}
                <div class="text-center" style="padding: var(--space-8);">
                  <div class="empty-icon" style="font-size: 48px; margin-bottom: var(--space-4);">
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4>No categories yet</h4>
                  <p class="text-muted">Create your first category for this portfolio</p>
                  <button class="btn btn-primary" onclick={() => showCategoryModal = true} style="margin-top: var(--space-4);">
                    Create Category
                  </button>
                </div>
              {:else}
                <div class="categories-list">
                  {#each categories as category, index (category.ID)}
                    <div
                      role="listitem"
                      class="category-item"
                      class:dragging={draggedCategory?.ID === category.ID}
                      class:drag-over={draggedOverCategoryIndex === index}
                      draggable={true}
                      ondragstart={(e) => handleCategoryDragStart(e, category)}
                      ondragover={(e) => handleCategoryDragOver(e, index)}
                      ondragleave={handleCategoryDragLeave}
                      ondrop={(e) => handleCategoryDrop(e, index)}
                      ondragend={handleCategoryDragEnd}
                    >
                      <div class="category-header-row">
                        <div class="drag-handle" title="Drag to reorder">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="9" cy="6" r="1.5"/>
                            <circle cx="15" cy="6" r="1.5"/>
                            <circle cx="9" cy="12" r="1.5"/>
                            <circle cx="15" cy="12" r="1.5"/>
                            <circle cx="9" cy="18" r="1.5"/>
                            <circle cx="15" cy="18" r="1.5"/>
                          </svg>
                        </div>
                        <div class="category-info">
                          <h4 class="category-title">{category.title}</h4>
                          <p class="category-description">{category.description || 'No description'}</p>
                        </div>
                        <div class="category-meta">
                          <span class="position-badge">Position: {category.position}</span>
                        </div>
                        <div class="category-actions">
                          <button
                            class="btn-icon"
                            onclick={() => goto(`/categories/${category.ID}`)}
                            title="View category"
                            aria-label="View category"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            class="btn-icon delete"
                            onclick={() => handleDeleteCategory(category)}
                            title="Delete category"
                            aria-label="Delete category"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

           <!-- Portfolio Sections -->
          <div class="card" style="margin-top: var(--space-6);">
            <div class="card-header">
              <div class="flex" style="justify-content: space-between; align-items: center;">
                <div class="flex" style="align-items: center; gap: var(--space-3);">
                  <h3>Portfolio Sections</h3>
                  {#if savingSections}
                    <span class="saving-indicator">Saving...</span>
                  {/if}
                </div>
                <button class="btn btn-primary btn-sm" onclick={() => showSectionModal = true}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: var(--space-1);">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Section
                </button>
              </div>
            </div>

            <div class="card-body">
              {#if loadingSections}
                <div class="text-center" style="padding: var(--space-8);">
                  <p class="text-muted">Loading sections...</p>
                </div>
              {:else if sections.length === 0}
                <div class="text-center" style="padding: var(--space-8);">
                  <div class="empty-icon" style="font-size: 48px; margin-bottom: var(--space-4);">
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <h4>No sections yet</h4>
                  <p class="text-muted">Create your first section for this portfolio</p>
                  <button class="btn btn-primary" onclick={() => showSectionModal = true} style="margin-top: var(--space-4);">
                    Create Section
                  </button>
                </div>
              {:else}
                <div class="sections-list">
                  {#each sections as section, index (section.ID)}
                    <div
                      role="listitem"
                      class="section-item"
                      class:dragging={draggedSection?.ID === section.ID}
                      class:drag-over={draggedOverSectionIndex === index}
                      draggable={true}
                      ondragstart={(e) => handleSectionDragStart(e, section)}
                      ondragover={(e) => handleSectionDragOver(e, index)}
                      ondragleave={handleSectionDragLeave}
                      ondrop={(e) => handleSectionDrop(e, index)}
                      ondragend={handleSectionDragEnd}
                    >
                      <div class="section-header-row">
                        <div class="drag-handle" title="Drag to reorder">
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="9" cy="6" r="1.5"/>
                            <circle cx="15" cy="6" r="1.5"/>
                            <circle cx="9" cy="12" r="1.5"/>
                            <circle cx="15" cy="12" r="1.5"/>
                            <circle cx="9" cy="18" r="1.5"/>
                            <circle cx="15" cy="18" r="1.5"/>
                          </svg>
                        </div>
                        <div class="section-info">
                          <h4 class="section-title">{section.title}</h4>
                          <p class="section-description">{section.description || 'No description'}</p>
                        </div>
                        <div class="section-meta">
                          <span class="badge">{section.type || 'default'}</span>
                          <span class="position-badge">Position: {section.position}</span>
                        </div>
                        <div class="section-actions">
                          <button
                            class="btn-icon"
                            onclick={() => goto(`/sections/${section.ID}`)}
                            title="Edit section"
                            aria-label="Edit section"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            class="btn-icon delete"
                            onclick={() => handleDeleteSection(section)}
                            title="Delete section"
                            aria-label="Delete section"
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
         {/if}
       </div>
     {/if}
   </div>
 </main>
</div>

{#if showCategoryModal}
  <CategoryModal
    portfolio_id={portfolioId}
    onClose={() => showCategoryModal = false}
    onSuccess={async () => {
      showCategoryModal = false;
      await loadCategories();
    }}
  />
{/if}

{#if showSectionModal}
  <SectionModal
    section={null}
    portfolio_id={portfolioId}
    onClose={() => showSectionModal = false}
    onSuccess={async () => {
      showSectionModal = false;
      await loadSections();
    }}
  />
{/if}

<DeleteModal
 bind:isOpen={showDeleteModal}
 itemName={portfolio?.title}
 itemType="portfolio"
 confirmText={portfolio?.title}
 onClose={() => showDeleteModal = false}
 onConfirm={handleDeletePortfolio}
/>
