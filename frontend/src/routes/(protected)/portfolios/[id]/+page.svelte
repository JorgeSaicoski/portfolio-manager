<script lang="ts">
 import { goto } from "$app/navigation";
 import { onMount } from "svelte";
 import { portfolioStore, type Portfolio } from "$lib/stores/portfolio";
 import { categoryStore } from "$lib/stores/category";
 import { sectionStore } from "$lib/stores/section";
 import type { Category, Section } from "$lib/types/api";
 import DeleteModal from "$lib/components/utils/DeleteModal.svelte";

 // Get data from load function
 export let data: { id: number };

 // Page parameters
 $: portfolioId = data.id;

 // Component state
 let portfolio: Portfolio | null = null;
 let loading = true;
 let error: string | null = null;
 let isEditing = false;
 let showDeleteModal = false;

 // Categories and Sections
 let categories: Category[] = [];
 let sections: Section[] = [];
 let loadingCategories = false;
 let loadingSections = false;

 // Edit form state
 let editTitle = "";
 let editDescription = "";
 let editError = "";
 let isSubmitting = false;

 // Form validation
 let titleError = "";
 let descriptionError = "";

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

 async function saveEdit() {
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

               <form on:submit|preventDefault={saveEdit} class="form">
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

           <!-- Future sections placeholder -->
          <div class="card" style="margin-top: var(--space-6);">
            <div class="card-body">
              <div class="text-center">
                <h4>Portfolio Sections</h4>
                <p class="text-muted">
                  Portfolio sections and content management will be available
                  here.
                </p>
                <button class="btn btn-outline" disabled>
                  Manage Sections
                </button>
              </div>
            </div>
          </div>
         {/if}
       </div>
     {/if}
   </div>
 </main>
</div>

<DeleteModal
 bind:isOpen={showDeleteModal}
 itemName={portfolio?.title}
 itemType="portfolio"
 confirmText={portfolio?.title}
 onClose={() => showDeleteModal = false}
 onConfirm={handleDeletePortfolio}
/>
