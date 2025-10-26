<!-- <script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	let posts: any[] = [];
	let loading = true;
	let errorMsg = '';

	onMount(async () => {
		const { data, error } = await supabase
			.from('posts')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Supabase error:', error);
			errorMsg = error.message;
		} else {
			posts = data || [];
		}

		loading = false;
	});
</script>

<main class="min-h-screen flex flex-col items-center justify-center text-center p-8">
	<h1 class="text-4xl font-bold tracking-tight mb-2">CorkBoard is under development 🎉</h1>
	<p class="text-gray-600 mb-8">SvelteKit + Tailwind, clean start.</p>

	{#if loading}
		<p class="text-gray-500 animate-pulse">Loading posts...</p>
	{:else if errorMsg}
		<p class="text-red-500">⚠️ {errorMsg}</p>
	{:else if posts.length === 0}
		<p class="text-gray-400 italic">No posts yet. Be the first to share something!</p>
	{:else}
		<section class="w-full max-w-2xl text-left">
			<h2 class="text-2xl font-semibold mb-3">Recent Posts</h2>
			<ul class="space-y-3">
				{#each posts as post}
					<li class="p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
						<h3 class="text-lg font-medium">{post.title}</h3>
						{#if post.description}
							<p class="text-gray-600 text-sm mt-1">{post.description}</p>
						{/if}
						<p class="text-gray-400 text-xs mt-2">
							Posted on {new Date(post.created_at).toLocaleString()}
						</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main> -->
<script lang="ts">
	import { supabase } from '$lib/supabaseClient';

	let email = '';

	// 🔹 Sends the magic link to the provided email
	async function sendMagicLink() {
		if (!email) return alert('Please enter your email.');
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: 'http://localhost:5173/auth/callback'
			}
		});
		alert(error ? error.message : '✅ Magic link sent! Check your inbox.');
	}

	// 🔹 Tests inserting a post (requires a logged-in user)
	async function testInsert() {
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (!user) {
			alert('Please sign in first (check your email for a magic link).');
			return;
		}

		const { data, error } = await supabase
			.from('posts')
			.insert({
				user_id: user.id,
				category_id: 1, // for-sale
				title: 'Test post from Svelte',
				description: 'This is a test insert via Supabase client.',
				city: 'Buffalo',
				state: 'NY'
			})
			.select();

		if (error) {
			console.error('❌ Insert failed:', error);
			alert(error.message);
		} else {
			console.log('✅ Insert successful:', data);
			alert('Insert successful! Check your posts table.');
		}
	}
</script>

<!-- 🔹 UI -->
<div class="space-y-4 mt-8">
	<!-- Magic link form -->
	<div class="flex items-center space-x-2">
		<input
			type="email"
			bind:value={email}
			placeholder="you@example.com"
			class="border p-2 rounded flex-grow"
		/>
		<button
			class="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
			on:click={sendMagicLink}
		>
			Send Magic Link
		</button>
	</div>

	<!-- Insert test button -->
	<button
		class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
		on:click={testInsert}
	>
		Test Supabase Insert
	</button>
</div>
