<script lang="ts" runes>
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';
  import AdminTopBar from '$lib/components/admin/AdminTopBar.svelte';

  let user = $derived($auth.user);
  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);

  onMount(() => {
    if (browser) {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        sidebarCollapsed = saved === 'true';
      }
    }
  });

  function toggleSidebarCollapse() {
    sidebarCollapsed = !sidebarCollapsed;
    if (browser) {
      localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
    }
  }

  const status = $page.status;
  const message = $page.error?.message || 'An error occurred';
</script>

<svelte:head>
  <title>{status} - Portfolio Manager</title>
</svelte:head>

{#if user}
  <!-- Authenticated user - show with sidebar -->
  <div class="admin-layout">
    <AdminSidebar
      {user}
      isOpen={sidebarOpen}
      isCollapsed={sidebarCollapsed}
      onClose={() => sidebarOpen = false}
      onToggleCollapse={toggleSidebarCollapse}
    />

    <div class="admin-main" class:sidebar-collapsed={sidebarCollapsed}>
      <AdminTopBar
        {user}
        pageTitle="Error"
        onMenuToggle={() => sidebarOpen = !sidebarOpen}
      />

      <main class="admin-content">
        <div class="error-container">
          <div class="error-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1>{status}</h1>
          <p class="error-message">{message}</p>
          <div class="error-actions">
            <a href="/dashboard" class="btn btn-primary">
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Dashboard
            </a>
            <button class="btn btn-secondary" onclick={() => window.history.back()}>
              <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
{:else}
  <!-- Public user - show without sidebar -->
  <div class="error-page">
    <div class="error-container">
      <div class="error-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1>{status}</h1>
      <p class="error-message">{message}</p>
      <div class="error-actions">
        <a href="/" class="btn btn-primary">
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Go Home
        </a>
        <button class="btn btn-secondary" onclick={() => window.history.back()}>
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Go Back
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .error-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-gray-50);
    padding: var(--space-4);
  }

  .error-container {
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
    padding: var(--space-8);
  }

  .error-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto var(--space-6);
    color: var(--color-red-500);
  }

  .error-icon svg {
    width: 100%;
    height: 100%;
  }

  h1 {
    font-size: var(--text-6xl);
    font-weight: 800;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-4);
  }

  .error-message {
    font-size: var(--text-xl);
    color: var(--color-gray-600);
    margin: 0 0 var(--space-8);
  }

  .error-actions {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-icon {
    width: 20px;
    height: 20px;
    margin-right: var(--space-2);
  }

  @media (max-width: 640px) {
    h1 {
      font-size: var(--text-4xl);
    }

    .error-message {
      font-size: var(--text-lg);
    }

    .error-actions {
      flex-direction: column;
      width: 100%;
    }

    .error-actions .btn {
      width: 100%;
    }
  }
</style>
