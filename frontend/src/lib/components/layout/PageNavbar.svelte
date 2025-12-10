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
    /**
     * Optional icon to display before the label.
     * Supported values:
     * - 'arrow-left': Back/navigation arrow
     * - 'plus': Add/create new item
     * - 'edit': Edit/modify action
     * - 'settings': Settings/configuration
     * - 'view': View/visibility action
     */
    icon?: 'arrow-left' | 'plus' | 'edit' | 'settings' | 'view';
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
            class="btn"
            class:btn-outline={!action.variant || action.variant === 'outline'}
            class:btn-primary={action.variant === 'primary'}
            class:btn-ghost={action.variant === 'ghost'}
            onclick={action.onClick}
          >
            {#if action.icon === 'arrow-left'}
              <svg class="icon-fill" width="16" height="16" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            {:else if action.icon === 'plus'}
              <svg class="icon-stroke" width="16" height="16" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            {:else if action.icon === 'edit'}
              <svg class="icon-stroke" width="16" height="16" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            {:else if action.icon === 'settings'}
              <svg class="icon-stroke" width="16" height="16" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            {:else if action.icon === 'view'}
              <svg class="icon-stroke" width="16" height="16" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

