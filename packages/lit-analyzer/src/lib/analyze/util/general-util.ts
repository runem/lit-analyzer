import { LitHtmlAttributeModifier } from "../constants.js";

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
	const [, modifier, name] = attributeName.match(/^([.?@])?(.*)/) || ["", "", ""];
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
