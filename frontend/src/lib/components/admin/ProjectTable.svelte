<script lang="ts">
  import { onMount } from 'svelte';
  import { projectStore, type Project } from '$lib/stores/project';
  import { goto } from '$app/navigation';
  import IconButton from '$lib/components/ui/IconButton.svelte';

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
                <IconButton
                  type="view"
                  onclick={() => goto(`/projects/${project.ID}`)}
                  label="View project"
                />
                <IconButton
                  type="edit"
                  onclick={() => goto(`/projects/${project.ID}/edit`)}
                  label="Edit project"
                />
                <IconButton
                  type="delete"
                  onclick={() => onDelete(project.ID)}
                  label="Delete project"
                />
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

