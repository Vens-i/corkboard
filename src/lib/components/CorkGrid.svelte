<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import type { Post } from '$lib/types';
	export let items: Post[] = [];
</script>

<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
	{#each items as p}
		<Card post={p} />
	{/each}
</div>
