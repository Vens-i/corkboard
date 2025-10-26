import { redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { locals } = event;
	if (!locals.user) throw redirect(303, '/auth');

	const supabase = createSupabaseServerClient(event);

	const { data: posts, error: err } = await supabase
		.from('posts')
		.select('*')
		.eq('owner_id', locals.user.id)
		.order('created_at', { ascending: false });

	if (err) console.error('Error fetching posts:', err);
	return { posts: posts ?? [] };
};
