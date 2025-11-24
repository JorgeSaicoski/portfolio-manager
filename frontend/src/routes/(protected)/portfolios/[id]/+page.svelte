<script lang="ts">
 import { goto } from "$app/navigation";
 import { onMount } from "svelte";
 import { portfolioStore, type Portfolio } from "$lib/stores/portfolio";
 import DeleteModal from "$lib/components/utils/DeleteModal.svelte";

 // Get data from load function
 export let data: { id: number };
 // Debug incoming route data
 console.log('[+page.svelte] file: /routes/(protected)/portfolios/[id]/+page.svelte - route data:', data);

 // Page parameters
 $: portfolioId = data.id;

 // Component state
 let portfolio: Portfolio | null = null;
 let loading = true;
 let error: string | null = null;
 let isEditing = false;
 let showDeleteModal = false;

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
   console.log('[+page.svelte] onMount - portfolioId:', portfolioId);
   await loadPortfolio();
 });

 async function loadPortfolio() {
   loading = true;
   error = null;
   console.log('[+page.svelte] loadPortfolio START - portfolioId:', portfolioId);

   try {
     // Use the new getById function for public access
     await portfolioStore.getById(portfolioId);
     const state = $portfolioStore;
     console.log('[+page.svelte] after getById - raw store state:', state);

     portfolio = state.currentPortfolio;
     console.log('[+page.svelte] assigned portfolio:', portfolio);

     // Log common nested structures if present
     if (portfolio) {
       // Print summary of what's displayed
       logDisplayedPortfolio(portfolio);

       // Example: log sections, projects, items if present
       if ((portfolio as any).sections) {
         console.log('[+page.svelte] portfolio.sections:', (portfolio as any).sections);
       }
       if ((portfolio as any).projects) {
         console.log('[+page.svelte] portfolio.projects:', (portfolio as any).projects);
       }

       // Initialize edit form with current data
       editTitle = portfolio.title;
       editDescription = portfolio.description;
     }
   } catch (err) {
     console.error('[+page.svelte] loadPortfolio ERROR:', err);
     error = err instanceof Error ? err.message : "Failed to load portfolio";
     portfolio = null;
   } finally {
     loading = false;
     console.log('[+page.svelte] loadPortfolio FINISH - loading:', loading, 'error:', error);
   }
 }

 // Reactive logging whenever the portfolio object or loading/error changes
 $: if (true) {
   // This runs on every reactive cycle; we keep it informational and concise
   console.debug('[+page.svelte] RENDER state -> loading:', loading, 'error:', error, 'portfolioExists:', !!portfolio);
 }

 function logDisplayedPortfolio(p: any) {
   const summary = {
     ID: p?.ID,
     title: p?.title,
     description: p?.description,
     created: p?.CreatedAt,
     updated: p?.UpdatedAt,
     owner: p?.owner_id,
     sectionsCount: Array.isArray(p?.sections) ? p.sections.length : undefined,
     projectsCount: Array.isArray(p?.projects) ? p.projects.length : undefined
   };
   console.log('[+page.svelte] DISPLAYED portfolio summary:', summary, 'fullObject:', p);
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
   try {
     const formatted = new Date(dateString).toLocaleDateString("en-US", {
       year: "numeric",
       month: "long",
       day: "numeric",
       hour: "2-digit",
       minute: "2-digit",
     });
     // Debug each formatting call
     console.debug('[+page.svelte] formatDate input:', dateString, 'output:', formatted);
     return formatted;
   } catch (err) {
     console.warn('[+page.svelte] formatDate failed for:', dateString, err);
     return dateString;
   }
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
           <button on:click={goToDashboard} class="btn btn-ghost btn-sm">
             Dashboard
           </button>
         </div>
         <div class="breadcrumb-item">
           <button on:click={goBack} class="btn btn-ghost btn-sm">
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
         <button class="btn btn-outline" on:click={startEdit}>
           <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
             <path
               d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
             />
           </svg>
           Edit
         </button>
         <button class="btn btn-error" on:click={openDeleteModal}>
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
               <button class="btn btn-primary" on:click={loadPortfolio}>
                 Try Again
               </button>
               <button class="btn btn-outline" on:click={goBack}>
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
                     on:click={cancelEdit}
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
