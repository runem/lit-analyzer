import didYouMean, * as dym from "didyoumean2";
import { Omit } from "./general-util";

export interface FindBestMatchOptions<T> {
	threshold?: number;
	caseSensitive?: boolean;
	matchKey: keyof T;
}

/**
 * Finds the best match between a string and elements in a list.
 * @param find
 * @param elements
 * @param options
 */
export function findBestMatch<T extends string | object>(find: string, elements: T[], options: FindBestMatchOptions<T>): T | undefined;
export function findBestMatch<T extends string | object>(find: string, elements: T[], options: FindBestMatchOptions<T>): T | undefined {
	options.caseSensitive = "caseSensitive" in options ? options.caseSensitive : false;
	options.threshold = "threshold" in options ? options.threshold : 0.5;

	return (didYouMean(find, elements, {
		caseSensitive: options.caseSensitive,
		threshold: options.threshold,
		matchPath: [options.matchKey] as [string],
		returnType: dym.ReturnTypeEnums.FIRST_CLOSEST_MATCH,
		trimSpaces: false
	}) as unknown) as T | undefined;
}

export function findBestStringMatch(
	find: string,
	elements: string[],
	options: Omit<FindBestMatchOptions<string>, "matchKey"> = {
		caseSensitive: true,
		threshold: 0.5
	}
): string | undefined {
	const matches = didYouMean(find, elements, options);
	return typeof matches === "string" ? matches : Array.isArray(matches) ? matches[0] : undefined;
}
