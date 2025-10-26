export const load = async ({ locals }) => {
	return {
		session: locals.session ?? null,
		user: locals.user ?? null
	};
};
