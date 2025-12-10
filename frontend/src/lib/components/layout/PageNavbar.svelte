<script lang="ts">
  /**
   * PageNavbar Component
   * Reusable page navigation with breadcrumbs and actions
   */

  interface Breadcrumb {
    label: string;
    onClick?: () => void;
    active?: boolean;
  }

  interface Action {
    label: string;
    icon?: string;
    onClick: () => void;
    variant?: 'outline' | 'primary' | 'ghost';
  }

  interface Props {
    breadcrumbs: Breadcrumb[];
    actions?: Action[];
    title?: string;
  }

  let {
    breadcrumbs,
    actions = [],
    title = 'Portfolio Manager'
  }: Props = $props();
</script>

<nav class="navbar">
  <div class="navbar-container">
    <div class="navbar-brand">
      <h1 class="navbar-title">{title}</h1>
      <div class="breadcrumb">
        {#each breadcrumbs as crumb, index}
          <div class="breadcrumb-item" class:active={crumb.active}>
            {#if crumb.onClick && !crumb.active}
              <button onclick={crumb.onClick} class="btn btn-ghost btn-sm">
                {crumb.label}
              </button>
            {:else}
              {crumb.label}
            {/if}
          </div>
        {/each}
      </div>
    </div>

    {#if actions.length > 0}
      <div class="navbar-actions">
        {#each actions as action}
          <button
            class="btn btn-{action.variant || 'outline'}"
            onclick={action.onClick}
          >
            {#if action.icon === 'arrow-left'}
              <svg class="icon-fill" width="16" height="16" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            {/if}
            {action.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</nav>

<!-- Styles are in global CSS -->

