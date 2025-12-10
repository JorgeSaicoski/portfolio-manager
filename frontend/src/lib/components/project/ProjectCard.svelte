<script lang="ts">
  /**
   * ProjectCard Component
   * Reusable project card display with skills
   */

  import type { Project } from '$lib/types/api';

  interface Props {
    project: Project;
    maxSkills?: number;
    showDescription?: boolean;
  }

  let {
    project,
    maxSkills = 3,
    showDescription = true
  }: Props = $props();

  // Calculate remaining skills count
  const remainingSkills = $derived(
    project.skills && project.skills.length > maxSkills
      ? project.skills.length - maxSkills
      : 0
  );

  // Get visible skills
  const visibleSkills = $derived(
    project.skills ? project.skills.slice(0, maxSkills) : []
  );
</script>

<a
  class="project-card"
  href={`/projects/${project.ID}`}
  aria-label={`Open project ${project.title}`}
>
  <div class="project-info">
    <h4 class="project-title">{project.title}</h4>

    {#if showDescription && project.description}
      <p class="project-description">{project.description}</p>
    {/if}

    {#if project.skills && project.skills.length > 0}
      <div class="project-skills">
        {#each visibleSkills as skill}
          <span class="skill-tag">{skill}</span>
        {/each}
        {#if remainingSkills > 0}
          <span class="skill-tag">+{remainingSkills}</span>
        {/if}
      </div>
    {/if}
  </div>
</a>

<!-- Styles are in global CSS -->

