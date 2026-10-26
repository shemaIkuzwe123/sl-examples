import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createLink, listLinks, validateLink } from '#lib/server/links.js';

export const GET: RequestHandler = () => {
	return Response.json({ links: listLinks() });
};

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Request body must be JSON.');
	}
	if (typeof body !== 'object' || body === null) {
		error(400, 'Request body must be a JSON object.');
	}

	const slug = String((body as Record<string, unknown>).slug ?? '')
		.trim()
		.toLowerCase();
	const url = String((body as Record<string, unknown>).url ?? '').trim();

	const message = validateLink(slug, url);
	if (message) {
		return Response.json({ message }, { status: 422 });
	}

	return Response.json({ link: createLink(slug, url) }, { status: 201 });
};
