<script lang="ts">
  import { projectStore, type ProjectState } from '$lib/stores/project';
  import { categoryStore } from '$lib/stores/category';
  import { toastStore as toast } from '$lib/stores/toast';
  import type { Project, CreateProjectRequest, Category } from '$lib/types/api';
  import { onMount } from 'svelte';

  // Props
  export let project: Project | null = null; // null for create, object for edit
  export let onSuccess: () => void;
  export let onCancel: () => void;

  // Form state
  let title = project?.title || '';
  let description = project?.description || '';
  let categoryId = project?.category_id || 0;
  let client = project?.client || '';
  let link = project?.link || '';
  let skills = project?.skills?.join(', ') || '';
  let loading = false;
  let categories: Category[] = [];

  // Load categories on mount
  onMount(async () => {
    try {
      categories = await categoryStore.getOwn(1, 100);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load form data');
    }
  });


  // Handle form submit
  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (categoryId === 0) {
      toast.error('Please select a category');
      return;
    }

    loading = true;

    try {
      const projectData: CreateProjectRequest = {
        title,
        description,
        category_id: categoryId,
        client: client || undefined,
        link: link || undefined,
        skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      };

      if (project) {
        // Update existing project
        await projectStore.update(project.ID, projectData);
        toast.success('Project updated successfully!');
      } else {
        // Create new project
        await projectStore.create(projectData);
        toast.success('Project created successfully!');
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      loading = false;
    }
  }
</script>

<div class="project-form-container">
  <div class="form-header">
    <h2>{project ? 'Edit Project' : 'Create New Project'}</h2>
    <p class="form-description">
      {project ? 'Update your project details below' : 'Fill in the details to create a new project'}
    </p>
  </div>

  <form onsubmit={handleSubmit} class="project-form">
    <div class="form-grid">
      <!-- Title -->
      <div class="form-group">
        <label for="title" class="form-label">
          Project Title <span class="required">*</span>
        </label>
        <input
          id="title"
          type="text"
          class="form-input"
          placeholder="Enter project title"
          bind:value={title}
          required
          disabled={loading}
        />
      </div>

      <!-- Category -->
      <div class="form-group">
        <label for="category" class="form-label">
          Category <span class="required">*</span>
        </label>
        <select
          id="category"
          class="form-input"
          bind:value={categoryId}
          required
          disabled={loading}
        >
          <option value={0} disabled>Select a category</option>
          {#each categories as category}
            <option value={category.ID}>{category.title}</option>
          {/each}
        </select>
      </div>

      <!-- Client -->
      <div class="form-group">
        <label for="client" class="form-label">Client</label>
        <input
          id="client"
          type="text"
          class="form-input"
          placeholder="Client name (optional)"
          bind:value={client}
          disabled={loading}
        />
      </div>

      <!-- Link -->
      <div class="form-group">
        <label for="link" class="form-label">Project Link</label>
        <input
          id="link"
          type="url"
          class="form-input"
          placeholder="https://example.com (optional)"
          bind:value={link}
          disabled={loading}
        />
      </div>

      <!-- Description -->
      <div class="form-group form-group-full">
        <label for="description" class="form-label">
          Description <span class="required">*</span>
        </label>
        <textarea
          id="description"
          class="form-input"
          placeholder="Describe your project..."
          rows="4"
          bind:value={description}
          required
          disabled={loading}
        ></textarea>
      </div>

      <!-- Skills -->
      <div class="form-group form-group-full">
        <label for="skills" class="form-label">Skills</label>
        <input
          id="skills"
          type="text"
          class="form-input"
          placeholder="e.g., JavaScript, React, Node.js (comma-separated)"
          bind:value={skills}
          disabled={loading}
        />
        <p class="form-help">Enter skills separated by commas</p>
      </div>
    </div>


    <div class="form-actions">
      <button type="button" class="btn btn-ghost" onclick={onCancel} disabled={loading}>
        Cancel
      </button>
      <button type="submit" class="btn btn-primary" disabled={loading}>
        {#if loading}
          <span class="loading-spinner"></span>
        {/if}
        {project ? 'Update' : 'Create'} Project
      </button>
    </div>
  </form>
</div>

