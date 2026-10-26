<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="site-header">
	<a href="/">🔗 Shorten</a>
	<a class="tagline" href="/api/links" target="_blank" rel="noopener">API</a>
</header>

{@render children()}
