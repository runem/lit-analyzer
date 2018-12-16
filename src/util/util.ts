/**
 * Compares two strings case insensitive.
 * @param strA
 * @param strB
 */
export function caseInsensitiveCmp(strA: string, strB: string): boolean {
	return strA.match(new RegExp(`^${strB}$`, "i")) != null;
}

/**
 * Returns if a position is within start and end.
 * @param position
 * @param start
 * @param end
 */
export function intersects(position: number | { start: number; end: number }, { start, end }: { start: number; end: number }): boolean {
	if (typeof position === "number") {
		return start <= position && position <= end;
	} else {
		return start <= position.start && position.end <= end;
	}
}

/**
 * Flattens a nested array
 * @param items
 */
export function flatten<T>(items: T[][]): T[] {
	return items.reduce((acc, item) => [...acc, ...item], []);
}

export type Newable<T> = { new (...args: any[]): T };

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
