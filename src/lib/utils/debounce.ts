export type DebouncedFunction<T extends (...args: any[]) => void> = ((
	...args: Parameters<T>
) => void) & {
	cancel: () => void;
	flush: () => void;
};

export function debounce<T extends (...args: any[]) => void>(
	fn: T,
	wait = 300
): DebouncedFunction<T> {
	let timeout: ReturnType<typeof setTimeout> | null = null;
	let lastArgs: Parameters<T> | null = null;

	const debounced = (...args: Parameters<T>) => {
		lastArgs = args;
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			timeout = null;
			if (lastArgs) {
				fn(...lastArgs);
				lastArgs = null;
			}
		}, wait);
	};

	debounced.cancel = () => {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
		lastArgs = null;
	};

	debounced.flush = () => {
		if (!timeout || !lastArgs) return;
		clearTimeout(timeout);
		timeout = null;
		fn(...lastArgs);
		lastArgs = null;
	};

	return debounced;
}
