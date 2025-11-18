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
  let mainImage = project?.main_image || '';
  let loading = false;
  let categories: Category[] = [];

  // Load categories on mount
  onMount(async () => {
    try {
      categories = await categoryStore.getOwn(1, 100);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
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
        main_image: mainImage || undefined,
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

  <form on:submit={handleSubmit} class="project-form">
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

      <!-- Main Image -->
      <div class="form-group form-group-full">
        <label for="mainImage" class="form-label">Main Image URL</label>
        <input
          id="mainImage"
          type="url"
          class="form-input"
          placeholder="https://example.com/image.jpg (optional)"
          bind:value={mainImage}
          disabled={loading}
        />
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-ghost" on:click={onCancel} disabled={loading}>
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

<style>
  .project-form-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .form-header {
    margin-bottom: var(--space-8);
  }

  .form-header h2 {
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-2) 0;
  }

  .form-description {
    font-size: var(--text-base);
    color: var(--color-gray-600);
    margin: 0;
  }

  .project-form {
    background-color: var(--color-white);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    padding: var(--space-8);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
    margin-bottom: var(--space-8);
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group-full {
    grid-column: 1 / -1;
  }

  .form-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-gray-700);
    margin-bottom: var(--space-2);
  }

  .required {
    color: var(--color-error);
  }

  .form-help {
    font-size: var(--text-xs);
    color: var(--color-gray-500);
    margin: var(--space-1) 0 0 0;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    padding-top: var(--space-6);
    border-top: 1px solid var(--color-gray-200);
  }

  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.6s linear infinite;
    margin-right: var(--space-2);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .project-form {
      padding: var(--space-6);
    }

    .form-header h2 {
      font-size: var(--text-2xl);
    }
  }
</style>
