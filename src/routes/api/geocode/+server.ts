import { json } from '@sveltejs/kit';
import { GOOGLE_MAPS_SERVER_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

const GEOCODE_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

type CacheEntry = { timestamp: number; label: string };

const cache = new Map<string, CacheEntry>();

type AddressComponent = { long_name: string; types: string[] };

const buildLabel = (components: AddressComponent[] | undefined, fallback: string) => {
	if (!components) return fallback;
	const getComponent = (types: string[]) =>
		components.find((component) => types.some((type) => component.types.includes(type)))?.long_name;

	const neighborhood = getComponent(['neighborhood', 'sublocality', 'locality']);
	const city =
		getComponent(['locality']) ??
		getComponent(['postal_town']) ??
		getComponent(['administrative_area_level_2']);
	const state = getComponent(['administrative_area_level_1']);

	const parts = [neighborhood, city, state].filter((value) => Boolean(value && value.trim()));
	if (parts.length > 0) return parts.join(', ');
	return fallback;
};

export const GET: RequestHandler = async ({ url, fetch }) => {
	const latParam = url.searchParams.get('lat');
	const lngParam = url.searchParams.get('lng');

	if (!latParam || !lngParam) {
		return json({ error: 'lat and lng parameters are required' }, { status: 400 });
	}

	const lat = Number.parseFloat(latParam);
	const lng = Number.parseFloat(lngParam);

	if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
		return json({ error: 'lat and lng must be valid numbers' }, { status: 400 });
	}

	if (!GOOGLE_MAPS_SERVER_KEY) {
		return json({ error: 'Server geocoding is not configured.' }, { status: 500 });
	}

	const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
	const cached = cache.get(cacheKey);
	const now = Date.now();
	if (cached && now - cached.timestamp < CACHE_TTL_MS) {
		return json({ label: cached.label }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
	}

	try {
		const params = new URLSearchParams({
			latlng: `${lat},${lng}`,
			key: GOOGLE_MAPS_SERVER_KEY
		});
		const response = await fetch(`${GEOCODE_ENDPOINT}?${params.toString()}`);
		if (!response.ok) {
			return json({ error: 'Reverse geocoding failed' }, { status: response.status });
		}
		const payload = await response.json();
		if (payload.status !== 'OK' || !Array.isArray(payload.results) || payload.results.length === 0) {
			return json({ error: 'No matching address found.' }, { status: 404 });
		}

		const primaryResult = payload.results[0];
		const label = buildLabel(primaryResult.address_components, primaryResult.formatted_address);
		cache.set(cacheKey, { timestamp: now, label });

		return json(
			{ label },
			{
				headers: {
					'Cache-Control': 'public, max-age=3600'
				}
			}
		);
	} catch (err) {
		const message =
			err instanceof Error ? err.message : 'Failed to perform reverse geocoding request';
		return json({ error: message }, { status: 500 });
	}
};
