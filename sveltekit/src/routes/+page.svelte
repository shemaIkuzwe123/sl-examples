<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let copied = $state<string | null>(null);
	let submitter = $state<string | null>(null);

	function shortUrl(slug: string): string {
		return `${page.url.origin}/${slug}`;
	}

	async function copy(slug: string) {
		try {
			await navigator.clipboard.writeText(shortUrl(slug));
			copied = slug;
			setTimeout(() => {
				if (copied === slug) copied = null;
			}, 1500);
		} catch {
			// clipboard unavailable (e.g. insecure context) — ignore
		}
	}
</script>

<svelte:head>
	<title>URL Shortener · SvelteKit</title>
</svelte:head>

<main>
	<h1>URL Shortener</h1>

	<form
		method="POST"
		action="?/create"
		use:enhance={() => {
			submitter = 'create';
			return async ({ result, update }) => {
				if (result.type === 'success') {
					const form = document.querySelector<HTMLFormElement>('form[action="?/create"]');
					form?.reset();
				}
				submitter = null;
				await update();
			};
		}}
	>
		<div class="fields">
			<label>
				<span>Slug</span>
				<input
					name="slug"
					placeholder="my-link"
					pattern="[a-zA-Z0-9-]+"
					required
					value={page.form?.values?.slug ?? ''}
				/>
			</label>
			<label class="grow">
				<span>Destination URL</span>
				<input
					name="url"
					type="url"
					placeholder="https://example.com/very/long/url"
					required
					value={page.form?.values?.url ?? ''}
				/>
			</label>
			<button type="submit" disabled={submitter === 'create'}>
				{submitter === 'create' ? 'Shortening…' : 'Shorten'}
			</button>
		</div>
		{#if page.form?.message}
			<p class="error">{page.form.message}</p>
		{/if}
	</form>

	<ul class="links">
		{#each data.links as link (link.slug)}
			<li>
				<div class="info">
					<a class="short" href="/{link.slug}" target="_blank" rel="noopener">
						/{link.slug}
					</a>
					<span class="target" title={link.url}>{link.url}</span>
					<span class="meta">
						{link.clicks}
						{link.clicks === 1 ? 'click' : 'clicks'} ·
						{new Date(link.createdAt).toLocaleDateString()}
					</span>
				</div>
				<div class="row">
					<button type="button" onclick={() => copy(link.slug)}>
						{copied === link.slug ? 'Copied!' : 'Copy'}
					</button>
					<form
						method="POST"
						action="?/delete"
						use:enhance={() => {
							submitter = link.slug;
							return async ({ update }) => {
								submitter = null;
								await update();
							};
						}}
					>
						<input type="hidden" name="slug" value={link.slug} />
						<button type="submit" class="danger" disabled={submitter === link.slug}>
							Delete
						</button>
					</form>
				</div>
			</li>
		{:else}
			<li class="empty">No links yet — create the first one above.</li>
		{/each}
	</ul>
</main>
