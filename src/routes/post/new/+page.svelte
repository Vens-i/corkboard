<script lang="ts">
	import MapPicker from '$lib/components/MapPicker.svelte';

	let title = '';
	let description = '';
	let price = '';
	let location = '';
	let latitude: number | null = null;
	let longitude: number | null = null;
	let loading = false;
	let error = '';
	let status = '';

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		status = '';

		try {
			const response = await fetch('/api/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					description,
					price,
					location,
					latitude,
					longitude
				})
			});

			if (!response.ok) {
				const payload = await response.json().catch(() => null);
				error = payload?.error ?? 'Failed to create post';
				return;
			}

			// Reset form
			title = '';
			description = '';
			price = '';
			location = '';
			latitude = null;
			longitude = null;
			status = 'Post created! Redirecting…';
			window.location.href = '/board';
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function handleMapChange(event: CustomEvent<{ lat: number | null; lng: number | null; label: string }>) {
		latitude = event.detail.lat;
		longitude = event.detail.lng;
		location = event.detail.label;
	}

	function handleMapError(event: CustomEvent<{ message: string }>) {
		error = event.detail.message;
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
			<MapPicker bind:locationLabel={location} bind:lat={latitude} bind:lng={longitude} on:change={handleMapChange} on:error={handleMapError} />
		</div>

		<button
			type="submit"
			disabled={loading}
			class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
		>
			{loading ? 'Creating...' : 'Create Post'}
		</button>

		{#if status}
			<p class="text-sm text-gray-500 text-center">{status}</p>
		{/if}
	</form>
</div>
