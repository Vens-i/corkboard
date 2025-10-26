<script lang="ts">
	export let data;
	const user = data.user;
</script>

<div class="min-h-screen flex flex-col">
	<header class="border-b p-4 flex items-center justify-between">
		<a href="/board" class="font-semibold">Corkboard</a>
		<nav class="flex items-center gap-3">
			<a href="/board" class="hover:underline">Board</a>
			{#if user}
				<a href="/post/new" class="hover:underline">New Post</a>
				<a href="/profile" class="hover:underline">Profile</a>
				<form method="post" action="/auth?logout" class="inline">
					<button class="px-3 py-1 border rounded">Logout</button>
				</form>
			{:else}
				<a href="/auth" class="px-3 py-1 border rounded">Login</a>
			{/if}
		</nav>
	</header>

	<main class="flex-1 p-4"><slot /></main>
</div>
