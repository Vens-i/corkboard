export type LatLng = {
	lat: number;
	lng: number;
};

export type CoordinatesLike = {
	latitude: number | null;
	longitude: number | null;
};

const EARTH_RADIUS_MILES = 3958.7613;

const toRadians = (value: number) => (value * Math.PI) / 180;

export function haversineMiles(
	origin: LatLng | null,
	target: CoordinatesLike | null
): number | null {
	if (!origin || !target) return null;
	const { lat: originLat, lng: originLng } = origin;
	const { latitude, longitude } = target;

	if (
		originLat == null ||
		originLng == null ||
		latitude == null ||
		longitude == null
	) {
		return null;
	}

	const dLat = toRadians(latitude - originLat);
	const dLon = toRadians(longitude - originLng);
	const lat1 = toRadians(originLat);
	const lat2 = toRadians(latitude);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	const distance = EARTH_RADIUS_MILES * c;
	return Number.isFinite(distance) ? Math.round(distance * 10) / 10 : null;
}

export function formatMiles(distance: number | null): string | null {
	if (distance == null || !Number.isFinite(distance)) return null;
	return `${distance.toFixed(1)} mi`;
}

export const DEFAULT_ORIGIN = {
	lat: 40.7128,
	lng: -74.006
};
