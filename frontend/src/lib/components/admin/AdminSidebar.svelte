<script lang="ts">
  import { page } from '$app/stores';
  import type { User } from '$lib/stores/auth';

  // Props
  export let user: User;
  export let isOpen = false;
  export let isCollapsed = false;
  export let onClose: () => void;
  export let onToggleCollapse: () => void;

  // Check if route is active
  function isActive(path: string): boolean {
    return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
  }
</script>

<div class="admin-sidebar" class:open={isOpen} class:collapsed={isCollapsed}>
  <div class="sidebar-header">
    <div class="sidebar-brand">
      <div class="brand-icon">P</div>
      <h1 class="brand-title">Portfolio Admin</h1>
    </div>
    <button class="sidebar-toggle-btn" on:click={onToggleCollapse} aria-label="Toggle sidebar">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <button class="sidebar-close" on:click={onClose} aria-label="Close sidebar">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <nav class="sidebar-nav">
    <ul class="nav-items">
      <li class="nav-item">
        <a href="/dashboard" class:active={isActive('/dashboard')}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
          <span>Dashboard</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="/portfolios" class:active={isActive('/portfolios')}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Portfolios</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="/categories" class:active={isActive('/categories')}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span>Categories</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="/sections" class:active={isActive('/sections')}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Sections</span>
        </a>
      </li>
      <li class="nav-item">
        <a href="/projects" class:active={isActive('/projects')}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Projects</span>
        </a>
      </li>
    </ul>
  </nav>

  <div class="sidebar-footer">
    <div class="user-profile">
      <div class="user-avatar">
        {user.preferred_username.charAt(0).toUpperCase()}
      </div>
      <div class="user-info">
        <p class="user-name">{user.preferred_username}</p>
        <p class="user-role">Administrator</p>
      </div>
    </div>
  </div>
</div>

{#if isOpen}
  <div class="sidebar-overlay" class:open={isOpen} on:click={onClose} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && onClose()} aria-label="Close sidebar"></div>
{/if}
