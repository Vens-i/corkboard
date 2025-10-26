<script lang="ts">
	import { supabase } from '$lib/supabaseClient';
	import { goto } from '$app/navigation';

	let title = '';
	let description = '';
	let file: File | null = null;
	let busy = false;
	let errorMsg = '';

	async function onSubmit(e: Event) {
		e.preventDefault();
		errorMsg = '';
		busy = true;

		const client = supabase();
		const {
			data: { session }
		} = await client.auth.getSession();
		if (!session) {
			busy = false;
			errorMsg = 'Please sign in.';
			return;
		}

		let image_url: string | null = null;
		if (file) {
			const ext = file.name.split('.').pop();
			const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
			const { error: upErr } = await client.storage
				.from('corkboard_uploads')
				.upload(path, file, { upsert: false });
			if (upErr) {
				errorMsg = upErr.message;
				busy = false;
				return;
			}
			const { data } = client.storage.from('corkboard_uploads').getPublicUrl(path);
			image_url = data.publicUrl;
		}

		const { data, error } = await client
			.from('posts')
			.insert({ title, description, image_url })
			.select()
			.single();

		busy = false;
		if (error) {
			errorMsg = error.message;
			return;
		}
		if (data) goto(`/post/${data.id}`);
	}
</script>

<form on:submit|preventDefault={onSubmit} class="max-w-lg space-y-3">
	<div>
		<label class="block text-sm mb-1" for="create-post-title">Title</label>
		<input id="create-post-title" bind:value={title} required class="w-full border rounded p-2" />
	</div>
	<div>
		<label class="block text-sm mb-1" for="create-post-description">Description</label>
		<textarea
			id="create-post-description"
			bind:value={description}
			rows="4"
			class="w-full border rounded p-2"
		></textarea>
	</div>
	<div>
		<label class="block text-sm mb-1" for="create-post-image">Image</label>
		<input
			id="create-post-image"
			type="file"
			accept="image/*"
			on:change={(e: any) => (file = e.currentTarget.files?.[0] ?? null)}
		/>
	</div>
	{#if errorMsg}
		<p class="text-red-600 text-sm">{errorMsg}</p>
	{/if}
	<button disabled={busy} class="px-4 py-2 border rounded">{busy ? 'Saving…' : 'Create'}</button>
</form>
