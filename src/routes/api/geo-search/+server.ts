import { json } from '@sveltejs/kit';
import { GOOGLE_MAPS_SERVER_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

type Suggestion = {
	label: string;
	lat: number;
	lng: number;
};

const AUTOCOMPLETE_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/details/json';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 30;

const cache = new Map<string, { timestamp: number; data: Suggestion[] }>();
const rateLimit = new Map<string, { windowStart: number; count: number }>();

const normalizeQuery = (value: string) => value.trim().toLowerCase();

const enforceRateLimit = (ip: string): boolean => {
	const now = Date.now();
	const record = rateLimit.get(ip);
	if (!record) {
		rateLimit.set(ip, { windowStart: now, count: 1 });
		return true;
	}

	const elapsed = now - record.windowStart;
	if (elapsed > RATE_LIMIT_WINDOW) {
		rateLimit.set(ip, { windowStart: now, count: 1 });
		return true;
	}

	if (record.count >= RATE_LIMIT_MAX) {
		return false;
	}

	record.count += 1;
	return true;
};

const fetchPlaceDetails = async (event: Parameters<RequestHandler>[0], placeId: string) => {
	const params = new URLSearchParams({
		place_id: placeId,
		fields: 'geometry,formatted_address',
		key: GOOGLE_MAPS_SERVER_KEY
	});
	const response = await event.fetch(`${DETAILS_ENDPOINT}?${params.toString()}`);
	if (!response.ok) return null;
	const payload = await response.json();
	if (payload.status !== 'OK' || !payload.result?.geometry?.location) return null;
	const { lat, lng } = payload.result.geometry.location as { lat: number; lng: number };
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
	return { lat, lng };
};

export const GET: RequestHandler = async (event) => {
	const qParam = event.url.searchParams.get('q') ?? '';
	const query = qParam.trim();
	if (query.length < 3) {
		return json([], {
			headers: {
				'Cache-Control': 'public, max-age=300'
			}
		});
	}

	const ip = event.getClientAddress();
	if (!enforceRateLimit(ip)) {
		return json({ error: 'Too many requests' }, { status: 429 });
	}

	if (!GOOGLE_MAPS_SERVER_KEY) {
		return json({ error: 'Places search is not configured.' }, { status: 500 });
	}

	const normalized = normalizeQuery(query);
	const cached = cache.get(normalized);
	const now = Date.now();
	if (cached && now - cached.timestamp < CACHE_TTL) {
		return json(cached.data, {
			headers: {
				'Cache-Control': 'public, max-age=3600'
			}
		});
	}

	try {
	const params = new URLSearchParams({
		input: query,
		types: 'geocode',
		key: GOOGLE_MAPS_SERVER_KEY
	});

	const response = await event.fetch(`${AUTOCOMPLETE_ENDPOINT}?${params.toString()}`);
	if (!response.ok) {
		return json({ error: 'Places lookup failed' }, { status: response.status });
	}

	const payload = await response.json();
	if (payload.status !== 'OK' || !Array.isArray(payload.predictions)) {
		return json({ error: 'No predictions found' }, { status: 404 });
	}

	const predictions = payload.predictions.slice(0, 8) as Array<{
		place_id: string;
		description: string;
	}>;

	const suggestionsWithCoords = await Promise.all(
		predictions.map(async (prediction) => {
			const coords = await fetchPlaceDetails(event, prediction.place_id);
			if (!coords) return null;
			return {
				label: prediction.description,
				lat: coords.lat,
				lng: coords.lng
			} satisfies Suggestion;
		})
	);

	const suggestions = suggestionsWithCoords.filter(Boolean) as Suggestion[];
	cache.set(normalized, { timestamp: now, data: suggestions });

	return json(suggestions, {
		headers: {
			'Cache-Control': 'public, max-age=3600'
		}
	});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unexpected error';
		return json({ error: message }, { status: 500 });
	}
};
