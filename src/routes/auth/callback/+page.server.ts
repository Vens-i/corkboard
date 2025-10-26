import { redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const supabase = createSupabaseServerClient(event);
	const code = event.url.searchParams.get('code');

	console.log('🔐 Auth Callback - Code present', { hasCode: Boolean(code) });

	if (code) {
		const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
		if (exchangeError) {
			console.error('🔐 Auth Callback - Exchange error', exchangeError);
			throw redirect(303, '/auth?error=oauth_exchange');
		}
	} else {
		const { error: refreshError } = await supabase.auth.getSession();
		if (refreshError) {
			console.error('🔐 Auth Callback - Session refresh error', refreshError);
		}
	}

	const {
		data: { session },
		error: sessionError
	} = await supabase.auth.getSession();

	if (sessionError) {
		console.error('🔐 Auth Callback - Post-exchange session error', sessionError);
	}

	console.log('🔐 Auth Callback - Session result', {
		hasUser: Boolean(session?.user),
		userId: session?.user?.id ?? null
	});

	throw redirect(303, '/board');
};
