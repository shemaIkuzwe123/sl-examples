<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} · URL Shortener</title>
</svelte:head>

<main>
	<h1>{page.status}</h1>
	<p class="error">{page.error?.message}</p>
	<p><a href="/">← Back to all links</a></p>
</main>
