<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	let msg = 'Signing you in…';

	onMount(async () => {
		try {
			// First try hash tokens (magic link)
			const hash = window.location.hash?.slice(1) || '';
			const h = new URLSearchParams(hash);
			const access_token = h.get('access_token');
			const refresh_token = h.get('refresh_token');

			if (access_token && refresh_token) {
				const { error } = await supabase.auth.setSession({ access_token, refresh_token });
				if (error) throw error;
				msg = 'Signed in! Redirecting…';
				// Clean URL and go home
				window.history.replaceState({}, '', '/');
				window.location.href = '/';
				return;
			}

			// Otherwise try code param (OAuth/PKCE)
			const code = new URLSearchParams(window.location.search).get('code');
			if (code) {
				// If you installed @supabase/supabase-js v2, this exchanges the code server-side with Supabase
				const { error } = await supabase.auth.exchangeCodeForSession(code);
				if (error) throw error;
				msg = 'Signed in! Redirecting…';
				window.history.replaceState({}, '', '/');
				window.location.href = '/';
				return;
			}

			msg = 'No auth credentials found in the URL.';
		} catch (e: any) {
			console.error(e);
			msg = `Auth error: ${e?.message ?? 'unknown'}`;
		}
	});
</script>

<main class="min-h-screen grid place-items-center p-8">
	<p class="text-center text-gray-700">{msg}</p>
</main>
