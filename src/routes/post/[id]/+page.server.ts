import { error, fail, redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { params } = event;
	const supabase = createSupabaseServerClient(event);

	const { data, error: err } = await supabase
		.from('posts')
		.select('*')
		.eq('id', params.id)
		.single();

	if (err || !data) throw error(404, 'Not found');
	return { post: data };
};

export const actions: Actions = {
	mark_taken: async (event) => {
		const { params, locals } = event;
		if (!locals.user) throw redirect(303, '/auth');

		const supabase = createSupabaseServerClient(event);

		const { error: updErr } = await supabase
			.from('posts')
			.update({ is_taken: true })
			.eq('id', params.id)
			.eq('owner_id', locals.user.id);

		if (updErr) return fail(400, { message: updErr.message });
		return { success: true };
	}
};
