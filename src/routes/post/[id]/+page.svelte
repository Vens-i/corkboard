<script lang="ts">
	export let data;
</script>

<article class="max-w-2xl mx-auto">
	<h1 class="text-2xl font-semibold mb-2">{data.post.title}</h1>
	{#if data.post.image_url}
		<img
			src={data.post.image_url}
			alt={data.post.title}
			class="w-full h-72 object-cover rounded mb-3"
		/>
	{/if}
	<p class="mb-4">{data.post.description}</p>

	{#if !data.post.is_taken}
		<form method="post" action="?/mark_taken">
			<button type="submit" class="px-4 py-2 border rounded">Mark taken</button>
		</form>
	{:else}
		<div class="px-3 py-2 rounded bg-gray-100 inline-block">Already taken</div>
	{/if}
</article>
