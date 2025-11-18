<script lang="ts">
  import type { User } from '$lib/stores/auth';

  // Props
  export let user: User;
  export let pageTitle = 'Dashboard';
  export let onMenuToggle: () => void;

  let searchQuery = '';
</script>

<header class="admin-topbar">
  <div class="topbar-content">
    <div class="topbar-left">
      <button class="menu-toggle" on:click={onMenuToggle} aria-label="Toggle menu">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h2 class="page-title">{pageTitle}</h2>
    </div>

    <div class="topbar-right">
      <!-- Search -->
      <div class="topbar-search">
        <div class="search-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search..."
          bind:value={searchQuery}
        />
      </div>

      <!-- Notifications -->
      <button class="notification-btn" aria-label="Notifications">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span class="notification-badge"></span>
      </button>
    </div>
  </div>
</header>
