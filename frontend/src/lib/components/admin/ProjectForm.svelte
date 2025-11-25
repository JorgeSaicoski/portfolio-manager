<script lang="ts">
  import { projectStore, type ProjectState } from '$lib/stores/project';
  import { categoryStore } from '$lib/stores/category';
  import { imageStore } from '$lib/stores/image';
  import { toastStore as toast } from '$lib/stores/toast';
  import type { Project, CreateProjectRequest, Category, Image } from '$lib/types/api';
  import { onMount } from 'svelte';
  import ImageUpload from './ImageUpload.svelte';
  import ImageGallery from './ImageGallery.svelte';

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
  let projectImages: Image[] = project?.Images || [];

  // Load categories and images on mount
  onMount(async () => {
    try {
      categories = await categoryStore.getOwn(1, 100);

      // Load images if editing existing project
      if (project?.ID) {
        await loadProjectImages();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load form data');
    }
  });

  // Load project images
  async function loadProjectImages() {
    if (!project?.ID) return;

    try {
      projectImages = await imageStore.getByEntity('project', project.ID);
    } catch (error) {
      console.error('Failed to load images:', error);
      // Don't show error toast - it's expected that new projects have no images
      projectImages = [];
    }
  }

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
        const newProject = await projectStore.create(projectData);
        toast.success('Project created successfully! You can now add images.');
        // Update project reference for image upload
        project = newProject;
      }
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      loading = false;
    }
  }

  // Handle image upload completion
  function handleImageUploadComplete() {
    loadProjectImages();
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
    </div>

    <!-- Image Management Section (only show if project exists) -->
    {#if project?.ID}
      <div class="images-section">
        <h3 class="section-title">Project Images</h3>

        <!-- Existing Images Gallery -->
        {#if projectImages.length > 0}
          <div class="images-subsection">
            <h4 class="subsection-title">Manage Images</h4>
            <ImageGallery
              images={projectImages}
              onUpdate={handleImageUploadComplete}
            />
          </div>
        {/if}

        <!-- Image Upload -->
        <div class="images-subsection">
          <h4 class="subsection-title">Add New Images</h4>
          <ImageUpload
            entityType="project"
            entityId={project.ID}
            onUploadComplete={handleImageUploadComplete}
          />
        </div>
      </div>
    {:else}
      <div class="info-box">
        <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Save the project first to add images</p>
      </div>
    {/if}

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

  .images-section {
    margin-top: var(--space-8);
    padding-top: var(--space-8);
    border-top: 1px solid var(--color-gray-200);
  }

  .section-title {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-gray-900);
    margin: 0 0 var(--space-6) 0;
  }

  .images-subsection {
    margin-bottom: var(--space-6);
  }

  .images-subsection:last-child {
    margin-bottom: 0;
  }

  .subsection-title {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-gray-700);
    margin: 0 0 var(--space-4) 0;
  }

  .info-box {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background-color: #ebf8ff;
    border: 1px solid #bee3f8;
    border-radius: var(--radius-lg);
    color: #2c5282;
    margin-top: var(--space-8);
  }

  .info-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }

  .info-box p {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 500;
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
