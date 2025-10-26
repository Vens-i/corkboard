import type { RequestEvent } from '@sveltejs/kit';

export const load = async (event: RequestEvent) => {
	const { locals } = event;
	return {
		user: locals.user,
		session: locals.session
	};
};
