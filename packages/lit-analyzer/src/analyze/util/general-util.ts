import { LitHtmlAttributeModifier } from "../constants";
import { Range } from "../types/range";

/**
 * Compares two strings case insensitive.
 * @param strA
 * @param strB
 */
export function caseInsensitiveEquals(strA: string, strB: string): boolean {
	return strA.localeCompare(strB, undefined, { sensitivity: "accent" }) === 0;
}

/**
 * Returns if a position is within start and end.
 * @param position
 * @param start
 * @param end
 */
export function intersects(position: number | Range, { start, end }: Range): boolean {
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

export function rangeToTSSpan({ start, end }: Range): { start: number; length: number } {
	return { start, length: end - start };
}

export function tsSpanToRange({ start, length }: { start: number; length: number }): Range {
	return { start, end: start + length };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Newable<T> = { new (...args: any[]): T };

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Parses an attribute name returning a name and eg. a modifier.
 * Examples:
 *  - ?disabled="..."
 *  - .myProp="..."
 *  - @click="..."
 * @param attributeName
 */
export function parseLitAttrName(attributeName: string): { name: string; modifier?: LitHtmlAttributeModifier } {
	const [, modifier, name] = attributeName.match(/^([.?@])?(.*)/);
	return { name, modifier: modifier as LitHtmlAttributeModifier };
}

export function lazy<T extends Function>(func: T): T {
	let called = false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let value: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (((...args: any[]) => {
		if (called) return value;
		called = true;
		return (value = func(...args));
	}) as unknown) as T;
}

export function isCustomElementTagName(tagName: string): boolean {
	return tagName.includes("-");
}
