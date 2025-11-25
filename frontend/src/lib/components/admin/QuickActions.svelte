<script lang="ts">
  // Props
  export let onPortfolioClick: () => void;
  export let onProjectClick: () => void;
  export let onCategoryClick: () => void;
  export let onSectionClick: () => void;
</script>

<div class="quick-actions">
  <div class="actions-header">
    <h3>Quick Actions</h3>
  </div>
  <div class="actions-grid">
    <button class="action-btn primary" onclick={onPortfolioClick}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      <span>New Portfolio</span>
    </button>

    <button class="action-btn success" onclick={onProjectClick}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      <span>New Project</span>
    </button>

    <button class="action-btn warning" onclick={onCategoryClick}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
      <span>New Category</span>
    </button>

    <button class="action-btn info" onclick={onSectionClick}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
      </svg>
      <span>New Section</span>
    </button>
  </div>
</div>
