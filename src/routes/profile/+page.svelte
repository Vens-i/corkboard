<script lang="ts">
	export let data;
</script>

<h1 class="text-xl font-semibold mb-3">My posts</h1>
{#if data.posts.length === 0}
	<p class="text-gray-600">No posts yet.</p>
{:else}
	<ul class="space-y-2">
		{#each data.posts as p}
			<li class="border rounded p-3">
				<div class="flex items-center justify-between">
					<a class="font-medium hover:underline" href={`/post/${p.id}`}>{p.title}</a>
					{#if p.is_taken}
						<span class="text-xs px-2 py-1 rounded bg-gray-100">taken</span>
					{/if}
				</div>
				<p class="text-sm text-gray-600 line-clamp-2">{p.description}</p>
			</li>
		{/each}
	</ul>
{/if}
