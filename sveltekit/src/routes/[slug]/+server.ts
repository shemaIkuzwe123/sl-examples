import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLink, recordClick } from '#lib/server/links.js';

// Redirects to a stored external URL, so v3 requires `{ external: true }`.
export const GET: RequestHandler = ({ params }) => {
	const link = getLink(params.slug);
	if (!link) {
		error(404, 'Short link not found');
	}
	recordClick(params.slug);
	redirect(302, link.url, { external: true });
};
