<!-- src/lib/components/Dashboard.svelte -->
<script lang="ts">
  import { auth, type User } from '$lib/stores/auth';
  import ProfileModal from './ProfileModal.svelte';

  // Props
  export let user: User;
  export let onLogout: (() => Promise<void>) | undefined = undefined;

  // Component state
  let showProfileModal = false;
  let loading = false;

  // Format date helper
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Handle logout
  async function handleLogout() {
    loading = true;
    try {
      await onLogout?.();
    } finally {
      loading = false;
    }
  }

  // Handle profile update
  function handleProfileUpdate(updatedUser: User) {
    user = updatedUser;
    showProfileModal = false;
  }
</script>

<div class="dashboard">
  <!-- Header -->
  <header class="dashboard-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="app-title">Portfolio Manager</h1>
        <p class="welcome-text">Welcome back, {user.username}!</p>
      </div>
      
      <div class="header-right">
        <button
          class="profile-button"
          on:click={() => showProfileModal = true}
          disabled={loading}
        >
          <div class="avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span class="username">{user.username}</span>
        </button>
        
        <button
          class="logout-button"
          on:click={handleLogout}
          disabled={loading}
        >
          {#if loading}
            <div class="button-spinner"></div>
          {:else}
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          {/if}
          Logout
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="dashboard-main">
    <div class="main-content">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <h3>Account Status</h3>
            <div class="stat-icon active">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
          <p class="stat-value">Active</p>
          <p class="stat-description">Your account is in good standing</p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Member Since</h3>
            <div class="stat-icon">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
            </div>
          </div>
          <p class="stat-value">{formatDate(user.created_at).split(',')[0]}</p>
          <p class="stat-description">Registration date</p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <h3>Last Updated</h3>
            <div class="stat-icon">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
          </div>
          <p class="stat-value">{formatDate(user.updated_at).split(',')[0]}</p>
          <p class="stat-description">Profile last modified</p>
        </div>
      </div>

      <!-- Account Information -->
      <div class="info-section">
        <div class="section-header">
          <h2>Account Information</h2>
          <button
            class="edit-button"
            on:click={() => showProfileModal = true}
            disabled={loading}
          >
            Edit Profile
          </button>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Username</span>
            <p>{user.username}</p>
          </div>
          
          <div class="info-item">
            <span class="info-label">Email Address</span>
            <p>{user.email}</p>
          </div>
          
          <div class="info-item">
            <span class="info-label">User ID</span>
            <p>#{user.id}</p>
          </div>
          
          <div class="info-item">
            <span class="info-label">Account Created</span>
            <p>{formatDate(user.created_at)}</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="actions-section">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <button class="action-card" disabled>
            <div class="action-icon">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3>Portfolio Overview</h3>
            <p>View your investment portfolio</p>
          </button>

          <button class="action-card" disabled>
            <div class="action-icon">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
              </svg>
            </div>
            <h3>Add Transaction</h3>
            <p>Record a new transaction</p>
          </button>

          <button class="action-card" disabled>
            <div class="action-icon">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
            <h3>Analytics</h3>
            <p>View performance analytics</p>
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
    onClose={() => showProfileModal = false}
    onUpdate={handleProfileUpdate}
  />
{/if}

<style>
  .dashboard {
    min-height: 100vh;
    background: #f8fafc;
  }

  .dashboard-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .app-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a202c;
    margin: 0;
  }

  .welcome-text {
    color: #718096;
    margin: 0;
    font-size: 0.875rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .profile-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .profile-button:hover:not(:disabled) {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  .avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .username {
    font-weight: 500;
    color: #2d3748;
  }

  .logout-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #fed7d7;
    color: #c53030;
    border: 1px solid #feb2b2;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
  }

  .logout-button:hover:not(:disabled) {
    background: #fbb6ce;
    border-color: #f687b3;
  }

  .logout-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .button-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(197, 48, 48, 0.3);
    border-top: 2px solid #c53030;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .dashboard-main {
    padding: 2rem;
  }

  .main-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }

  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .stat-header h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #718096;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #edf2f7;
    color: #4a5568;
  }

  .stat-icon.active {
    background: #c6f6d5;
    color: #38a169;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 0.5rem 0;
  }

  .stat-description {
    font-size: 0.875rem;
    color: #718096;
    margin: 0;
  }

  .info-section, .actions-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .section-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a202c;
    margin: 0;
  }

  .edit-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .edit-button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .edit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-item span.info-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .info-item p {
    font-size: 1rem;
    font-weight: 500;
    color: #2d3748;
    margin: 0;
  }

  .actions-section h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a202c;
    margin: 0 0 1.5rem 0;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .action-card {
    background: #f7fafc;
    border: 2px dashed #cbd5e0;
    border-radius: 12px;
    padding: 2rem;
    cursor: not-allowed;
    text-align: center;
    transition: all 0.2s;
    opacity: 0.6;
  }

  .action-icon {
    width: 48px;
    height: 48px;
    background: #e2e8f0;
    color: #a0aec0;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
  }

  .action-card h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #4a5568;
    margin: 0 0 0.5rem 0;
  }

  .action-card p {
    font-size: 0.875rem;
    color: #718096;
    margin: 0;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .header-content {
      padding: 1rem;
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .header-right {
      justify-content: center;
    }

    .dashboard-main {
      padding: 1rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .actions-grid {
      grid-template-columns: 1fr;
    }

    .section-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
  }
</style>