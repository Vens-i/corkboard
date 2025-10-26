import { describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
	it('delays execution until wait period', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const debounced = debounce(spy, 300);

		debounced('a');
		debounced('b');

		expect(spy).not.toHaveBeenCalled();

		vi.advanceTimersByTime(299);
		expect(spy).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith('b');

		vi.useRealTimers();
	});

	it('cancels pending call', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const debounced = debounce(spy, 200);

		debounced();
		debounced.cancel();

		vi.advanceTimersByTime(500);
		expect(spy).not.toHaveBeenCalled();

		vi.useRealTimers();
	});

	it('flush executes immediately', () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		const debounced = debounce(spy, 200);

		debounced('payload');
		debounced.flush();

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith('payload');

		vi.useRealTimers();
	});
});
