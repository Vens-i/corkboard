import type { Handle } from '@sveltejs/kit';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import { createSupabaseServerClient } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	console.log('🔐 Auth Hook - Env', {
		hasSupabaseUrl: Boolean(SUPABASE_URL),
		hasSupabaseAnonKey: Boolean(SUPABASE_ANON_KEY)
	});

	const supabase = createSupabaseServerClient(event);

	const {
		data: { session }
	} = await supabase.auth.getSession();

	console.log('🔐 Auth Hook - Session', {
		hasSession: Boolean(session),
		userId: session?.user?.id ?? null
	});

	event.locals.session = session ?? null;
	event.locals.user = session?.user ?? null;

	return resolve(event);
};
