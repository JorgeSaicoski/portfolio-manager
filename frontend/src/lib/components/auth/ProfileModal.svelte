<!-- src/lib/components/ProfileModal.svelte -->
<script lang="ts">
  import { auth, type User } from '$lib/stores/auth';

  // Props
  export let user: User;
  export let onClose: () => void;
  export let onUpdate: (user: User) => void;

  // Form state
  let username = user.username;
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
    if (username === user.username && email === user.email) {
      error = "No changes to save";
      return;
    }

    loading = true;
    error = "";
    success = "";

    try {
      const result = await auth.updateProfile(username.trim(), email.trim());
      
      if (result.success && result.data) {
        success = "Profile updated successfully!";
        onUpdate(result.data);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(result.error || "Failed to update profile");
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error occurred";
    } finally {
      loading = false;
    }
  }

  // Handle account deletion
  async function handleDelete() {
    if (deleteConfirmInput !== user.username) {
      error = "Username confirmation doesn't match";
      return;
    }

    loading = true;
    error = "";

    try {
      const result = await auth.deleteProfile();
      
      if (result.success) {
        // Account deleted, will be redirected to login
        onClose();
      } else {
        throw new Error(result.error || "Failed to delete account");
      }
    } catch (err) {
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
  on:click={handleBackdropClick}
  on:keydown={handleBackdropKeydown}
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  tabindex="-1"
>
  <div class="modal-container">
    <div class="modal-header">
      <h2 id="modal-title">Edit Profile</h2>
      <button 
        class="close-button" 
        on:click={onClose} 
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
        <form on:submit|preventDefault={handleUpdate} class="profile-form">
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
              aria-describedby={usernameError ? "username-error" : undefined}
            />
            {#if usernameError}
              <span class="error-message" id="username-error">{usernameError}</span>
            {/if}
          </div>

          <!-- Email Field -->
          <div class="form-group">
            <label for="edit-email" class="form-label">Email Address</label>
            <input
              id="edit-email"
              type="email"
              bind:value={email}
              placeholder="Enter your email"
              class="form-input"
              class:error={emailError}
              disabled={loading}
              autocomplete="email"
              aria-describedby={emailError ? "email-error" : undefined}
            />
            {#if emailError}
              <span class="error-message" id="email-error">{emailError}</span>
            {/if}
          </div>

          <!-- Success/Error Messages -->
          {#if success}
            <div class="alert success-alert" role="status" aria-live="polite">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {success}
            </div>
          {/if}

          {#if error}
            <div class="alert error-alert" role="alert" aria-live="assertive">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              {error}
            </div>
          {/if}

          <!-- Action Buttons -->
          <div class="button-group">
            <button
              type="button"
              class="cancel-button"
              on:click={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="save-button"
              disabled={loading || (username === user.username && email === user.email)}
            >
              {#if loading}
                <div class="button-spinner" aria-hidden="true"></div>
                <span class="sr-only">Saving changes...</span>
                Saving...
              {:else}
                Save Changes
              {/if}
            </button>
          </div>
        </form>

        <!-- Danger Zone -->
        <div class="danger-zone">
          <h3>Danger Zone</h3>
          <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button
            class="delete-button"
            on:click={() => showDeleteConfirm = true}
            disabled={loading}
          >
            Delete Account
          </button>
        </div>

      {:else}
        <!-- Delete Confirmation -->
        <div class="delete-confirmation">
          <div class="warning-icon" aria-hidden="true">
            <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          </div>
          
          <h3>Delete Account</h3>
          <p>
            This action cannot be undone. This will permanently delete your account
            and remove all associated data from our servers.
          </p>
          
          <div class="confirmation-input">
            <label for="delete-confirm">
              Please type <strong>{user.username}</strong> to confirm:
            </label>
            <input
              id="delete-confirm"
              type="text"
              bind:value={deleteConfirmInput}
              placeholder="Enter your username"
              class="form-input"
              disabled={loading}
              aria-describedby="delete-instructions"
            />
            <div id="delete-instructions" class="sr-only">
              Type your username "{user.username}" to confirm account deletion
            </div>
          </div>

          {#if error}
            <div class="alert error-alert" role="alert" aria-live="assertive">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              {error}
            </div>
          {/if}

          <div class="button-group">
            <button
              type="button"
              class="cancel-button"
              on:click={() => {
                showDeleteConfirm = false;
                deleteConfirmInput = "";
                error = "";
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              class="confirm-delete-button"
              on:click={handleDelete}
              disabled={loading || deleteConfirmInput !== user.username}
            >
              {#if loading}
                <div class="button-spinner" aria-hidden="true"></div>
                <span class="sr-only">Deleting account...</span>
                Deleting...
              {:else}
                Delete Account
              {/if}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-container {
    background: white;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalSlideIn 0.2s ease-out;
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-header {
    padding: 1.5rem 2rem 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
  }

  .modal-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a202c;
    margin: 0;
  }

  .close-button {
    background: none;
    border: none;
    color: #718096;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover:not(:disabled) {
    color: #2d3748;
    background: #f7fafc;
  }

  .close-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .modal-body {
    padding: 0 2rem 2rem;
  }

  .profile-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .form-input {
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
    outline: none;
  }

  .form-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .form-input.error {
    border-color: #ef4444;
  }

  .form-input:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }

  .error-message {
    color: #ef4444;
    font-size: 0.875rem;
  }

  .alert {
    padding: 0.75rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .success-alert {
    background-color: #f0fff4;
    color: #38a169;
    border: 1px solid #9ae6b4;
  }

  .error-alert {
    background-color: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }

  .cancel-button {
    background: #f7fafc;
    color: #4a5568;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-button:hover:not(:disabled) {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  .cancel-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .save-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .save-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .save-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .button-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .danger-zone {
    border-top: 1px solid #fed7d7;
    padding-top: 2rem;
    margin-top: 2rem;
  }

  .danger-zone h3 {
    color: #c53030;
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .danger-zone p {
    color: #718096;
    font-size: 0.875rem;
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .delete-button {
    background: #fed7d7;
    color: #c53030;
    border: 1px solid #feb2b2;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .delete-button:hover:not(:disabled) {
    background: #fbb6ce;
    border-color: #f687b3;
  }

  .delete-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .delete-confirmation {
    text-align: center;
    padding: 1rem 0;
  }

  .warning-icon {
    color: #f59e0b;
    margin: 0 auto 1rem;
    display: flex;
    justify-content: center;
  }

  .delete-confirmation h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #c53030;
    margin: 0 0 1rem 0;
  }

  .delete-confirmation p {
    color: #718096;
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
  }

  .confirmation-input {
    text-align: left;
    margin-bottom: 1.5rem;
  }

  .confirmation-input label {
    display: block;
    font-size: 0.875rem;
    color: #374151;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .confirmation-input strong {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    background: #f7fafc;
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-size: 0.875rem;
  }

  .confirm-delete-button {
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .confirm-delete-button:hover:not(:disabled) {
    background: #b91c1c;
  }

  .confirm-delete-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Responsive design */
  @media (max-width: 480px) {
    .modal-backdrop {
      padding: 0.5rem;
    }

    .modal-header {
      padding: 1rem 1.5rem 0;
    }

    .modal-body {
      padding: 0 1.5rem 1.5rem;
    }

    .button-group {
      flex-direction: column;
    }

    .button-group button {
      width: 100%;
    }
  }
</style>