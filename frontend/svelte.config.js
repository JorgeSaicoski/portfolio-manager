import { createRequire } from 'module';

// Make adapter and preprocess imports resilient for IDE/indexers that don't have dev deps installed
const require = createRequire(import.meta.url);

let adapterAuto;
let vitePreprocessFn;
try {
	adapterAuto = require('@sveltejs/adapter-auto').default;
} catch (e) {
	// Fallback no-op adapter to prevent false-negative errors in IDEs
	adapterAuto = function noopAdapter() {
		return {
			name: 'noop-adapter',
			adapt: async () => {
				console.warn('[svelte.config.js] Using noop adapter for editor analysis.');
			}
		};
	};
}

try {
	vitePreprocessFn = require('@sveltejs/vite-plugin-svelte').vitePreprocess;
} catch (e) {
	// If the plugin isn't available during editor analysis, skip preprocessing
	vitePreprocessFn = undefined;
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocessFn ? vitePreprocessFn() : undefined,

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapterAuto()
	}
};

export default config;
