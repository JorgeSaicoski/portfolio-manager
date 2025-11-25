<script lang="ts">
  import { goto } from "$app/navigation";
  import { portfolioStore } from "$lib/stores/portfolio";
  import { auth } from "$lib/stores/auth";

  // Form state
  let title = "";
  let description = "";
  let isSubmitting = false;
  let error: string | null = null;

  // Form validation
  let titleError = "";
  let descriptionError = "";

  $: user = $auth.user;

  function validateForm() {
    let isValid = true;
    
    // Reset errors
    titleError = "";
    descriptionError = "";
    
    // Title validation
    if (!title.trim()) {
      titleError = "Portfolio title is required";
      isValid = false;
    } else if (title.trim().length < 3) {
      titleError = "Title must be at least 3 characters";
      isValid = false;
    } else if (title.trim().length > 100) {
      titleError = "Title must be less than 100 characters";
      isValid = false;
    }
    
    // Description validation
    if (!description.trim()) {
      descriptionError = "Portfolio description is required";
      isValid = false;
    } else if (description.trim().length < 10) {
      descriptionError = "Description must be at least 10 characters";
      isValid = false;
    } else if (description.trim().length > 500) {
      descriptionError = "Description must be less than 500 characters";
      isValid = false;
    }
    
    return isValid;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!validateForm()) return;

    isSubmitting = true;
    error = null;

    try {
      await portfolioStore.create({
        title: title.trim(),
        description: description.trim(),
      });
      
      // Success - redirect to portfolios list
      goto("/portfolios");
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to create portfolio";
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto("/portfolios");
  }
</script>

<svelte:head>
  <title>Create Portfolio - Portfolio Manager</title>
  <meta name="description" content="Create a new portfolio" />
</svelte:head>

<div class="section bg-gray-50">
  <!-- Header with navigation -->
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <h1 class="navbar-title">Portfolio Manager</h1>
        <div class="breadcrumb">
          <div class="breadcrumb-item">
            <button onclick={() => goto("/dashboard")} class="btn btn-ghost btn-sm">
              Dashboard
            </button>
          </div>
          <div class="breadcrumb-item">
            <button onclick={() => goto("/portfolios")} class="btn btn-ghost btn-sm">
              Portfolios
            </button>
          </div>
          <div class="breadcrumb-item active">Create</div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Main content -->
  <main class="main-content">
    <div class="container">
      <!-- Page header -->
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Create New Portfolio</h1>
          <p class="page-subtitle">
            🐦 Build your protected digital showcase
          </p>
        </div>
      </div>

      <!-- Create form -->
      <div class="form-container">
        <div class="card protected">
          <div class="card-header">
            <h3>Portfolio Details</h3>
            <p>Tell us about your new portfolio project</p>
          </div>

          <div class="card-body">
            <!-- Error display -->
            {#if error}
              <div class="alert alert-error">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {error}
              </div>
            {/if}

            <form onsubmit={handleSubmit} class="form">
              <!-- Title field -->
              <div class="form-group">
                <label for="title" class="form-label">
                  Portfolio Title
                  <span class="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  bind:value={title}
                  class="form-input"
                  class:error={titleError}
                  placeholder="My Amazing Portfolio"
                  disabled={isSubmitting}
                  maxlength="100"
                />
                {#if titleError}
                  <div class="form-error">
                    <svg class="icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    {titleError}
                  </div>
                {/if}
                <div class="form-help">
                  Choose a descriptive name for your portfolio ({title.length}/100 characters)
                </div>
              </div>

              <!-- Description field -->
              <div class="form-group">
                <label for="description" class="form-label">
                  Description
                  <span class="required">*</span>
                </label>
                <textarea
                  id="description"
                  bind:value={description}
                  class="form-input form-textarea"
                  class:error={descriptionError}
                  placeholder="Describe what this portfolio will showcase - your projects, skills, experience, etc."
                  disabled={isSubmitting}
                  rows="4"
                  maxlength="500"
                ></textarea>
                {#if descriptionError}
                  <div class="form-error">
                    <svg class="icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    {descriptionError}
                  </div>
                {/if}
                <div class="form-help">
                  Provide a clear overview of your portfolio's purpose ({description.length}/500 characters)
                </div>
              </div>

              <!-- Form actions -->
              <div class="form-actions">
                <button
                  type="button"
                  class="btn btn-outline"
                  onclick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                >
                  {#if isSubmitting}
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" class="animate-spin">
                      <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8Z"/>
                    </svg>
                    Creating...
                  {:else}
                    🛡️ Create Portfolio
                  {/if}
                </button>
              </div>
            </form>
          </div>

          <div class="card-footer">
            <div class="protection-notice">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 1z"/>
              </svg>
              <span class="text-sm text-muted">
                Your portfolio will be securely stored and protected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>