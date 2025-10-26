<script lang="ts">
	import { posts } from '$lib/stores/posts';
	import CorkGrid from '$lib/components/CorkGrid.svelte';

	let items = [] as any[];

	const stop = posts.subscribeRealtime();
	posts.loadInitial();
	const unsub = posts.subscribe((v) => (items = v));

	import { onDestroy } from 'svelte';
	onDestroy(() => {
		unsub();
		stop?.();
	});
</script>

<h1 class="text-xl font-semibold mb-3">Board</h1>
<CorkGrid {items} />
