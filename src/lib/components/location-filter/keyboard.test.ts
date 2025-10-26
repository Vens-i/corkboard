import { describe, expect, it } from 'vitest';
import { getNextActiveIndex, isNavigationKey } from './keyboard';

describe('isNavigationKey', () => {
	it('identifies supported keys', () => {
		expect(isNavigationKey('ArrowDown')).toBe(true);
		expect(isNavigationKey('ArrowUp')).toBe(true);
		expect(isNavigationKey('Enter')).toBe(false);
	});
});

describe('getNextActiveIndex', () => {
	it('returns -1 when list is empty', () => {
		expect(getNextActiveIndex('ArrowDown', 0, 0)).toBe(-1);
	});

	it('cycles forward with ArrowDown', () => {
		const total = 3;
		expect(getNextActiveIndex('ArrowDown', -1, total)).toBe(0);
		expect(getNextActiveIndex('ArrowDown', 0, total)).toBe(1);
		expect(getNextActiveIndex('ArrowDown', 2, total)).toBe(0);
	});

	it('cycles backward with ArrowUp', () => {
		const total = 3;
		expect(getNextActiveIndex('ArrowUp', -1, total)).toBe(2);
		expect(getNextActiveIndex('ArrowUp', 0, total)).toBe(2);
		expect(getNextActiveIndex('ArrowUp', 2, total)).toBe(1);
	});
});
