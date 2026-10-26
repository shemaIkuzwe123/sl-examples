export type Link = {
	slug: string
	url: string
	clicks: number
	createdAt: number
}

/**
 * In-memory store. Data lives for as long as the server process does —
 * it resets on every restart or redeploy. No database, no env vars.
 */
const links = new Map<string, Link>()

/** Slugs that would collide with app routes or files. */
const RESERVED = new Set(['api', 'favicon.ico', 'robots.txt'])

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/

function seed() {
	const base = Date.now()
	const samples: Array<[string, string]> = [
		['gh', 'https://github.com/sveltejs/kit'],
		['docs', 'https://svelte.dev/docs/kit'],
		['play', 'https://svelte.dev/playground']
	]
	samples.forEach(([slug, url], i) => {
		links.set(slug, { slug, url, clicks: 0, createdAt: base - i * 1000 })
	})
}

seed()

export function listLinks(): Link[] {
	return [...links.values()].sort((a, b) => b.createdAt - a.createdAt)
}

export function getLink(slug: string): Link | undefined {
	return links.get(slug)
}

export function createLink(slug: string, url: string): Link {
	const link: Link = { slug, url, clicks: 0, createdAt: Date.now() }
	links.set(slug, link)
	return link
}

export function deleteLink(slug: string): boolean {
	return links.delete(slug)
}

export function recordClick(slug: string): void {
	const link = links.get(slug)
	if (link) link.clicks += 1
}

/** Returns an error message, or `null` if the link is valid. */
export function validateLink(slug: string, url: string): string | null {
	if (!slug) return 'Pick a slug.'
	if (!SLUG_PATTERN.test(slug)) {
		return 'Slug can only contain lowercase letters, numbers and dashes.'
	}
	if (RESERVED.has(slug)) return `“${slug}” is reserved.`
	if (links.has(slug)) return `“${slug}” is already taken.`

	if (!url) return 'Add a destination URL.'
	try {
		const parsed = new URL(url)
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return 'URL must use http or https.'
		}
	} catch {
		return 'That is not a valid URL.'
	}
	return null
}
