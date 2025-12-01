<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import '../app.scss';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Global SVG defaults to avoid inline fill/stroke warnings and provide icon utility classes -->
<style>
	:global(svg) {
		/* sensible default: allow icons to inherit text color */
		color: inherit;
		/* Do not force fill/stroke for complex illustrations; default to currentColor for simple icons */
		fill: currentColor;
		stroke: none;
	}

	/* Use this class when an icon should be stroke-only (outline icons) */
	:global(.icon-stroke),
	:global(.btn-icon),
	:global(.edit-icon),
	:global(.empty-icon),
	:global(.upload-icon) {
		fill: none !important;
		stroke: currentColor !important;
	}

	/* Use this class for icons that must be filled */
	:global(.icon-fill) {
		fill: currentColor !important;
		stroke: none !important;
	}
</style>

{@render children?.()}
