import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createLink, deleteLink, listLinks, validateLink } from '#lib/server/links.js';

export const load: PageServerLoad = async () => {
	return { links: listLinks() };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const slug = String(data.get('slug') ?? '')
			.trim()
			.toLowerCase();
		const url = String(data.get('url') ?? '').trim();

		const message = validateLink(slug, url);
		if (message) {
			return fail(400, { message, values: { slug, url } });
		}

		const link = createLink(slug, url);
		return { success: true, slug: link.slug };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		deleteLink(String(data.get('slug') ?? ''));
		return { success: true };
	}
};
