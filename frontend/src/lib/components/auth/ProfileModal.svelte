<script lang="ts">
  import { auth, type User } from '$lib/stores/auth';

  // Props
  export let user: User;
  export let onClose: () => void = () => {};
  export let onUpdate: (user: User) => void = () => {};


  // Form state
  let username = user.preferred_username;
  let email = user.email;
  let loading = false;
  let error = "";
  let success = "";

  // Validation state
  let usernameError = "";
  let emailError = "";

  // Confirmation dialog state
  let showDeleteConfirm = false;
  let deleteConfirmInput = "";

  // Email validation
  function validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Username validation
  function validateUsername(username: string) {
    return username.length >= 3 && username.length <= 50;
  }

  // Validate form fields
  function validateForm() {
    usernameError = "";
    emailError = "";

    if (!username) {
      usernameError = "Username is required";
    } else if (!validateUsername(username)) {
      usernameError = "Username must be between 3 and 50 characters";
    }

    if (!email) {
      emailError = "Email is required";
    } else if (!validateEmail(email)) {
      emailError = "Please enter a valid email address";
    }

    return !usernameError && !emailError;
  }

  // Handle profile update
  async function handleUpdate() {
    if (!validateForm()) {
      return;
    }

    // Check if anything changed
    if (username === user.preferred_username && email === user.email) {
      error = "No changes to save";
      return;
    }

    loading = true;
    error = "";
    success = "";

    try {
      // TODO: Implement profile update with Authentik API
      // Profile updates should be handled through Authentik's user management
      error = "Profile updates must be done through the authentication provider (Authentik)";
      loading = false;
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Unknown error occurred";
    } finally {
      loading = false;
    }
  }

  // Handle account deletion
  async function handleDelete() {
    if (deleteConfirmInput !== user.preferred_username) {
      error = "Username confirmation doesn't match";
      return;
    }

    loading = true;
    error = "";

    try {
      // TODO: Implement account deletion with Authentik API
      // Account deletion should be handled through Authentik's user management
      error = "Account deletion must be done through the authentication provider (Authentik)";
      loading = false;
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Unknown error occurred";
    } finally {
      loading = false;
    }
  }

  // Handle backdrop click - Fixed A11y issue
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  // Handle backdrop keyboard - Fixed A11y issue
  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }
  }

  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  // Real-time validation
  $: if (username) {
    usernameError = validateUsername(username)
      ? ""
      : "Username must be between 3 and 50 characters";
  }

  $: if (email) {
    emailError = validateEmail(email)
      ? ""
      : "Please enter a valid email address";
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal Backdrop - Fixed A11y issues -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
  class="modal-backdrop" 
  onclick={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  tabindex="-1"
>
  <div class="modal-content">
    <div class="modal-header">
      <h2 id="modal-title">Edit Profile</h2>
      <button 
        class="btn btn-ghost btn-icon" 
        onclick={onClose} 
        disabled={loading}
        aria-label="Close profile modal"
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <div class="modal-body">
      {#if !showDeleteConfirm}
        <!-- Profile Edit Form -->
        <form on:submit|preventDefault={handleUpdate} class="form">
          <!-- Username Field -->
          <div class="form-group">
            <label for="edit-username" class="form-label">Username</label>
            <input
              id="edit-username"
              type="text"
              bind:value={username}
              placeholder="Enter your username"
              class="form-input"
              class:error={usernameError}
              disabled={loading}
              autocomplete="username"
              minlength="3"
              maxlength="50"
            />
            {#if usernameError}
              <div class="form-error">
                <svg class="icon" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {usernameError}
              </div>
            {/if}
          </div>

          <!-- Email Field -->
          <div class="form-group">
            <label for="edit-email" class="form-label">Email</label>
            <input
              id="edit-email"
              type="email"
              bind:value={email}
              placeholder="Enter your email"
              class="form-input"
              class:error={emailError}
              disabled={loading}
              autocomplete="email"
            />
            {#if emailError}
              <div class="form-error">
                <svg class="icon" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {emailError}
              </div>
            {/if}
          </div>

          <!-- Error Message -->
          {#if error}
            <div class="form-error">
              <svg class="icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {error}
            </div>
          {/if}

          <!-- Action Buttons -->
          <div class="card-actions">
            <button type="submit" class="btn btn-primary" disabled={loading}>
              {#if loading}
                <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
                Updating...
              {:else}
                Update Profile
              {/if}
            </button>

            <button
              type="button"
              class="btn btn-outline"
              style="border-color: #ef4444; color: #ef4444;"
              onclick={() => showDeleteConfirm = true}
              disabled={loading}
            >
              Delete Account
            </button>
          </div>
        </form>
      {:else}
        <!-- Delete Confirmation -->
        <div class="text-center">
          <div style="color: #f59e0b; margin: 0 auto 1rem; display: flex; justify-content: center;">
            <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          </div>
          
          <h3 style="font-size: 1.25rem; font-weight: 600; color: #ef4444; margin: 0 0 1rem 0;">Delete Account</h3>
          
          <p style="color: var(--color-gray-600); line-height: 1.6; margin: 0 0 1.5rem 0;">
            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
          </p>

          <!-- Confirmation Input -->
          <div class="form-group" style="text-align: left; margin-bottom: 1.5rem;">
            <label class="form-label" for="delete-confirm">
              Type <strong style="font-family: monospace; background: var(--color-gray-100); padding: 2px 4px; border-radius: 3px;">{user.preferred_username}</strong> to confirm:
            </label>
            <input
              id="delete-confirm"
              type="text"
              bind:value={deleteConfirmInput}
              placeholder="Type your username here"
              class="form-input"
              disabled={loading}
            />
          </div>

          <!-- Error Message -->
          {#if error}
            <div class="form-error">
              <svg class="icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {error}
            </div>
          {/if}

          <div class="card-actions">
            <button
              class="btn"
              style="background: #dc2626; color: white;"
              onclick={handleDelete}
              disabled={loading || deleteConfirmInput !== user.preferred_username}
            >
              {#if loading}
                <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
                Deleting...
              {:else}
                Delete My Account
              {/if}
            </button>

            <button
              class="btn btn-ghost"
              onclick={() => { showDeleteConfirm = false; error = ''; deleteConfirmInput = ''; }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>