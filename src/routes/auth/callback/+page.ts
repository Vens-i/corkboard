import type { PageLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageLoad = async ({ url }) => {
	const code = url.searchParams.get('code');
	if (code) await supabase.auth.exchangeCodeForSession(code);
	return {};
};
