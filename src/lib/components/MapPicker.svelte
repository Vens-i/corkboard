<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { loadGoogleMaps } from '$lib/utils/googleMaps';

	type LatLngLiteral = google.maps.LatLngLiteral;

	const DEFAULT_CENTER: LatLngLiteral = { lat: 37.7749, lng: -122.4194 };

	export let lat: number | null = null;
	export let lng: number | null = null;
	export let locationLabel = '';
	export let heightClass = 'h-64';
	export let height = 320; // px
	export let zoom = 13;
	export let autoReverseGeocode = true;
	export let draggable = true;

	const dispatch = createEventDispatcher<{
		change: { lat: number | null; lng: number | null; label: string };
		location: { lat: number; lng: number };
		error: { message: string };
	}>();

	let mapContainer: HTMLDivElement | null = null;
	let map: google.maps.Map | null = null;
	let marker: google.maps.Marker | null = null;
	const listeners: google.maps.MapsEventListener[] = [];

	let locating = false;
	let reverseLookupPending = false;
	let message = '';
	let internalChange = false;
	let messageTimeout: ReturnType<typeof setTimeout> | null = null;

	const clearMessageTimeout = () => {
		if (messageTimeout) {
			clearTimeout(messageTimeout);
			messageTimeout = null;
		}
	};

	const setMessage = (text: string, ttl = 3000) => {
		clearMessageTimeout();
		message = text;
		if (!text) return;
		messageTimeout = setTimeout(() => {
			message = '';
			messageTimeout = null;
		}, ttl);
	};

	const setMarkerPosition = (position: LatLngLiteral) => {
		if (!marker) return;
		marker.setPosition(position);
		if (map) {
			map.panTo(position);
		}
	};

	const reverseGeocode = async (position: LatLngLiteral) => {
		reverseLookupPending = true;
		try {
			const params = new URLSearchParams({
				lat: position.lat.toString(),
				lng: position.lng.toString()
			});
			const response = await fetch(`/api/geocode?${params.toString()}`);
			if (!response.ok) throw new Error('Failed to resolve location name');
			const data = await response.json();
			if (data?.label) {
				locationLabel = data.label;
				dispatch('change', { lat, lng, label: locationLabel });
			}
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Something went wrong while finding the address.';
			dispatch('error', { message });
			setMessage(message);
		} finally {
			reverseLookupPending = false;
		}
	};

	const emitSelection = async (position: LatLngLiteral, opts?: { reverse: boolean }) => {
		internalChange = true;
		lat = position.lat;
		lng = position.lng;
		dispatch('location', { lat: position.lat, lng: position.lng });
		setMarkerPosition(position);
		if (opts?.reverse ?? autoReverseGeocode) {
			await reverseGeocode(position);
		}
		internalChange = false;
		dispatch('change', { lat, lng, label: locationLabel });
	};

	const useMyLocation = () => {
		if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
			setMessage('Geolocation is not supported in this browser.');
			return;
		}
		locating = true;
		setMessage('Locating…');
		navigator.geolocation.getCurrentPosition(
			async ({ coords }) => {
				locating = false;
				const position: LatLngLiteral = { lat: coords.latitude, lng: coords.longitude };
				setMarkerPosition(position);
				await emitSelection(position, { reverse: true });
				setMessage('Using your location', 1500);
			},
			(err) => {
				locating = false;
				const message = err.message || 'Unable to access location.';
				setMessage(message);
				dispatch('error', { message });
			},
			{ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
		);
	};

	onMount(async () => {
		if (!mapContainer || typeof window === 'undefined') return;
		const maps = await loadGoogleMaps();

		const center = lat != null && lng != null ? ({ lat, lng } as LatLngLiteral) : DEFAULT_CENTER;

		map = new maps.Map(mapContainer, {
			center,
			zoom,
			disableDefaultUI: false,
			mapTypeControl: false,
			streetViewControl: false
		});

		marker = new maps.Marker({
			position: center,
			map,
			draggable,
			clickable: false
		});

		const mapClickListener = map.addListener('click', async (event: google.maps.MapMouseEvent) => {
			const point = event.latLng?.toJSON();
			if (!point) return;
			setMarkerPosition(point);
			await emitSelection(point, { reverse: true });
		});
		listeners.push(mapClickListener);

		if (draggable) {
			const markerDragListener = marker.addListener('dragend', async () => {
				const point = marker?.getPosition()?.toJSON();
				if (!point) return;
				await emitSelection(point, { reverse: true });
			});
			listeners.push(markerDragListener);
		}
	});

	onDestroy(() => {
		clearMessageTimeout();
		listeners.forEach((listener) => listener.remove());
		listeners.length = 0;
		if (marker) {
			marker.setMap(null);
			marker = null;
		}
		map = null;
	});

	$: if (map && marker && lat != null && lng != null && !internalChange) {
		const coords: LatLngLiteral = { lat, lng };
		setMarkerPosition(coords);
	}

	$: if (map && marker && (lat == null || lng == null) && !internalChange) {
		marker.setPosition(DEFAULT_CENTER);
		map.setCenter(DEFAULT_CENTER);
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between gap-3">
		<label class="flex-1 min-w-0 block text-sm font-medium">
			<span class="mb-1 block font-medium text-sm leading-tight">Select location</span>
			<input
				class="w-full px-3 py-2 border rounded text-sm"
				placeholder="Neighborhood or description"
				bind:value={locationLabel}
				on:input={() => dispatch('change', { lat, lng, label: locationLabel })}
			/>
		</label>
		<button
			type="button"
			on:click={useMyLocation}
			class="shrink-0 px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-60"
			disabled={locating}
		>
			{locating ? 'Locating…' : 'Use my location'}
		</button>
	</div>

	<div
		class={`relative border rounded overflow-hidden ${heightClass} bg-gray-100`}
		bind:this={mapContainer}
		style={`height:${height}px; min-height:${height}px;`}
	>
		{#if !map}
			<div class="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
				Loading map…
			</div>
		{/if}
	</div>

	<div class="text-xs text-gray-500 min-h-4">
		{#if reverseLookupPending}
			Resolving address…
		{:else if message}
			{message}
		{/if}
	</div>
</div>
