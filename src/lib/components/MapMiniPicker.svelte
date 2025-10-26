<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import type { BoardOrigin } from '$lib/stores/boardOrigin';
	import { DEFAULT_ORIGIN } from '$lib/utils/geo';
	import { loadGoogleMaps } from '$lib/utils/googleMaps';

	type LatLngLiteral = google.maps.LatLngLiteral;

	const DEFAULT_CENTER: LatLngLiteral = { lat: DEFAULT_ORIGIN.lat, lng: DEFAULT_ORIGIN.lng };
	const METERS_PER_MILE = 1609.344;

	const dispatch = createEventDispatcher<{
		select: BoardOrigin;
		error: { message: string };
	}>();

	export let lat: number | null = null;
	export let lng: number | null = null;
	export let heightClass = 'h-48';
	export let zoom = 12;
	export let radiusMiles: number | null = null;
export let height = 240; // px

	let mapContainer: HTMLDivElement | null = null;
	let map: google.maps.Map | null = null;
	let marker: google.maps.Marker | null = null;
	let radiusCircle: google.maps.Circle | null = null;
	const listeners: google.maps.MapsEventListener[] = [];

	let isInitializing = true;
	let message = '';
	let messageTimeout: ReturnType<typeof setTimeout> | null = null;

	const setMessage = (value: string, ttl = 2500) => {
		if (messageTimeout) {
			clearTimeout(messageTimeout);
			messageTimeout = null;
		}
		message = value;
		if (!value) return;
		messageTimeout = setTimeout(() => {
			message = '';
			messageTimeout = null;
		}, ttl);
	};

	const getCenter = (): LatLngLiteral => {
		if (lat != null && lng != null) return { lat, lng };
		return DEFAULT_CENTER;
	};

	const updateMarker = (position: LatLngLiteral) => {
		if (!marker) return;
		marker.setPosition(position);
		if (map) {
			map.panTo(position);
		}
		if (radiusCircle) {
			radiusCircle.setCenter(position);
		}
	};

	const ensureRadiusCircle = () => {
		if (!map) return;
		const radiusMeters =
			radiusMiles != null && radiusMiles > 0 ? radiusMiles * METERS_PER_MILE : null;
		if (radiusMeters == null) {
			if (radiusCircle) {
				radiusCircle.setMap(null);
				radiusCircle = null;
			}
			return;
		}
		if (!radiusCircle) {
			radiusCircle = new google.maps.Circle({
				map,
				strokeColor: '#2563eb',
				strokeOpacity: 0.6,
				strokeWeight: 1,
				fillColor: '#3b82f6',
				fillOpacity: 0.1
			});
		}
		radiusCircle.setRadius(radiusMeters);
		radiusCircle.setCenter(getCenter());
	};

	const reverseGeocode = async (position: LatLngLiteral): Promise<BoardOrigin> => {
		const params = new URLSearchParams({
			lat: position.lat.toString(),
			lng: position.lng.toString()
		});
		const response = await fetch(`/api/geocode?${params.toString()}`);
		if (!response.ok) throw new Error('Failed to resolve location.');
		const payload = await response.json();
		const label: string =
			payload?.label ?? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`;
		return {
			lat: position.lat,
			lng: position.lng,
			label
		};
	};

	const handleSelect = async (position: LatLngLiteral) => {
		try {
			updateMarker(position);
			setMessage('Selecting…', 1500);
			const origin = await reverseGeocode(position);
			setMessage('Location updated');
			dispatch('select', origin);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Unable to update location right now.';
			setMessage(message, 4000);
			dispatch('error', { message });
		}
	};

	onMount(async () => {
		if (!mapContainer || typeof window === 'undefined') return;
		const maps = await loadGoogleMaps();

		const start = getCenter();

		map = new maps.Map(mapContainer, {
			center: start,
			zoom,
			disableDefaultUI: true,
			zoomControl: true,
			mapTypeControl: false,
			streetViewControl: false
		});

		marker = new maps.Marker({
			position: start,
			map,
			draggable: false,
			clickable: false
		});

		ensureRadiusCircle();

	const mapClickListener = map.addListener('click', async (event: google.maps.MapMouseEvent) => {
			const point = event.latLng?.toJSON();
			if (!point) return;
			await handleSelect(point);
		});
		listeners.push(mapClickListener);

		isInitializing = false;
		setMessage('Tap to pick a spot', 2000);
	});

	onDestroy(() => {
		if (messageTimeout) {
			clearTimeout(messageTimeout);
			messageTimeout = null;
		}
		listeners.forEach((listener) => listener.remove());
		listeners.length = 0;
		if (marker) {
			marker.setMap(null);
			marker = null;
		}
		if (radiusCircle) {
			radiusCircle.setMap(null);
			radiusCircle = null;
		}
		map = null;
	});

	$: if (map && marker) {
		updateMarker(getCenter());
	}

	$: if (map) {
		ensureRadiusCircle();
	}
</script>

<div
	class={`relative border rounded ${heightClass} bg-gray-100`}
	bind:this={mapContainer}
	style={`height:${height}px; min-height:${height}px;`}
>
	{#if isInitializing}
		<div class="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
			Loading map…
		</div>
	{/if}
	{#if message}
		<div class="absolute left-2 bottom-2 px-3 py-1 rounded bg-white/90 text-xs text-gray-700 shadow">
			{message}
		</div>
	{/if}
</div>
