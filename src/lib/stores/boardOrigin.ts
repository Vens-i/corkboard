import { browser } from '$app/environment';
import { readable, writable, type Readable } from 'svelte/store';
import { DEFAULT_ORIGIN } from '$lib/utils/geo';

export type BoardOrigin = {
	lat: number;
	lng: number;
	label: string;
};

const STORAGE_KEY = 'corkboard:recent-origins';
const MAX_RECENTS = 5;

const initialOrigin: BoardOrigin = {
	lat: DEFAULT_ORIGIN.lat,
	lng: DEFAULT_ORIGIN.lng,
	label: 'New York, NY'
};

const internalOrigin = writable<BoardOrigin>(initialOrigin);
const internalRecents = writable<BoardOrigin[]>([]);

let initialized = false;

const readRecents = (): BoardOrigin[] => {
	if (!browser) return [];
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as BoardOrigin[];
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter(
				(item) =>
					item &&
					typeof item.lat === 'number' &&
					typeof item.lng === 'number' &&
					typeof item.label === 'string'
			)
			.slice(0, MAX_RECENTS);
	} catch {
		return [];
	}
};

const writeRecents = (items: BoardOrigin[]) => {
	if (!browser) return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENTS)));
	} catch {
		// ignore storage failures
	}
};

const detectBrowserOrigin = (): Promise<BoardOrigin | null> =>
	new Promise((resolve) => {
		if (!browser || !('geolocation' in navigator)) {
			resolve(null);
			return;
		}
		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				resolve({
					lat: coords.latitude,
					lng: coords.longitude,
					label: 'Current location'
				});
			},
			() => resolve(null),
			{ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
		);
	});

export const boardOrigin: Readable<BoardOrigin> = readable(initialOrigin, (set) => {
	const unsubscribe = internalOrigin.subscribe((value) => set(value));
	return unsubscribe;
});

export const recentOrigins: Readable<BoardOrigin[]> = readable<BoardOrigin[]>([], (set) => {
	const unsubscribe = internalRecents.subscribe((value) => set(value));
	return unsubscribe;
});

export const setBoardOrigin = (origin: BoardOrigin) => {
	internalOrigin.set(origin);

	if (!browser) return;

	const recents = readRecents().filter(
		(item) => !(item.lat === origin.lat && item.lng === origin.lng && item.label === origin.label)
	);
	recents.unshift(origin);
	internalRecents.set(recents.slice(0, MAX_RECENTS));
	writeRecents(recents);
};

export const initializeBoardOrigin = async () => {
	if (initialized) return;
	initialized = true;

	if (!browser) {
		internalOrigin.set(initialOrigin);
		internalRecents.set([]);
		return;
	}

	const stored = readRecents();
	if (stored.length > 0) {
		internalOrigin.set(stored[0]);
		internalRecents.set(stored);
		return;
	}

	const detected = await detectBrowserOrigin();
	if (detected) {
		setBoardOrigin(detected);
		return;
	}

	internalOrigin.set(initialOrigin);
	internalRecents.set([]);
};

export const clearRecents = () => {
	internalRecents.set([]);
	if (!browser) return;
	try {
		window.localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore
	}
};
