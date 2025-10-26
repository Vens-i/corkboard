export type NavigationKey = 'ArrowDown' | 'ArrowUp';

export const isNavigationKey = (key: string): key is NavigationKey =>
	key === 'ArrowDown' || key === 'ArrowUp';

export const getNextActiveIndex = (
	key: NavigationKey,
	currentIndex: number,
	total: number
): number => {
	if (total <= 0) return -1;

	const normalizedIndex = Number.isInteger(currentIndex) ? currentIndex : -1;

	if (key === 'ArrowDown') {
		if (normalizedIndex < 0) return 0;
		return normalizedIndex >= total - 1 ? 0 : normalizedIndex + 1;
	}

	if (normalizedIndex <= 0) {
		return total - 1;
	}

	return normalizedIndex - 1;
};
