<script lang="ts">
	import LocationFilter from '$lib/components/LocationFilter.svelte';
	import { onMount } from 'svelte';
	import { posts } from '$lib/stores/posts';
	import type { Post } from '$lib/types';
	import {
		boardOrigin,
		initializeBoardOrigin,
		type BoardOrigin
	} from '$lib/stores/boardOrigin';
	import { haversineMiles, formatMiles } from '$lib/utils/geo';
	import type { Unsubscriber } from 'svelte/store';

	type VisibleEntry = { post: Post; distance: number | null };

	let postList: Post[] = [];
	let visibleEntries: VisibleEntry[] = [];
	let loading = true;
	let error = '';
	let currentOrigin: BoardOrigin | null = null;
	let radius = 5;
	const radiusOptions = [1, 2, 5, 10, 20, 50];
	let missingLocationCount = 0;

	onMount(() => {
		let unsubscribe: Unsubscriber | null = null;
		let stopRealtime: (() => void) | null = null;
		let originUnsubscribe: Unsubscriber | null = null;

		const init = async () => {
			try {
				await initializeBoardOrigin();
				originUnsubscribe = boardOrigin.subscribe((value) => {
					currentOrigin = value;
				});

				await posts.loadInitial();
				unsubscribe = posts.subscribe((list) => {
					postList = list;
					loading = false;
				});
				stopRealtime = posts.subscribeRealtime();
			} catch (err) {
				error = err instanceof Error ? err.message : 'Failed to load posts';
				loading = false;
			}
		};

			init();

		return () => {
			unsubscribe?.();
			stopRealtime?.();
			originUnsubscribe?.();
		};
	});

	function handleFilterChange(event: CustomEvent<{ origin: BoardOrigin; radius: number }>) {
		currentOrigin = event.detail.origin;
		radius = event.detail.radius;
	}

	$: visibleEntries =
		currentOrigin != null
			? postList
					.map((post) => {
						const distance = haversineMiles(
							{ lat: currentOrigin!.lat, lng: currentOrigin!.lng },
							{ latitude: post.latitude ?? null, longitude: post.longitude ?? null }
						);
						return {
							post: { ...post, distance_miles: distance },
							distance
						};
					})
					.filter(({ distance }) => distance != null && distance <= radius)
					.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
			: postList.map((post) => ({ post, distance: null }));

	$: missingLocationCount =
		currentOrigin != null
			? postList.filter((post) => post.latitude == null || post.longitude == null).length
			: 0;
</script>

<div class="space-y-4">
	<h1 class="text-3xl font-semibold mb-6">Community Board</h1>

	<div class="p-4 border rounded-lg bg-white space-y-4">
		<div class="flex items-start justify-between gap-3">
			<div>
				<h2 class="text-lg font-semibold">Find posts near you</h2>
				<p class="text-sm text-gray-500">
					Set your search area with autocomplete, your location, or the mini map.
				</p>
			</div>
		</div>

		<LocationFilter
			bind:radius
			radiusOptions={radiusOptions}
			on:change={handleFilterChange}
		/>
	</div>

	{#if currentOrigin}
		<p class="text-sm text-gray-500">
			Showing items within {radius} mi of {currentOrigin.label}
			{#if missingLocationCount > 0}
				<span class="text-xs text-gray-400">
					({missingLocationCount} posts missing coordinates)
				</span>
			{/if}
		</p>
	{/if}

	{#if loading}
		<p class="text-gray-500 text-center py-12">Loading posts...</p>
	{:else if error}
		<p class="text-red-500 text-center py-12">⚠️ {error}</p>
	{:else if visibleEntries.length === 0}
		{#if currentOrigin}
			<div class="text-center py-12 text-gray-400">
				<p class="text-lg">No posts within {radius} miles.</p>
				<p class="text-sm mt-2">Try widening your radius or updating your search area.</p>
			</div>
		{:else}
			<div class="text-center py-12 text-gray-400">
				<p class="text-lg">No posts yet. Be the first to share something!</p>
			</div>
		{/if}
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each visibleEntries as { post, distance } (post.id)}
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
						{#if distance !== null}
							<p class="text-xs text-blue-600 mt-1">{formatMiles(distance)}</p>
						{/if}
						{#if post.is_taken}
							<div class="mt-2 text-xs text-red-600">Taken</div>
						{/if}
					</a>
			{/each}
		</div>
	{/if}
</div>
