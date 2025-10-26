<script lang="ts">
	import type { Post } from '$lib/types';
	export let post: Post;
</script>

<a href={`/post/${post.id}`} class="block border rounded overflow-hidden hover:shadow">
	{#if post.image_url}
		<img src={post.image_url} alt={post.title} class="w-full h-40 object-cover" />
	{/if}
	<div class="p-3">
		<h3 class="font-semibold truncate">{post.title}</h3>
		<p class="text-sm line-clamp-2 text-gray-600">{post.description}</p>
	</div>
</a>
