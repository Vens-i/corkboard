<script lang="ts">
	import { page } from '$app/stores';

	$: errorCode = $page.url.searchParams.get('error');
	$: errorMessage =
		errorCode === 'oauth_exchange'
			? 'Unable to complete sign-in. Please try again.'
			: errorCode === 'oauth_start'
				? 'Unable to reach Google. Please try again.'
				: null;
</script>

<div class="max-w-md mx-auto p-6 border rounded space-y-4">
	<h1 class="text-xl font-semibold">Sign in</h1>
	{#if errorMessage}
		<p class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
			{errorMessage}
		</p>
	{/if}
	<a
		href="/auth/google"
		class="flex w-full items-center justify-center gap-2 rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
	>
		Continue with Google
	</a>
</div>
