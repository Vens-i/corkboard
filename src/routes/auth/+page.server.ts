import { redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const { request } = event;
		const url = new URL(request.url);
		const doLogout = url.searchParams.has('logout');
		if (!doLogout) return {};

		const supabase = createSupabaseServerClient(event);
		await supabase.auth.signOut();
		throw redirect(303, '/board');
	}
};
