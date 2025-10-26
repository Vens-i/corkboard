import { json } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	const { request, locals } = event;

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { title, description, price, location } = body;

	if (!title) {
		return json({ error: 'Title is required' }, { status: 400 });
	}

	const supabase = createSupabaseServerClient(event);

	const { data, error } = await supabase.from('posts').insert({
		title,
		description: description || null,
		price: price || null,
		location: location || null,
		user_id: locals.user.id,
		owner_id: locals.user.id,
		is_taken: false
	});

	if (error) {
		return json({ error: error.message }, { status: 400 });
	}

	return json({ success: true, data });
};
