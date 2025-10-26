import { redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const supabase = createSupabaseServerClient(event);
	const redirectTo = new URL('/auth/callback', event.url.origin).toString();

	console.log('🔐 Auth Google - Starting OAuth', { redirectTo });

	const { data, error: authError } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: { redirectTo }
	});

	if (authError) {
		console.error('🔐 Auth Google - OAuth start error', authError);
		throw redirect(303, '/auth?error=oauth_start');
	}

	if (!data?.url) {
		console.error('🔐 Auth Google - Missing redirect URL from Supabase');
		throw redirect(303, '/auth?error=oauth_start');
	}

	throw redirect(303, data.url);
};
