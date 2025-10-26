// Browser-side Supabase client singleton (called once then stored) for SvelteKit
// Use createServerClient in hooks/+server files for server needs
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function supabase() {
	if (!client) {
		if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
			console.warn('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
		}
		client = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	}
	return client;
}
