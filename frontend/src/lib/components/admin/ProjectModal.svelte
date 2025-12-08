<script lang="ts">
    import { projectStore } from '$lib/stores/project';
    import { categoryStore } from '$lib/stores/category';
    import { toastStore as toast } from '$lib/stores/toast';
    import { onMount } from 'svelte';
    import type { Project } from '$lib/types/api';

    // Props
    export let project: Project | null = null;
    export let category_id: number;
    export let onClose: () => void;
    export let onSuccess: () => void;

    // Form state
    let title = project?.title || '';
    let description = project?.description || '';
    let skills = project?.skills?.join(', ') || '';
    let client = project?.client || '';
    let link = project?.link || '';
    let loading = false;
    let categoryError = false;
    let categoryName = ''; // will hold the category name

    // Keep local form values in sync if `project` prop changes
    $: if (project) {
        title = project.title ?? title;
        description = project.description ?? description;
        skills = project.skills?.join(', ') ?? skills;
        client = project.client ?? client;
        link = project.link ?? link;
    }

    // Load category name on mount
    onMount(async () => {
        try {
            const cat = await categoryStore.getById(category_id);
            categoryName = cat?.title ?? `Category ${category_id}`;
        } catch (err) {
            console.error('Error fetching category name', err);
            categoryName = `Category ${category_id}`;
        }
    });

    // Handle form submit
    async function handleSubmit(event: Event) {
        event.preventDefault();

        categoryError = false;
        loading = true;

        try {
            // Parse skills from comma-separated string
            const skillsArray = skills
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            if (project) {
                // Update existing project (category cannot be changed)
                console.log('ProjectModal: Updating project', {
                    projectID: project.ID,
                    data: { title, description, skills: skillsArray, client, link }
                });
                const result = await projectStore.update(project.ID, {
                    title,
                    description,
                    skills: skillsArray.length > 0 ? skillsArray : undefined,
                    client: client || undefined,
                    link: link || undefined
                });
                console.log('ProjectModal: Project updated successfully', result);
                toast.success('Project updated successfully!');
            } else {
                // Create new project
                const requestData = {
                    title,
                    description,
                    category_id,
                    skills: skillsArray.length > 0 ? skillsArray : undefined,
                    client: client || undefined,
                    link: link || undefined
                };
                console.log('ProjectModal: Creating project with data:', requestData);
                const result = await projectStore.create(requestData);
                console.log('ProjectModal: Project created successfully', result);
                toast.success('Project created successfully!');
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('ProjectModal: Error during project operation', {
                error,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                isEdit: !!project
            });
            toast.error(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            loading = false;
        }
    }
</script>

<style>
    .modal {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 1050 !important;
    }

    .form-error {
        color: var(--color-error, #ef4444);
        font-size: 0.875rem;
        margin-top: 0.25rem;
    }
</style>

<div class="modal show" onclick={onClose} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && onClose()}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
        <div class="modal-header">
            <h3>{project ? 'Edit Project' : 'Create New Project'}</h3>
            <button class="modal-close" onclick={onClose} aria-label="Close modal">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <form onsubmit={handleSubmit}>
            <div class="modal-body">
                <div class="form-group">
                    <label for="category" class="form-label">Category *</label>

                    <p>Category: {categoryName || `Category ${category_id}`}</p>
                    <input type="hidden" id="category" value={category_id} />

                    {#if categoryError}
                        <p class="form-error">Please select a category</p>
                    {/if}
                    <p class="form-hint">Category cannot be changed after creation</p>
                </div>

                <div class="form-group">
                    <label for="title" class="form-label">Project Title *</label>
                    <input
                            id="title"
                            type="text"
                            class="form-input"
                            placeholder="Project Title"
                            bind:value={title}
                            required
                            disabled={loading}
                    />
                </div>

                <div class="form-group">
                    <label for="description" class="form-label">Description *</label>
                    <textarea
                            id="description"
                            class="form-input"
                            placeholder="Project description"
                            rows="3"
                            bind:value={description}
                            required
                            disabled={loading}
                    ></textarea>
                </div>

                <div class="form-group">
                    <label for="skills" class="form-label">Skills</label>
                    <input
                            id="skills"
                            type="text"
                            class="form-input"
                            placeholder="e.g. JavaScript, React, Node.js (comma-separated)"
                            bind:value={skills}
                            disabled={loading}
                    />
                    <p class="form-hint">Separate skills with commas</p>
                </div>

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

                <div class="form-group">
                    <label for="link" class="form-label">Link</label>
                    <input
                            id="link"
                            type="url"
                            class="form-input"
                            placeholder="https://example.com (optional)"
                            bind:value={link}
                            disabled={loading}
                    />
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-ghost" onclick={onClose} disabled={loading}>
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
</div>
