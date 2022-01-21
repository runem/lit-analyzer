/**
 * Flattens an array.
 * Use this function to keep support for node 10
 * @param items
 */
export function arrayFlat<T>(items: (T[] | T)[]): T[] {
	return items.flat() as T[];
}

/**
 * Filters an array returning only defined items
 * @param array
 */
export function arrayDefined<T>(array: (T | undefined)[]): T[] {
	return array.filter((item): item is NonNullable<typeof item> => item != null);
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
