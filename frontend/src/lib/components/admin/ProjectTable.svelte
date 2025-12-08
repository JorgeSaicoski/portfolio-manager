<script lang="ts">
  import { onMount } from 'svelte';
  import { projectStore, type Project } from '$lib/stores/project';
  import { goto } from '$app/navigation';

  // Props
  export let onDelete: (id: number) => void;

  // State
  let projects: Project[] = [];
  let loading = true;

  // Load projects
  onMount(async () => {
    try {
      const data = await projectStore.getOwn(1, 100);
      projects = data || [];
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      loading = false;
    }
  });
</script>

<div class="data-table-wrapper">
  <div class="table-header">
    <h3>Your Projects</h3>
  </div>

  {#if loading}
    <div class="table-empty">
      <p>Loading projects...</p>
    </div>
  {:else if projects.length === 0}
    <div class="table-empty">
      <div class="empty-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h4>No projects yet</h4>
      <p>Create your first project to get started</p>
    </div>
  {:else}
    <table class="data-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Description</th>
          <th>Client</th>
          <th>Link</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each projects as project}
          <tr>
            <td>{project.title}</td>
            <td>{project.description?.substring(0, 50) || 'No description'}{project.description && project.description.length > 50 ? '...' : ''}</td>
            <td>{project.client || '-'}</td>
            <td>
              {#if project.link}
                <a href={project.link} target="_blank" rel="noopener noreferrer" class="text-primary">View</a>
              {:else}
                -
              {/if}
            </td>
            <td>
              <div class="table-actions">
                <button class="btn-icon view" onclick={() => goto(`/projects/${project.ID}`)} aria-label="View project">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button class="btn-icon edit" onclick={() => goto(`/projects/${project.ID}/edit`)} aria-label="Edit project">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button class="btn-icon delete" onclick={() => onDelete(project.ID)} aria-label="Delete project">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .project-thumbnail {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    display: block;
  }

  .no-image-placeholder {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    color: #cbd5e0;
  }

  .no-image-placeholder svg {
    width: 32px;
    height: 32px;
  }
</style>
