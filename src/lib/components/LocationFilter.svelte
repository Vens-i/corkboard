<script lang="ts">
	import { browser } from '$app/environment';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import MapMiniPicker from '$lib/components/MapMiniPicker.svelte';
	import {
		boardOrigin,
		initializeBoardOrigin,
		recentOrigins,
		setBoardOrigin,
		type BoardOrigin
	} from '$lib/stores/boardOrigin';
	import { debounce } from '$lib/utils/debounce';
	import { getNextActiveIndex, isNavigationKey } from '$lib/components/location-filter/keyboard';

	type Suggestion = {
		label: string;
		lat: number;
		lng: number;
	};

	type FilterChangeDetail = {
		origin: BoardOrigin;
		radius: number;
	};

	const dispatch = createEventDispatcher<{
		change: FilterChangeDetail;
		error: { message: string };
	}>();

	let origin: BoardOrigin = {
		lat: 0,
		lng: 0,
		label: ''
	};

	export let radius = 5;
	export let radiusOptions = [1, 2, 5, 10, 20, 50];
	export let disabled = false;

	let query = '';
	let suggestions: Suggestion[] = [];
	let loading = false;
	let fetchError = '';
	let open = false;
	let activeIndex = -1;
	let showMap = false;
	let infoMessage = '';
	let useLocationBusy = false;
	let recentList: BoardOrigin[] = [];
	let inputEl: HTMLInputElement | null = null;
	let blurTimeout: ReturnType<typeof setTimeout> | null = null;
	let abortController: AbortController | null = null;
	let currentFetchToken = 0;
	let isEditing = false;

	const sessionCache = new Map<string, Suggestion[]>();

	const instanceId =
		'location-filter-' +
		(typeof crypto !== 'undefined' && crypto.randomUUID
			? crypto.randomUUID()
			: Math.random().toString(36).slice(2, 10));
	const inputId = `${instanceId}-input`;
	const listboxId = `${instanceId}-listbox`;

	const originUnsubscribe = boardOrigin.subscribe((value) => {
		origin = value;
		if (!isEditing) {
			query = value.label ?? '';
		}
	});

	const recentsUnsubscribe = recentOrigins.subscribe((value) => {
		recentList = value;
	});

	onMount(async () => {
		await initializeBoardOrigin();
		query = origin.label ?? '';
	});

	onDestroy(() => {
		originUnsubscribe();
		recentsUnsubscribe();
		if (blurTimeout) clearTimeout(blurTimeout);
		if (abortController) abortController.abort();
		debouncedSearch.cancel();
	});

	const debouncedSearch = debounce(async (term: string) => {
		await performSearch(term);
	}, 300);

	const normalize = (value: string) => value.trim().toLowerCase();

	const performSearch = async (term: string) => {
		const normalized = normalize(term);
		if (normalized.length < 3) {
			suggestions = [];
			loading = false;
			fetchError = '';
			open = false;
			return;
		}

		if (sessionCache.has(normalized)) {
			suggestions = sessionCache.get(normalized) ?? [];
			loading = false;
			open = suggestions.length > 0;
			return;
		}

		if (abortController) {
			abortController.abort();
		}

		abortController = new AbortController();
		const token = ++currentFetchToken;

		try {
			const response = await fetch(`/api/geo-search?q=${encodeURIComponent(term)}`, {
				signal: abortController.signal
			});
			if (!response.ok) {
				throw new Error(response.status === 429 ? 'Too many requests. Try again shortly.' : 'Search failed.');
			}

			const data = (await response.json()) as Suggestion[];
			const candidates = data.slice(0, 8);
			sessionCache.set(normalized, candidates);
			if (token === currentFetchToken) {
				suggestions = candidates;
				fetchError = candidates.length === 0 ? 'No matches. Try a broader search.' : '';
				open = true;
			}
		} catch (err) {
			if (token !== currentFetchToken) return;
			if ((err as Error).name === 'AbortError') return;
			const message =
				err instanceof Error ? err.message : 'Unable to search right now. Try again later.';
			fetchError = message;
			dispatch('error', { message });
			open = true;
		} finally {
			if (token === currentFetchToken) {
				loading = false;
			}
		}
	};

	const closeSuggestions = () => {
		open = false;
		activeIndex = -1;
	};

	const commitOrigin = (next: BoardOrigin) => {
		setBoardOrigin(next);
		debouncedSearch.cancel();
		query = next.label ?? '';
		isEditing = false;
		closeSuggestions();
		dispatch('change', { origin: next, radius });
	};

	const handleSelectSuggestion = (suggestion: Suggestion) => {
		const next: BoardOrigin = {
			lat: suggestion.lat,
			lng: suggestion.lng,
			label: suggestion.label
		};
		commitOrigin(next);
	};

	const handleUseCurrentLocation = () => {
		if (!browser || !('geolocation' in navigator)) {
			infoMessage = 'Geolocation is not available in this browser.';
			return;
		}
		useLocationBusy = true;
		infoMessage = 'Finding your location…';
		navigator.geolocation.getCurrentPosition(
			async ({ coords }) => {
				useLocationBusy = false;
				infoMessage = 'Location found.';
				try {
					const params = new URLSearchParams({
						lat: coords.latitude.toString(),
						lng: coords.longitude.toString()
					});
					const response = await fetch(`/api/geocode?${params.toString()}`);
					if (!response.ok) throw new Error('Reverse geocode failed.');
					const payload = await response.json();
					const label: string =
						payload?.label ??
						payload?.address?.display_name ??
						'Current location';
					commitOrigin({ lat: coords.latitude, lng: coords.longitude, label });
				} catch (err) {
					const message =
						err instanceof Error
							? err.message
							: 'Unable to update your location right now.';
					infoMessage = message;
					dispatch('error', { message });
				}
			},
			(err) => {
				useLocationBusy = false;
				const message = err.message || 'Unable to access your location.';
				infoMessage = message;
				dispatch('error', { message });
			},
			{ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
		);
	};

	const handleInput = (event: Event) => {
		const target = event.target as HTMLInputElement;
		query = target.value;
		isEditing = true;
		fetchError = '';
		loading = query.trim().length >= 3;
		open = true;
		activeIndex = -1;
		debouncedSearch(query);
	};

const handleBlur = () => {
	isEditing = false;
	blurTimeout = setTimeout(() => {
			closeSuggestions();
			query = origin.label ?? '';
		}, 150);
	};

	const handleInputFocus = () => {
		if (blurTimeout) {
			clearTimeout(blurTimeout);
			blurTimeout = null;
		}
	};

	const handleKeyDown = (event: KeyboardEvent) => {
	if (!open) return;
	if (isNavigationKey(event.key)) {
		event.preventDefault();
		if (suggestions.length === 0) return;
		activeIndex = getNextActiveIndex(event.key, activeIndex, suggestions.length);
		return;
	}
	if (event.key === 'Enter') {
		if (activeIndex >= 0 && activeIndex < suggestions.length) {
			event.preventDefault();
			handleSelectSuggestion(suggestions[activeIndex]);
		}
	} else if (event.key === 'Escape') {
			event.preventDefault();
			closeSuggestions();
			query = origin.label ?? '';
		}
	};

	const handleClear = () => {
		query = '';
		isEditing = true;
		suggestions = [];
		fetchError = '';
		open = false;
		inputEl?.focus();
	};

	const handleRadiusChange = (event: Event) => {
		const target = event.target as HTMLSelectElement;
		const next = Number.parseFloat(target.value);
		if (!Number.isFinite(next)) return;
		radius = next;
		if (origin) {
			dispatch('change', { origin, radius });
		}
	};

	const handleRecentClick = (item: BoardOrigin) => {
		commitOrigin(item);
	};

	const handleMapSelect = (event: CustomEvent<BoardOrigin>) => {
		commitOrigin(event.detail);
		showMap = false;
	};

	const handleMapError = (event: CustomEvent<{ message: string }>) => {
		infoMessage = event.detail.message;
		dispatch('error', { message: event.detail.message });
	};
</script>

<div class="space-y-4" aria-live="polite">
	<div class="space-y-2">
		<label class="block text-sm font-medium" for={inputId}>
			Search area
		</label>
		<div class="relative">
			<input
				bind:this={inputEl}
				id={inputId}
				type="text"
				class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				placeholder="Search by address, city, or ZIP"
				bind:value={query}
				aria-autocomplete="list"
				role="combobox"
				aria-expanded={open}
				aria-controls={listboxId}
				aria-activedescendant={activeIndex >= 0 ? `${instanceId}-option-${activeIndex}` : undefined}
				on:input={handleInput}
				on:keydown={handleKeyDown}
				on:focus={handleInputFocus}
				on:blur={handleBlur}
				disabled={disabled}
			/>
			{#if query}
				<button
					type="button"
					class="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
					on:click={handleClear}
					aria-label="Clear search"
				>
					&times;
				</button>
			{/if}
		</div>
		{#if infoMessage}
			<p class="text-xs text-gray-500">{infoMessage}</p>
		{/if}
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<button
			type="button"
			class="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-60"
			on:click={handleUseCurrentLocation}
			disabled={disabled || useLocationBusy}
		>
			{useLocationBusy ? 'Locating…' : 'Use current location'}
		</button>
		<button
			type="button"
			class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
			on:click={() => (showMap = !showMap)}
			aria-expanded={showMap}
		>
			{showMap ? 'Hide map' : 'Change on map'}
		</button>
		<div class="flex items-center gap-2 ml-auto">
			<label class="text-sm font-medium" for={`${instanceId}-radius`}>Within</label>
			<select
				id={`${instanceId}-radius`}
				class="px-3 py-2 border rounded text-sm"
				on:change={handleRadiusChange}
				bind:value={radius}
			>
				{#each radiusOptions as option}
					<option value={option}>{option} miles</option>
				{/each}
			</select>
		</div>
	</div>

	{#if showMap}
		<div class="border rounded p-2 space-y-2">
			<p class="text-xs text-gray-500">Tap the map to choose a new origin.</p>
			<MapMiniPicker
				lat={origin.lat}
				lng={origin.lng}
				radiusMiles={radius}
				on:select={handleMapSelect}
				on:error={handleMapError}
				heightClass="h-48"
			/>
		</div>
	{/if}

	{#if query.trim().length === 0 && recentList.length > 0}
		<div class="flex flex-wrap gap-2">
			<span class="text-xs text-gray-500 mt-1">Recent:</span>
			{#each recentList as item (item.label + item.lat + item.lng)}
				<button
					type="button"
					class="px-3 py-1 rounded-full bg-gray-100 text-sm hover:bg-gray-200"
					on:click={() => handleRecentClick(item)}
				>
					{item.label}
				</button>
			{/each}
		</div>
	{/if}

	{#if open}
		<div class="relative">
			<ul
				id={listboxId}
				role="listbox"
				class="absolute z-10 mt-1 w-full bg-white border rounded shadow"
			>
				{#if loading}
					<li class="px-3 py-2 text-sm text-gray-500">Searching…</li>
				{:else if fetchError}
					<li class="px-3 py-2 text-sm text-red-500">{fetchError}</li>
				{:else if suggestions.length === 0}
					<li class="px-3 py-2 text-sm text-gray-500">
						No matches. Try another city or ZIP.
					</li>
				{:else}
				{#each suggestions as suggestion, index}
					<li
						id={`${instanceId}-option-${index}`}
						role="option"
						aria-selected={index === activeIndex}
						class={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
							index === activeIndex ? 'bg-blue-100' : ''
						}`}
						tabindex="-1"
						on:mousedown|preventDefault={() => handleSelectSuggestion(suggestion)}
						on:mouseover={() => (activeIndex = index)}
						on:focus={() => (activeIndex = index)}
					>
						{suggestion.label}
					</li>
				{/each}
				{/if}
			</ul>
		</div>
	{/if}
</div>
