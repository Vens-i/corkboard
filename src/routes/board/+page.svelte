<script lang="ts">
	import { onMount } from 'svelte';
	import { posts } from '$lib/stores/posts';
	import type { Post } from '$lib/types';

	let postList: Post[] = [];
	let loading = true;
	let error = '';

	onMount(() => {
		(async () => {
			try {
				await posts.loadInitial();
				const unsubscribe = posts.subscribe((list) => {
					postList = list;
					loading = false;
				});
				posts.subscribeRealtime();
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to load posts';
				loading = false;
			}
		})();
	});
</script>

<div class="space-y-4">
	<h1 class="text-3xl font-semibold mb-6">Community Board</h1>

	{#if loading}
		<p class="text-gray-500 text-center py-12">Loading posts...</p>
	{:else if error}
		<p class="text-red-500 text-center py-12">⚠️ {error}</p>
	{:else if postList.length === 0}
		<div class="text-center py-12 text-gray-400">
			<p class="text-lg">No posts yet. Be the first to share something!</p>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each postList as post (post.id)}
				<a
					href="/post/{post.id}"
					class="p-4 border rounded-lg hover:shadow-md transition block bg-white"
				>
					{#if post.image_url}
						<img
							src={post.image_url}
							alt={post.title}
							class="w-full h-40 object-cover rounded mb-2"
						/>
					{/if}
					<h2 class="text-lg font-semibold mb-1">{post.title}</h2>
					{#if post.description}
						<p class="text-gray-600 text-sm mb-2 line-clamp-2">{post.description}</p>
					{/if}
					{#if post.price}
						<p class="text-green-600 font-semibold mb-2">${post.price}</p>
					{/if}
					{#if post.location}
						<p class="text-gray-500 text-xs">{post.location}</p>
					{/if}
					{#if post.is_taken}
						<div class="mt-2 text-xs text-red-600">Taken</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
