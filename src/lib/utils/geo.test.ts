import { describe, expect, it } from 'vitest';
import { haversineMiles, formatMiles } from './geo';

describe('haversineMiles', () => {
	it('returns null when origin is missing', () => {
		expect(haversineMiles(null, { latitude: 10, longitude: 10 })).toBeNull();
	});

	it('returns null when target coordinates are missing', () => {
		expect(haversineMiles({ lat: 10, lng: 10 }, { latitude: null, longitude: null })).toBeNull();
	});

	it('calculates the great-circle distance rounded to one decimal place', () => {
		const result = haversineMiles(
			{ lat: 40.7128, lng: -74.006 }, // NYC
			{ latitude: 34.0522, longitude: -118.2437 } // LA
		);

		expect(result).toBeCloseTo(2445.6, 1);
	});
});

describe('formatMiles', () => {
	it('returns null for invalid inputs', () => {
		expect(formatMiles(null)).toBeNull();
		expect(formatMiles(Number.NaN)).toBeNull();
	});

	it('formats to one decimal place with unit', () => {
		expect(formatMiles(12.345)).toBe('12.3 mi');
	});
});
