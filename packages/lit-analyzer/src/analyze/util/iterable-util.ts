export function* iterableFlatten<T>(...iterables: Iterable<T>[]): Iterable<T> {
	for (const iterable of iterables) {
		for (const item of iterable) {
			yield item;
		}
	}
}

export function* iterableMap<T, U>(iterable: Iterable<T>, map: (item: T) => U): Iterable<U> {
	for (const item of iterable) {
		yield map(item);
	}
}

export function* iterableFilter<T>(iterable: Iterable<T>, filter: (item: T) => boolean): Iterable<T> {
	for (const item of iterable) {
		if (filter(item)) {
			yield item;
		}
	}
}

export function iterableFind<T>(iterable: Iterable<T>, match: (item: T) => boolean): T | undefined {
	for (const item of iterable) {
		if (match(item)) {
			return item;
		}
	}
	return;
}

export function* iterableUnique<T, U>(iterable: Iterable<T>, on: (item: T) => U): Iterable<T> {
	const unique = new Set<U>();
	for (const item of iterable) {
		const u = on(item);
		if (!unique.has(u)) {
			unique.add(u);
			yield item;
		}
	}
}

export function iterableFirst<T>(iterable: Iterable<T>): T | undefined {
	// noinspection LoopStatementThatDoesntLoopJS
	for (const item of iterable) {
		return item;
	}
	return;
}

export function iterableDefined<T>(iterable: (T | undefined | null)[]): T[] {
	return iterable.filter((i): i is T => i != null);
}
