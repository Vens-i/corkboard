<script lang="ts">
	let title = '';
	let description = '';
	let price = '';
	let location = '';
	let loading = false;
	let error = '';

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, description, price, location })
			});

			if (!response.ok) {
				error = 'Failed to create post';
				return;
			}

			// Reset form
			title = '';
			description = '';
			price = '';
			location = '';
			window.location.href = '/board';
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<div class="max-w-2xl mx-auto">
	<h1 class="text-2xl font-semibold mb-6">Create a New Post</h1>

	{#if error}
		<div class="mb-4 p-3 bg-red-100 text-red-700 rounded">
			{error}
		</div>
	{/if}

	<form on:submit={handleSubmit} class="space-y-4">
		<div>
			<label for="title" class="block text-sm font-medium mb-1">Title *</label>
			<input
				id="title"
				type="text"
				required
				bind:value={title}
				class="w-full px-3 py-2 border rounded"
				placeholder="What are you posting?"
			/>
		</div>

		<div>
			<label for="description" class="block text-sm font-medium mb-1">Description</label>
			<textarea
				id="description"
				bind:value={description}
				class="w-full px-3 py-2 border rounded"
				rows="4"
				placeholder="Tell us more..."
			></textarea>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="price" class="block text-sm font-medium mb-1">Price</label>
				<input
					id="price"
					type="text"
					bind:value={price}
					class="w-full px-3 py-2 border rounded"
					placeholder="e.g., $50"
				/>
			</div>

			<div>
				<label for="location" class="block text-sm font-medium mb-1">Location</label>
				<input
					id="location"
					type="text"
					bind:value={location}
					class="w-full px-3 py-2 border rounded"
					placeholder="e.g., Downtown"
				/>
			</div>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
		>
			{loading ? 'Creating...' : 'Create Post'}
		</button>
	</form>
</div>
