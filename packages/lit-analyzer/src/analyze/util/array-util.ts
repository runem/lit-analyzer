/**
 * Flattens a nested array.
 * @param items
 */
export function flatten<T>(items: T[][]): T[] {
	return items.reduce((acc, item) => [...acc, ...item], []);
}

/**
 * Joins an array with a custom final splitter
 * @param items
 * @param splitter
 * @param finalSplitter
 */
export function joinArray(items: string[], splitter = ", ", finalSplitter = "or"): string {
	return items.join(splitter).replace(/, ([^,]*)$/, ` ${finalSplitter} $1`);
}
