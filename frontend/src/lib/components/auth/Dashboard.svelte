<script lang="ts">
  import { goto } from "$app/navigation";
  import { auth, type User } from "$lib/stores/auth";
  import ProfileModal from "./ProfileModal.svelte";

  // Props
  export let user: User;

  // Component state
  let showProfileModal = false;
  let loading = false;

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

  // Handle logout
  async function handleLogout() {
    await auth.logout();
  }

  // Handle profile update
  function handleProfileUpdate(updatedUser: User) {
    user = updatedUser;
    showProfileModal = false;
  }
</script>

<div class="section bg-gray-50">
  <!-- Header -->
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <h1 class="navbar-title">Portfolio Manager</h1>
        <p class="text-muted">Welcome back, {user.username}!</p>
      </div>

      <div class="navbar-actions">
        <button
          class="btn btn-ghost"
          on:click={() => (showProfileModal = true)}
          disabled={loading}
        >
          <div class="avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span>{user.username}</span>
        </button>

        <button
          class="btn btn-destructive"
          on:click={handleLogout}
          disabled={loading}
        >
          {#if loading}
            <div class="loading-spinner"></div>
          {:else}
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
              />
            </svg>
          {/if}
          Logout
        </button>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="container">
    <!-- Stats Cards -->
    <div class="card-grid cols-3 animate-stagger">
      <div class="card card-feature animate-fade-in">
        <div class="feature-icon success">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
        </div>
        <h3>Account Status</h3>
        <p class="text-primary font-weight-600">Active</p>
        <p class="text-muted">Your account is in good standing</p>
      </div>

      <div class="card animate-fade-in">
        <div class="card-header">
          <h3>User Information</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <span class="form-label">User ID</span>
            <p class="font-mono text-muted">#{user.id}</p>
          </div>

          <div class="form-group">
            <span class="form-label">Account Created</span>
            <p class="text-muted">{formatDate(user.created_at)}</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card animate-fade-in">
        <div class="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div class="card-body">
          <button
            class="btn btn-outline btn-block"
            on:click={() => goto("/portfolios")}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            Manage Portfolios
          </button>

          <button class="btn btn-outline btn-block" disabled>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"
              />
            </svg>
            Add Transaction
          </button>

          <button class="btn btn-outline btn-block" disabled>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
              />
            </svg>
            Analytics
          </button>
        </div>
      </div>
    </div>
  </main>
</div>

<!-- Profile Modal -->
{#if showProfileModal}
  <ProfileModal
    {user}
    onClose={() => (showProfileModal = false)}
    onUpdate={handleProfileUpdate}
  />
{/if}
