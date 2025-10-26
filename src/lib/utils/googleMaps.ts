let mapsPromise: Promise<typeof google.maps> | null = null;

export const loadGoogleMaps = () => {
	if (mapsPromise) return mapsPromise;

	const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	if (!apiKey) {
		throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY. Add it to your environment.');
	}

	mapsPromise = import('@googlemaps/js-api-loader').then(async ({ Loader }) => {
		const loader = new Loader({
			apiKey,
			version: 'weekly',
			libraries: ['places']
		});
		await loader.load();
		return google.maps;
	});

	return mapsPromise;
};
