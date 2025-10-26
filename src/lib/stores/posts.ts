import { writable } from 'svelte/store';
import type { Post } from '$lib/types';
import { supabase } from '$lib/supabaseClient';

const list = writable<Post[]>([]);

async function loadInitial() {
	const { data, error } = await supabase()
		.from('posts')
		.select('*')
		.order('created_at', { ascending: false });
	if (!error && data) list.set(data as Post[]);
}

function subscribeRealtime() {
	const client = supabase();
	const channel = client
		.channel('posts-realtime')
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'posts' },
			(payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new?: Post; old?: Post }) => {
				list.update((curr) => {
					const next = [...curr];
					if (payload.eventType === 'INSERT' && payload.new) {
						next.unshift(payload.new);
					} else if (payload.eventType === 'UPDATE' && payload.new) {
						const idx = next.findIndex((p) => p.id === payload.new!.id);
						if (idx !== -1) next[idx] = payload.new!;
					} else if (payload.eventType === 'DELETE' && payload.old) {
						const idx = next.findIndex((p) => p.id === payload.old!.id);
						if (idx !== -1) next.splice(idx, 1);
					}
					return next;
				});
			}
		)
		.subscribe();

	return () => client.removeChannel(channel);
}

export const posts = { subscribe: list.subscribe, loadInitial, subscribeRealtime };
